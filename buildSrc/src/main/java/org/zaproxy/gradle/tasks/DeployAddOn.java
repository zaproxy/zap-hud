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
import java.util.ArrayList;
import java.util.List;
import org.apache.commons.lang3.SystemUtils;
import org.gradle.api.DefaultTask;
import org.gradle.api.file.ConfigurableFileCollection;
import org.gradle.api.model.ObjectFactory;
import org.gradle.api.provider.Property;
import org.gradle.api.tasks.Input;
import org.gradle.api.tasks.InputFiles;
import org.gradle.api.tasks.Optional;
import org.gradle.api.tasks.TaskAction;
import org.gradle.api.tasks.options.Option;

/**
 * A task that deploys the add-on and corresponding home files into a ZAP home directory.
 *
 * <p>Defaults to dev home dir if not specified through the command line {@code --zap-home-dir} nor
 * through the system property {@code zap.home.dir}. The command line argument takes precedence over
 * the system property.
 *
 * <p>By default the existing home files are deleted before deploying the new files, to prevent
 * stale files. This behaviour can be changed through the property {@link #getDeleteStale()
 * deleteStale} or by by setting the command line argument {@code --delete-stale} to false.
 */
public class DeployAddOn extends DefaultTask {

    private static final String PLUGIN_DIR = "plugin";

    private static String devHomeDir;

    private final Property<File> homeDir;
    private final Property<File> addOn;
    private final ConfigurableFileCollection files;
    private final Property<Boolean> deleteStale;

    public DeployAddOn() {
        ObjectFactory objects = getProject().getObjects();
        homeDir = objects.property(File.class);
        homeDir.set(getDefaultHomeDir());
        addOn = objects.property(File.class);
        files = getProject().files();
        deleteStale = objects.property(Boolean.class);
        deleteStale.set(true);
    }

    @Option(option = "zap-home-dir", description = "The file system path to the ZAP home.")
    public void optionHomeDir(String dir) {
        homeDir.set(getProject().file(dir));
    }

    @Input
    public Property<File> getHomeDir() {
        return homeDir;
    }

    @Input
    public Property<File> getAddOn() {
        return addOn;
    }

    @Optional
    @InputFiles
    public ConfigurableFileCollection getFiles() {
        return files;
    }

    @Input
    public Property<Boolean> getDeleteStale() {
        return deleteStale;
    }

    @Option(
        option = "delete-stale",
        description =
                "If stale add-on files in the home directory should be deleted, defaults to true."
    )
    public void optionDeleteStale(String delete) {
        deleteStale.set(Boolean.valueOf(delete));
    }

    @TaskAction
    public void deploy() {
        if (deleteStale.get()) {
            List<File> filesToDelete = new ArrayList<>();
            files.getAsFileTree()
                    .visit(
                            fileDetails -> {
                                filesToDelete.add(
                                        new File(
                                                homeDir.get(),
                                                fileDetails.getRelativePath().toString()));
                            });
            getProject().delete(filesToDelete);
        }

        getProject()
                .copy(
                        copySpec -> {
                            copySpec.from(addOn, copySpecAddOn -> copySpecAddOn.into(PLUGIN_DIR));
                            copySpec.from(files);
                            copySpec.into(getHomeDir());
                        });
    }

    private File getDefaultHomeDir() {
        String destDir = null;
        if (getProject().hasProperty("zap.home.dir")) {
            destDir = (String) getProject().property("zap.home.dir");
        }
        if (destDir == null || destDir.isEmpty()) {
            destDir = getDevHomeDir();
        }
        return getProject().file(destDir);
    }

    // Same logic used in ZAP.
    private static String getDevHomeDir() {
        if (devHomeDir == null) {
            devHomeDir = System.getProperty("user.home");
            if (devHomeDir == null) {
                devHomeDir = ".";
            }
            if (SystemUtils.IS_OS_LINUX) {
                devHomeDir += "/.ZAP_D";
            } else if (SystemUtils.IS_OS_MAC) {
                devHomeDir += "/Library/Application Support/ZAP_D";
            } else {
                devHomeDir += "\\OWASP ZAP_D";
            }
        }
        return devHomeDir;
    }
}
