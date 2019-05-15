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

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.zip.ZipFile;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;
import org.gradle.api.DefaultTask;
import org.gradle.api.file.DirectoryProperty;
import org.gradle.api.file.UnableToDeleteFileException;
import org.gradle.api.model.ObjectFactory;
import org.gradle.api.provider.Property;
import org.gradle.api.tasks.Input;
import org.gradle.api.tasks.TaskAction;
import org.w3c.dom.Document;
import org.w3c.dom.NodeList;

/** A task that downloads a ZAP weekly release. */
public class ZapDownloadWeekly extends DefaultTask {

    private final DirectoryProperty into;
    private final Property<String> zapVersions;

    public ZapDownloadWeekly() {
        ObjectFactory objects = getProject().getObjects();
        into = objects.directoryProperty();
        zapVersions = objects.property(String.class);
    }

    @Input
    public DirectoryProperty getInto() {
        return into;
    }

    @Input
    public Property<String> getZapVersions() {
        return zapVersions;
    }

    @TaskAction
    @SuppressWarnings("try")
    public void download() {
        getProject().mkdir(into);

        try {
            Document xmlDoc =
                    DocumentBuilderFactory.newInstance()
                            .newDocumentBuilder()
                            .parse(zapVersions.get());
            NodeList elementNodeList =
                    (NodeList)
                            XPathFactory.newInstance()
                                    .newXPath()
                                    .evaluate(
                                            "/ZAP/core/daily/url", xmlDoc, XPathConstants.NODESET);
            String weeklyUrl = elementNodeList.item(0).getTextContent();

            String fileName = weeklyUrl.substring(weeklyUrl.lastIndexOf('/') + 1);
            Path file = into.get().getAsFile().toPath().resolve(fileName);
            if (Files.exists(file)) {
                try (ZipFile zip = new ZipFile(file.toFile())) {
                    getLogger().info("Skipping download, the file already exists.");
                    return;
                } catch (IOException e) {
                    getLogger()
                            .warn("Deleting corrupt ZIP file, a new file will be downloaded.", e);
                    getProject().delete(file.toFile());
                }
            }
            try (InputStream in = URI.create(weeklyUrl).toURL().openStream()) {
                Files.copy(in, file);
            }
        } catch (UnableToDeleteFileException e) {
            getLogger().error("Failed to delete the ZIP file.", e);
            throw e;
        } catch (Exception e) {
            throw new ZapDownloadWeeklyException("Failed to download: " + e.getMessage(), e);
        }
    }

    public static class ZapDownloadWeeklyException extends RuntimeException {

        private static final long serialVersionUID = 1L;

        ZapDownloadWeeklyException(String message) {
            super(message);
        }

        ZapDownloadWeeklyException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
