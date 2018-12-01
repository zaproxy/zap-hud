/*
 * Zed Attack Proxy (ZAP) and its related class files.
 *
 * ZAP is an HTTP/HTTPS proxy for assessing web application security.
 *
 * Copyright 2018 The ZAP Development Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.zaproxy.gradle.jh.tasks;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathExpression;
import javax.xml.xpath.XPathExpressionException;
import javax.xml.xpath.XPathFactory;
import org.gradle.api.file.ConfigurableFileCollection;
import org.gradle.api.file.Directory;
import org.gradle.api.file.DirectoryProperty;
import org.gradle.api.file.FileTree;
import org.gradle.api.file.RegularFileProperty;
import org.gradle.api.model.ObjectFactory;
import org.gradle.api.provider.Property;
import org.gradle.api.tasks.CacheableTask;
import org.gradle.api.tasks.Classpath;
import org.gradle.api.tasks.Input;
import org.gradle.api.tasks.InputFile;
import org.gradle.api.tasks.Optional;
import org.gradle.api.tasks.OutputDirectory;
import org.gradle.api.tasks.PathSensitive;
import org.gradle.api.tasks.PathSensitivity;
import org.gradle.api.tasks.SourceTask;
import org.gradle.api.tasks.TaskAction;
import org.gradle.process.ExecResult;
import org.w3c.dom.Document;
import org.xml.sax.SAXException;

@CacheableTask
public class JavaHelpIndexer extends SourceTask {

    public static final String DEFAULT_DB_NAME = "JavaHelpSearch";

    private static final String INDEXER_CLASSNAME = "com.sun.java.help.search.Indexer";

    private static final XPathExpression LANG_HELP_SET_FILE_XPATH_EXPRESSION;

    static {
        String expression = "/helpset/@lang";
        try {
            LANG_HELP_SET_FILE_XPATH_EXPRESSION =
                    XPathFactory.newInstance().newXPath().compile(expression);
        } catch (XPathExpressionException e) {
            throw new JavaHelpIndexerException(
                    "Failed to compile valid XPath expression: " + expression, e);
        }
    }

    private static final String CONF_FILE_ARG = "-c";
    private static final String DB_NAME_ARG = "-db";
    private static final String LOCALE_ARG = "-locale";

    private final RegularFileProperty helpset;

    private final Property<String> dbName;
    private final Property<String> outputPrefix;
    private final ConfigurableFileCollection classpath;

    private final DirectoryProperty destinationDir;

    public JavaHelpIndexer() {
        ObjectFactory objects = getProject().getObjects();

        this.dbName = objects.property(String.class);
        this.outputPrefix = objects.property(String.class);
        this.classpath = getProject().files();

        this.helpset = newInputFile();
        this.destinationDir = newOutputDirectory();

        include("**/*.html");
    }

    @InputFile
    @PathSensitive(PathSensitivity.RELATIVE)
    public RegularFileProperty getHelpset() {
        return helpset;
    }

    @Override
    @PathSensitive(PathSensitivity.RELATIVE)
    public FileTree getSource() {
        return super.getSource();
    }

    @Input
    @Optional
    public Property<String> getDbName() {
        return dbName;
    }

    @Input
    @Optional
    public Property<String> getOutputPrefix() {
        return outputPrefix;
    }

    @OutputDirectory
    public DirectoryProperty getDestinationDir() {
        return destinationDir;
    }

    @Classpath
    public ConfigurableFileCollection getClasspath() {
        return classpath;
    }

    @TaskAction
    public void generate() {
        File helpsetFile = helpset.getAsFile().get();
        String locale = readLocaleFromHelpSetFile(helpsetFile.toPath());

        File wd = getWorkingDirectory();
        prepareWorkingDirectory(wd);

        File conf = new File(getTemporaryDir(), "jhindexer.conf");
        createConfigFile(conf, getIndexPathPrefix(helpsetFile), getSource().getFiles());

        List<String> args = new ArrayList<>();
        args.add(LOCALE_ARG);
        args.add(locale);
        args.add(DB_NAME_ARG);
        args.add(getDbName().get());
        args.add(CONF_FILE_ARG);
        args.add(conf.getAbsolutePath());

        ExecResult result =
                getProject()
                        .javaexec(
                                spec -> {
                                    spec.setClasspath(classpath)
                                            .setWorkingDir(wd.getAbsolutePath());
                                    spec.setMain(INDEXER_CLASSNAME).args(args);
                                    spec.setStandardOutput(System.out).setErrorOutput(System.err);
                                });

        result.assertNormalExitValue();
    }

    private static String getIndexPathPrefix(File helpset) {
        String parent = helpset.getParent();
        if (parent == null) {
            throw new JavaHelpIndexerException("");
        }
        if (parent.endsWith(File.separator)) {
            return parent;
        }
        return parent + File.separator;
    }

    private static void createConfigFile(File configFile, String pathPrefix, Set<File> files) {
        try (Writer w = Files.newBufferedWriter(configFile.toPath(), StandardCharsets.UTF_8)) {
            w.write("IndexRemove ");
            w.write(pathPrefix);
            w.write('\n');
            files.forEach(
                    file -> {
                        try {
                            w.write("File ");
                            w.write(file.getAbsolutePath());
                            w.write('\n');
                        } catch (IOException e) {
                            throw new JavaHelpIndexerException("", e);
                        }
                    });
        } catch (IOException e) {
            throw new JavaHelpIndexerException("", e);
        }
    }

    private File getWorkingDirectory() {
        Directory destDir = destinationDir.get();
        String path = outputPrefix.getOrElse("");
        return path.isEmpty() ? destDir.getAsFile() : destDir.dir(path).getAsFile();
    }

    private void prepareWorkingDirectory(File wd) {
        getProject().delete(wd);
        getProject().mkdir(wd);
    }

    private static String readLocaleFromHelpSetFile(Path helpSetFile) {
        if (!Files.exists(helpSetFile)) {
            throw new JavaHelpIndexerException(
                    "Required helpset file does not exist: "
                            + helpSetFile.toAbsolutePath().toString());
        }

        String language;
        try (InputStream inputStream = new BufferedInputStream(Files.newInputStream(helpSetFile))) {
            DocumentBuilderFactory builderFactory = DocumentBuilderFactory.newInstance();
            builderFactory.setValidating(false);
            builderFactory.setFeature(
                    "http://apache.org/xml/features/nonvalidating/load-external-dtd", false);
            DocumentBuilder builder = builderFactory.newDocumentBuilder();
            Document doc = builder.parse(inputStream);

            language =
                    (String)
                            LANG_HELP_SET_FILE_XPATH_EXPRESSION.evaluate(
                                    doc, XPathConstants.STRING);
        } catch (SAXException
                | ParserConfigurationException
                | IOException
                | XPathExpressionException e) {
            throw new JavaHelpIndexerException(
                    "Failed to extract xml:lang attribute from helpset file.", e);
        }

        if (language == null || language.isEmpty()) {
            throw new JavaHelpIndexerException(
                    "Required helpset xml:lang attribute not found or empty.");
        }

        return language.replace('-', '_');
    }
}
