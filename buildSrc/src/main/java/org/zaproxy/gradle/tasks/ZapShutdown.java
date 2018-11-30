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

import org.gradle.api.tasks.TaskAction;
import org.zaproxy.clientapi.core.ClientApiException;

/** A task that shuts down ZAP through the API. */
public class ZapShutdown extends ZapApiTask {

    @TaskAction
    public void shutdown() {
        try {
            createClient().core.shutdown();
        } catch (ClientApiException e) {
            throw new ZapShutdownException("Failed to shutdown ZAP: " + e.getMessage(), e);
        }
    }

    public static class ZapShutdownException extends RuntimeException {

        private static final long serialVersionUID = 1L;

        ZapShutdownException(String message) {
            super(message);
        }

        ZapShutdownException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
