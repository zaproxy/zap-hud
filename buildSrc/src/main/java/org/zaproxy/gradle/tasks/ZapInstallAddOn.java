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

import java.util.HashMap;
import java.util.Map;
import org.gradle.api.file.RegularFileProperty;
import org.gradle.api.tasks.InputFile;
import org.gradle.api.tasks.TaskAction;
import org.zaproxy.clientapi.core.ApiResponseElement;
import org.zaproxy.clientapi.core.ClientApi;
import org.zaproxy.clientapi.core.ClientApiException;

/** A task that installs an add-on into ZAP. */
public class ZapInstallAddOn extends ZapApiTask {

    private final RegularFileProperty addOn;

    public ZapInstallAddOn() {
        addOn = newInputFile();
    }

    @InputFile
    public RegularFileProperty getAddOn() {
        return addOn;
    }

    @TaskAction
    public void start() {
        ClientApi client = createClient();
        Map<String, String> parameters = new HashMap<>();
        parameters.put("file", getAddOn().get().getAsFile().toString());
        try {
            if (ApiResponseElement.FAIL.equals(
                    client.callApi("autoupdate", "action", "installLocalAddon", parameters))) {
                throw new ZapInstallAddOnException(
                        "Failed to install the add-on, check ZAP log for more details.");
            }
        } catch (ClientApiException e) {
            throw new ZapInstallAddOnException(
                    "An error occurred while installing the add-on: " + e.getMessage(), e);
        }
    }

    public static class ZapInstallAddOnException extends RuntimeException {

        private static final long serialVersionUID = 1L;

        ZapInstallAddOnException(String message) {
            super(message);
        }

        ZapInstallAddOnException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
