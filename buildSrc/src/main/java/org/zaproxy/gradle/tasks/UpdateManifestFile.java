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
package org.zaproxy.gradle.tasks;

import java.io.File;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.apache.commons.text.StringEscapeUtils;
import org.apache.tools.ant.filters.ReplaceTokens;
import org.gradle.api.DefaultTask;
import org.gradle.api.file.ConfigurableFileCollection;
import org.gradle.api.file.DirectoryProperty;
import org.gradle.api.file.RegularFileProperty;
import org.gradle.api.model.ObjectFactory;
import org.gradle.api.provider.Property;
import org.gradle.api.tasks.Input;
import org.gradle.api.tasks.InputFile;
import org.gradle.api.tasks.InputFiles;
import org.gradle.api.tasks.Optional;
import org.gradle.api.tasks.OutputDirectory;
import org.gradle.api.tasks.PathSensitive;
import org.gradle.api.tasks.PathSensitivity;
import org.gradle.api.tasks.TaskAction;

public class UpdateManifestFile extends DefaultTask {

    private final RegularFileProperty baseManifest;
    private final DirectoryProperty outputDir;

    private final Property<String> addOnStatus;
    private final Property<String> addOnVersion;
    private final RegularFileProperty changes;
    private final Property<String> zapVersion;
    private final ConfigurableFileCollection zapHomeFiles;

    public UpdateManifestFile() {
        ObjectFactory objectFactory = getProject().getObjects();

        this.baseManifest = newInputFile();
        this.outputDir = newOutputDirectory();

        this.addOnStatus = objectFactory.property(String.class);
        this.addOnVersion = objectFactory.property(String.class);
        this.changes = newInputFile();
        this.zapVersion = objectFactory.property(String.class);
        this.zapHomeFiles = getProject().files();
    }

    @InputFile
    public RegularFileProperty getBaseManifest() {
        return baseManifest;
    }

    @OutputDirectory
    public DirectoryProperty getOutputDir() {
        return outputDir;
    }

    @Input
    public Property<String> getAddOnStatus() {
        return addOnStatus;
    }

    @Input
    public Property<String> getAddOnVersion() {
        return addOnVersion;
    }

    @InputFile
    public RegularFileProperty getChanges() {
        return changes;
    }

    @Input
    public Property<String> getZapVersion() {
        return zapVersion;
    }

    @InputFiles
    @Optional
    @PathSensitive(PathSensitivity.RELATIVE)
    public ConfigurableFileCollection getZapHomeFiles() {
        return zapHomeFiles;
    }

    @TaskAction
    public void update() throws Exception {
        getProject()
                .copy(
                        copySpec -> {
                            copySpec.setFilteringCharset("UTF-8");

                            copySpec.from(baseManifest);
                            copySpec.into(outputDir);

                            Map<String, String> tokens = new HashMap<>();
                            tokens.put("version", addOnVersion.get());
                            tokens.put("status", addOnStatus.get());
                            tokens.put(
                                    "changes", readChangesFile(changes.get().getAsFile().toPath()));
                            tokens.put("zapVersion", zapVersion.get());
                            tokens.put(
                                    "files",
                                    zapHomeFiles.isEmpty()
                                            ? ""
                                            : getManifestFiles(zapHomeFiles.getFiles()));

                            Map<String, Map<String, String>> properties = new HashMap<>();
                            properties.put("tokens", tokens);
                            copySpec.filter(properties, ReplaceTokens.class);
                        });
    }

    private static String readChangesFile(Path file) {
        try {
            return StringEscapeUtils.escapeXml11(
                    new String(Files.readAllBytes(file), StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private String getManifestFiles(Set<File> files) {
        List<String> paths = new ArrayList<>();
        for (File file : files) {
            if (!file.isDirectory()) {
                paths.add(file.getName());
            } else {
                getProject()
                        .fileTree(file)
                        .visit(
                                details -> {
                                    if (!details.isDirectory()) {
                                        paths.add(details.getRelativePath().toString());
                                    }
                                });
            }
        }
        Collections.sort(paths);

        StringBuilder strBuilder = new StringBuilder();
        for (String path : paths) {
            appendManifestFile(strBuilder, path);
        }
        return strBuilder.toString();
    }

    private static void appendManifestFile(StringBuilder stringBuilder, String path) {
        if (stringBuilder.length() != 0) {
            stringBuilder.append('\n');
        }
        stringBuilder.append("\t\t<file>").append(path).append("</file>");
    }
}
