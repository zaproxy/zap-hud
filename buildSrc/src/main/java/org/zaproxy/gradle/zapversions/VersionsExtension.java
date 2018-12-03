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
package org.zaproxy.gradle.zapversions;

import java.io.File;
import javax.inject.Inject;
import org.gradle.api.Project;
import org.gradle.api.model.ObjectFactory;
import org.gradle.api.provider.Property;

public class VersionsExtension {

    private static final String ZAP_VERSIONS_XML = "ZapVersions.xml";

    private final Property<String> addOnId;
    private final Property<File> addOn;
    private final Property<String> downloadUrl;
    private final Property<String> checksumAlgorithm;
    private final Property<File> file;

    @Inject
    public VersionsExtension(Project project) {
        ObjectFactory objects = project.getObjects();
        this.addOnId = objects.property(String.class);
        this.addOnId.set(project.getName());
        this.addOn = objects.property(File.class);
        ;
        this.downloadUrl = objects.property(String.class);
        this.checksumAlgorithm = objects.property(String.class);
        this.checksumAlgorithm.set("SHA1");
        this.file = objects.property(File.class);
        this.file.set(
                project.getLayout()
                        .getBuildDirectory()
                        .file(ZAP_VERSIONS_XML)
                        .map(t -> t.getAsFile()));
    }

    public Property<String> getAddOnId() {
        return addOnId;
    }

    public Property<File> getAddOn() {
        return addOn;
    }

    public Property<String> getDownloadUrl() {
        return downloadUrl;
    }

    public Property<String> getChecksumAlgorithm() {
        return checksumAlgorithm;
    }

    public Property<File> getFile() {
        return file;
    }
}
