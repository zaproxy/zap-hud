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

import com.vladsch.flexmark.ext.gfm.strikethrough.StrikethroughSubscriptExtension;
import com.vladsch.flexmark.ext.gfm.tasklist.TaskListExtension;
import com.vladsch.flexmark.ext.tables.TablesExtension;
import com.vladsch.flexmark.html.HtmlRenderer;
import com.vladsch.flexmark.parser.Parser;
import com.vladsch.flexmark.util.options.MutableDataSet;
import java.io.IOException;
import java.io.Reader;
import java.io.Writer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.gradle.api.DefaultTask;
import org.gradle.api.file.RegularFileProperty;
import org.gradle.api.tasks.InputFile;
import org.gradle.api.tasks.OutputFile;
import org.gradle.api.tasks.TaskAction;

/** A task that creates manifest changes from a changelog. */
public class CreateManifestChanges extends DefaultTask {

    private static final int CHANGELOG_CHUNK_SIZE = 20_000;

    private static final Pattern VERSION_PATTERN = Pattern.compile("## \\[.+\\].*\\R");
    private static final Pattern VERSION_LINK_PATTERN = Pattern.compile("\\[.+\\]:");

    private final RegularFileProperty changelog;
    private final RegularFileProperty manifestChanges;

    public CreateManifestChanges() {
        changelog = newInputFile();
        manifestChanges = newOutputFile();
    }

    @InputFile
    public RegularFileProperty getChangelog() {
        return changelog;
    }

    @OutputFile
    public RegularFileProperty getManifestChanges() {
        return manifestChanges;
    }

    @TaskAction
    public void create() throws Exception {
        MutableDataSet options = new MutableDataSet();
        options.set(
                Parser.EXTENSIONS,
                Arrays.asList(
                        StrikethroughSubscriptExtension.create(),
                        TablesExtension.create(),
                        TaskListExtension.create()));

        Parser parser = Parser.builder(options).build();
        HtmlRenderer renderer = HtmlRenderer.builder(options).build();

        String changes = getChanges(changelog.get().getAsFile().toPath());
        try (Writer writer = Files.newBufferedWriter(manifestChanges.get().getAsFile().toPath())) {
            renderer.render(parser.parse(changes), writer);
        }
    }

    private String getChanges(Path changelog) throws IOException {
        return extractChangesLatestVersion(readChunk(changelog));
    }

    private static String readChunk(Path changelog) throws IOException {
        char[] chars = new char[CHANGELOG_CHUNK_SIZE];
        int n;
        try (Reader reader = Files.newBufferedReader(changelog)) {
            n = reader.read(chars);
        }
        if (n == -1) {
            throw new IOException("Failed to read any characters from: " + changelog);
        }
        return new String(chars, 0, n);
    }

    private String extractChangesLatestVersion(String contents) {
        Matcher matcher = VERSION_PATTERN.matcher(contents);
        if (!matcher.find()) {
            throw new IllegalArgumentException(
                    String.format(
                            "No version matching '%1s' was found in changelog:\n%2s",
                            VERSION_PATTERN, contents));
        }
        int changesStart = matcher.end();
        if (!matcher.find()) {
            getLogger().debug("Second version not found, fallback to version link.");
            matcher = VERSION_LINK_PATTERN.matcher(contents);
            if (!matcher.find()) {
                throw new IllegalArgumentException(
                        String.format(
                                "No version matching '%1s' nor version link matching '%2s' was found in changelog:\n%3s",
                                VERSION_PATTERN, VERSION_LINK_PATTERN, contents));
            }
        }
        return contents.substring(changesStart, matcher.start());
    }
}
