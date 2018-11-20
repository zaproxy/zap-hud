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

import java.io.BufferedWriter;
import java.io.File;
import java.net.URL;
import java.net.URLClassLoader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.ResourceBundle;
import org.gradle.api.DefaultTask;
import org.gradle.api.file.DirectoryProperty;
import org.gradle.api.file.RegularFileProperty;
import org.gradle.api.provider.Property;
import org.gradle.api.tasks.Input;
import org.gradle.api.tasks.InputDirectory;
import org.gradle.api.tasks.Optional;
import org.gradle.api.tasks.OutputFile;
import org.gradle.api.tasks.PathSensitive;
import org.gradle.api.tasks.PathSensitivity;
import org.gradle.api.tasks.SkipWhenEmpty;
import org.gradle.api.tasks.TaskAction;

/**
 * Generates the i18n.js file used by the HUD web UI.
 *
 * <p>The i18n messages are held in the UIMessages* files so that they can be translated via Crowdin
 * but don't have to be loaded into the ZAP Desktop UI or daemon.
 */
public class GenerateI18nJsFile extends DefaultTask {

    private static final String PREFIX = "var I18n = (function() {\n\n\tvar messages = {\n";

    private static final String POSTFIX =
            "\t};\n"
                    + "\n"
                    + "\tVue.use(VueI18n);\n"
                    + "\tvar i18n = new VueI18n({\n"
                    + "\t\tlocale: '<<ZAP_LOCALE>>',\n"
                    + "\t\tfallbackLocale: 'en_GB',\n"
                    + "\t\tmessages: messages\n"
                    + "\t});\n"
                    + "\tnew Vue({ i18n: i18n });\n"
                    + "\n"
                    + "\tfunction i18nt (key) {\n"
                    + "\t\treturn i18n.t(\"message.\" + key);\n"
                    + "\t};\n"
                    + "\n"
                    + "\tfunction setLocale (locale) {\n"
                    + "\t\ti18n.locale = locale;\n"
                    + "\t};\n"
                    + "\n"
                    + "\treturn {\n"
                    + "\t\ti18n: i18n,\n"
                    + "\t\tt: i18nt,\n"
                    + "\t\tsetLocale: setLocale\n"
                    + "\t};\n"
                    + "})();\n";

    private final Property<String> bundleName;
    private final DirectoryProperty srcDir;
    private final Property<Boolean> reviewMode;
    private final RegularFileProperty i18nJsFile;

    public GenerateI18nJsFile() {
        bundleName = getProject().getObjects().property(String.class);
        srcDir = newInputDirectory();
        reviewMode = getProject().getObjects().property(Boolean.class);
        i18nJsFile = newOutputFile();

        setDescription("Generates the i18n.js file used by the HUD web UI.");
    }

    @Input
    public Property<String> getBundleName() {
        return bundleName;
    }

    @InputDirectory
    @SkipWhenEmpty
    @PathSensitive(PathSensitivity.NONE)
    public DirectoryProperty getSrcDir() {
        return srcDir;
    }

    @Input
    @Optional
    public Property<Boolean> getReviewMode() {
        return reviewMode;
    }

    @OutputFile
    public RegularFileProperty getI18nJsFile() {
        return i18nJsFile;
    }

    @TaskAction
    public void generate() throws Exception {
        String bundleBaseName = bundleName.get();
        List<String> langs = new ArrayList<>();
        for (File file :
                getSrcDir()
                        .getAsFileTree()
                        .filter(f -> f.getName().startsWith(bundleBaseName))
                        .getFiles()) {
            String fileName = file.getName();
            int underscore = fileName.indexOf('_');
            if (underscore != -1) {
                langs.add(fileName.substring(underscore + 1, fileName.indexOf(".properties")));
            }
        }

        Collections.sort(langs);
        langs.add(0, "en_GB");

        boolean upperCaseValues = reviewMode.isPresent() ? reviewMode.get() : false;
        URL[] urls = {getSrcDir().getAsFile().get().toURI().toURL()};
        try (URLClassLoader loader = new URLClassLoader(urls)) {
            try (BufferedWriter bw =
                    Files.newBufferedWriter(
                            i18nJsFile.get().getAsFile().toPath(), StandardCharsets.UTF_8)) {
                bw.write(PREFIX);

                for (String lang : langs) {
                    Locale locale = buildLocale(lang);

                    ResourceBundle rb = ResourceBundle.getBundle(bundleBaseName, locale, loader);
                    List<String> keys = Collections.list(rb.getKeys());
                    Collections.sort(keys);
                    bw.write("\t\t" + lang + ": {\n");
                    bw.write("\t\t\tmessage: {\n");

                    for (String key : keys) {
                        bw.write(
                                "\t\t\t\t"
                                        + key
                                        + ": '"
                                        + cleanValue(upperCaseValues, rb.getString(key))
                                        + "',\n");
                    }
                    bw.write("\t\t\t}\n");
                    bw.write("\t\t},\n");
                }

                bw.write(POSTFIX);
            }
        }
    }

    private static Locale buildLocale(String lang) {
        Locale.Builder builder = new Locale.Builder();
        String[] parts = lang.split("_", -1);
        builder.setLanguage(parts[0]);
        if (parts.length > 1) {
            builder.setRegion(parts[1]);
        }
        return builder.build();
    }

    private static String cleanValue(boolean upperCase, String value) {
        String v = value.replace("'", "\\'");
        return upperCase ? v.toUpperCase() : v;
    }
}
