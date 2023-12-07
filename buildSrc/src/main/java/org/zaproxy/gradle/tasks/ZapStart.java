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

import static java.util.Arrays.asList;

import java.io.File;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import org.apache.tools.ant.taskdefs.condition.Os;
import org.gradle.api.model.ObjectFactory;
import org.gradle.api.provider.ListProperty;
import org.gradle.api.provider.Property;
import org.gradle.api.tasks.Input;
import org.gradle.api.tasks.Internal;
import org.gradle.api.tasks.Optional;
import org.gradle.api.tasks.TaskAction;
import org.gradle.api.tasks.options.Option;
import org.zaproxy.clientapi.core.ClientApi;
import org.zaproxy.clientapi.core.ClientApiException;

/** A task that starts ZAP. */
public class ZapStart extends ZapApiTask {

    private static final int DEFAULT_TIMEOUT = 90;

    private static final String DIR_ARG = "-dir";
    private static final String PORT_ARG = "-port";
    private static final String CONFIG_ARG = "-config";

    private static final String API_KEY_CONFIG = "api.key";
    private static final String API_DISABLE_KEY_CONFIG = "api.disablekey";

    private static final String LINUX_START_SCRIPT = "./zap.sh";
    private static final String WINDOWS_START_SCRIPT = "zap.bat";

    private final Property<File> installDir;
    private final Property<File> homeDir;
    private final ListProperty<String> args;
    private final Property<Integer> connectionTimeout;

    @SuppressWarnings("this-escape")
    public ZapStart() {
        ObjectFactory objects = getProject().getObjects();
        installDir = objects.property(File.class);
        homeDir = objects.property(File.class);
        args = objects.listProperty(String.class);
        connectionTimeout = objects.property(Integer.class).value(DEFAULT_TIMEOUT);
    }

    @Input
    public Property<File> getInstallDir() {
        return installDir;
    }

    @Input
    public Property<File> getHomeDir() {
        return homeDir;
    }

    @Input
    @Optional
    public ListProperty<String> getArgs() {
        return args;
    }

    @Option(option = "set-args", description = "Sets the command line arguments to start ZAP with.")
    public void optionSetArgs(String args) {
        getArgs().set(Arrays.asList(args.split(" ")));
    }

    @Option(
            option = "add-args",
            description =
                    "Additional command line arguments to start ZAP with.\n"
                            + "                It also uses the arguments specified by the build.")
    public void optionArgs(String args) {
        getArgs().addAll(Arrays.asList(args.split(" ")));
    }

    @Input
    public Property<Integer> getConnectionTimeout() {
        return connectionTimeout;
    }

    @TaskAction
    public void start() {
        getProject().mkdir(homeDir.get());

        int timeout = connectionTimeout.get();
        validateTimeout(timeout);

        ClientApi client = createClient();
        checkPortNotUsed(client, getPort().get());

        ProcessBuilder pb = new ProcessBuilder();
        pb.redirectErrorStream(true)
                .redirectOutput(new File(homeDir.get(), "output"))
                .directory(installDir.get());

        List<String> command = new ArrayList<>();
        command.addAll(getBaseCommand());
        command.addAll(asList(DIR_ARG, homeDir.get().toString()));
        command.addAll(asList(PORT_ARG, Integer.toString(getPort().get())));
        boolean apiKeyPresent = getApiKey().isPresent();
        if (apiKeyPresent) {
            command.addAll(asList(CONFIG_ARG, API_KEY_CONFIG + "=" + getApiKey().get()));
        }
        command.addAll(asList(CONFIG_ARG, API_DISABLE_KEY_CONFIG + "=" + !apiKeyPresent));

        if (args.isPresent()) {
            command.addAll(args.get());
        }
        pb.command(command);

        getLogger().debug("Starting ZAP in {} with {}", installDir.get(), pb.command());

        try {
            pb.start();
        } catch (IOException e) {
            throw new ZapStartException(
                    "An error occurred while starting ZAP: " + e.getMessage(), e);
        }

        try {
            client.waitForSuccessfulConnectionToZap(timeout);
        } catch (ClientApiException e) {
            throw new ZapStartException(
                    String.format(
                            "ZAP did not fully start after %1d seconds, cause: %2s",
                            timeout, e.getMessage()),
                    e);
        }
    }

    @Internal
    protected List<String> getBaseCommand() {
        return Arrays.asList(
                Os.isFamily(Os.FAMILY_WINDOWS)
                        ? new File(installDir.get(), WINDOWS_START_SCRIPT).toString()
                        : LINUX_START_SCRIPT);
    }

    private static void checkPortNotUsed(ClientApi client, int port) {
        try {
            client.waitForSuccessfulConnectionToZap(1);
            throw new ZapStartException(
                    String.format(
                            "The port %1d is already in use, is ZAP already running?"
                                    + "\nThe port can be changed with --port command line argument.",
                            port));
        } catch (ClientApiException e) {
            // Ignore, the port is not in use.
        }
    }

    private static void validateTimeout(int timeout) {
        if (timeout <= 0) {
            throw new ZapStartException("The timeout must be greater than zero.");
        }
    }

    public static class ZapStartException extends RuntimeException {

        private static final long serialVersionUID = 1L;

        ZapStartException(String message) {
            super(message);
        }

        ZapStartException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
