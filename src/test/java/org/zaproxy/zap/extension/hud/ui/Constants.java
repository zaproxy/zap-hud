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
package org.zaproxy.zap.extension.hud.ui;

public class Constants {
    public static int ZAP_PORT = 8999;
    public static String ZAP_HOST = "localhost";
    public static String ZAP_HOST_PORT = ZAP_HOST + ":" + ZAP_PORT;
    /** This key is set in /build.gradle.kts - these must be kept the same */
    public static String ZAP_TEST_API_KEY = "password123";

    public static int POST_LOAD_DELAY_MS = 10000;
    public static int GENERIC_TESTS_RETRY_COUNT = 30;
    public static int GENERIC_TESTS_RETRY_SLEEP_MS = 1000;
    public static int GENERIC_TESTS_TIMEOUT_SECS = 20;
}
