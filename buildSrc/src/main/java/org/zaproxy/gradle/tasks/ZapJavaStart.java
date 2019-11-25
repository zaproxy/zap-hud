/*
 * Zed Attack Proxy (ZAP) and its related class files.
 *
 * ZAP is an HTTP/HTTPS proxy for assessing web application security.
 *
 * Copyright 2019 The ZAP Development Team
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
import java.util.Map;
import org.gradle.api.file.FileCollection;
import org.gradle.api.tasks.Internal;
import org.gradle.process.CommandLineArgumentProvider;
import org.gradle.process.JavaForkOptions;
import org.gradle.process.ProcessForkOptions;

/** A task that starts ZAP directly with {@code java}. */
public class ZapJavaStart extends ZapStart implements JavaForkOptions {

    private static final String JAVA_EXE = "java";
    private static final String CLASSPATH_ARG = "-cp";

    private static final String ZAP_JAR_PREFIX = "zap";
    private static final String ZAP_JAR_EXTENSION = ".jar";
    private static final String MAIN_CLASSNAME = "org.zaproxy.zap.ZAP";

    private final List<CommandLineArgumentProvider> jvmArgumentProviders;

    public ZapJavaStart() {
        jvmArgumentProviders = new ArrayList<>();
    }

    @Override
    protected List<String> getBaseCommand() {
        List<String> command = new ArrayList<>();
        command.add(JAVA_EXE);
        jvmArgumentProviders.forEach(
                provider -> {
                    for (String arg : provider.asArguments()) {
                        command.add(arg);
                    }
                });
        command.add(CLASSPATH_ARG);
        command.add(getZapJarName(getInstallDir().getAsFile().get()));
        command.add(MAIN_CLASSNAME);
        return command;
    }

    private static String getZapJarName(File installDir) {
        File[] files =
                installDir.listFiles(
                        file -> {
                            String name = file.getName();
                            if (name.startsWith(ZAP_JAR_PREFIX)
                                    && name.endsWith(ZAP_JAR_EXTENSION)) {
                                return true;
                            }
                            return false;
                        });

        if (files.length == 0) {
            throw new ZapStartException("The ZAP JAR is not in " + installDir);
        }
        return files[0].getName();
    }

    @Override
    public ProcessForkOptions copyTo(ProcessForkOptions arg0) {
        throw unsupportedOperationException();
    }

    private static UnsupportedOperationException unsupportedOperationException() {
        return new UnsupportedOperationException("Not implemented.");
    }

    @Override
    public ProcessForkOptions environment(Map<String, ?> arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public ProcessForkOptions environment(String arg0, Object arg1) {
        throw unsupportedOperationException();
    }

    @Override
    public ProcessForkOptions executable(Object arg0) {
        throw unsupportedOperationException();
    }

    @Internal
    @Override
    public Map<String, Object> getEnvironment() {
        throw unsupportedOperationException();
    }

    @Internal
    @Override
    public String getExecutable() {
        throw unsupportedOperationException();
    }

    @Internal
    @Override
    public File getWorkingDir() {
        return getInstallDir().getAsFile().get();
    }

    @Override
    public void setEnvironment(Map<String, ?> arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public void setExecutable(String arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public void setExecutable(Object arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public void setWorkingDir(File arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public void setWorkingDir(Object arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public ProcessForkOptions workingDir(Object arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public JavaForkOptions bootstrapClasspath(Object... arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public JavaForkOptions copyTo(JavaForkOptions arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public List<String> getAllJvmArgs() {
        throw unsupportedOperationException();
    }

    @Internal
    @Override
    public FileCollection getBootstrapClasspath() {
        throw unsupportedOperationException();
    }

    @Internal
    @Override
    public boolean getDebug() {
        throw unsupportedOperationException();
    }

    @Internal
    @Override
    public String getDefaultCharacterEncoding() {
        throw unsupportedOperationException();
    }

    @Internal
    @Override
    public boolean getEnableAssertions() {
        throw unsupportedOperationException();
    }

    @Internal
    @Override
    public List<String> getJvmArgs() {
        throw unsupportedOperationException();
    }

    @Internal
    @Override
    public List<CommandLineArgumentProvider> getJvmArgumentProviders() {
        return jvmArgumentProviders;
    }

    @Internal
    @Override
    public String getMaxHeapSize() {
        throw unsupportedOperationException();
    }

    @Internal
    @Override
    public String getMinHeapSize() {
        throw unsupportedOperationException();
    }

    @Internal
    @Override
    public Map<String, Object> getSystemProperties() {
        throw unsupportedOperationException();
    }

    @Override
    public JavaForkOptions jvmArgs(Iterable<?> arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public JavaForkOptions jvmArgs(Object... arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public void setAllJvmArgs(List<String> arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public void setAllJvmArgs(Iterable<?> arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public void setBootstrapClasspath(FileCollection arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public void setDebug(boolean arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public void setDefaultCharacterEncoding(String arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public void setEnableAssertions(boolean arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public void setJvmArgs(List<String> arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public void setJvmArgs(Iterable<?> arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public void setMaxHeapSize(String arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public void setMinHeapSize(String arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public void setSystemProperties(Map<String, ?> arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public JavaForkOptions systemProperties(Map<String, ?> arg0) {
        throw unsupportedOperationException();
    }

    @Override
    public JavaForkOptions systemProperty(String arg0, Object arg1) {
        throw unsupportedOperationException();
    }
}
