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
package org.zaproxy.gradle;

import org.gradle.api.Project;
import org.gradle.api.file.ConfigurableFileCollection;
import org.gradle.api.provider.Property;

public class AddOnPluginExtension {

    private final Property<String> addOnId;
    private final Property<String> addOnStatus;
    private final Property<String> addOnVersion;
    private final Property<String> zapVersion;
    private final ConfigurableFileCollection zapHomeFiles;

    public AddOnPluginExtension(Project project) {
        this.addOnId = project.getObjects().property(String.class);
        this.addOnId.set(project.getName());
        this.addOnStatus = project.getObjects().property(String.class);
        this.addOnStatus.set("alpha");
        this.addOnVersion = project.getObjects().property(String.class);
        this.addOnVersion.set(project.provider(() -> project.getVersion().toString()));
        this.zapVersion = project.getObjects().property(String.class);
        this.zapHomeFiles = project.files();
    }

    public Property<String> getAddOnId() {
        return addOnId;
    }

    public Property<String> getAddOnStatus() {
        return addOnStatus;
    }

    public Property<String> getAddOnVersion() {
        return addOnVersion;
    }

    public Property<String> getZapVersion() {
        return zapVersion;
    }

    public ConfigurableFileCollection getZapHomeFiles() {
        return zapHomeFiles;
    }
}
