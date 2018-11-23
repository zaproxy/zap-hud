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
import org.apache.commons.lang3.SystemUtils;
import org.gradle.api.provider.Property;
import org.gradle.api.tasks.Copy;
import org.gradle.api.tasks.Internal;
import org.gradle.api.tasks.options.Option;

/**
 * A {@link Copy} task into a ZAP home directory.
 *
 * <p>Defaults to dev home dir if not specified through the command line {@code --zap-home-dir} nor
 * through the system property {@code zap.home.dir}. The command line argument takes precedence over
 * the system property.
 */
public class CopyZapHome extends Copy {

    private static String devHomeDir;

    private final Property<File> homeDir;

    public CopyZapHome() {
        homeDir = getProject().getObjects().property(File.class);
        homeDir.set(getDefaultHomeDir());

        into(homeDir);
    }

    @Option(option = "zap-home-dir", description = "The file system path to the ZAP home.")
    public void optionZapHomeDir(String dir) {
        homeDir.set(getProject().file(dir));
    }

    @Internal
    public Property<File> getZapHomeDir() {
        return homeDir;
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
