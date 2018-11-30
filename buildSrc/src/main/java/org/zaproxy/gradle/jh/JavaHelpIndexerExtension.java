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
package org.zaproxy.gradle.jh;

import java.io.File;
import javax.inject.Inject;
import org.gradle.api.Project;
import org.gradle.api.file.ConfigurableFileCollection;
import org.gradle.api.model.ObjectFactory;
import org.gradle.api.provider.Property;
import org.gradle.api.tasks.util.PatternFilterable;
import org.gradle.api.tasks.util.PatternSet;

public class JavaHelpIndexerExtension {

    public static final String DEFAULT_DB_NAME = "JavaHelpSearch";

    private final ConfigurableFileCollection helpsets;

    private final Property<File> cwd;

    private final PatternFilterable files;

    private final Property<String> dbName;

    @Inject
    public JavaHelpIndexerExtension(Project project) {
        ObjectFactory objectFactory = project.getObjects();
        this.helpsets = project.files();
        this.cwd = objectFactory.property(File.class);
        this.files = objectFactory.newInstance(PatternSet.class);
        this.dbName = objectFactory.property(String.class);
        this.dbName.set(DEFAULT_DB_NAME);
    }

    public ConfigurableFileCollection getHelpsets() {
        return helpsets;
    }

    public Property<File> getCwd() {
        return cwd;
    }

    public PatternFilterable getFiles() {
        return files;
    }

    public Property<String> getDbName() {
        return dbName;
    }
}
