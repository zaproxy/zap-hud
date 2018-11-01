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
package org.zaproxy.zap.extension.hud.tutorial.pages;

import org.parosproxy.paros.network.HttpMessage;
import org.zaproxy.zap.extension.hud.tutorial.TutorialPage;
import org.zaproxy.zap.extension.hud.tutorial.TutorialProxyServer;

public class AlertNotificationsPage extends TutorialPage {

    public static final String NAME = "AlertNotifications";

    public AlertNotificationsPage(TutorialProxyServer tutorialProxyServer) {
        super(tutorialProxyServer);
        this.setTaskCompleted(false);
    }

    public AlertNotificationsPage(TutorialProxyServer tutorialProxyServer, TutorialPage prev) {
        super(tutorialProxyServer, prev);
    }

    public void handlePostRequest(HttpMessage msg) {
        // Any request will do
        this.setTaskCompleted(true);
    }

    @Override
    public void handleResponse(HttpMessage msg) {
        if (this.isTaskCompleted()) {
            // This should cause an alert to be shown once the task has been completed
            msg.getResponseHeader().setHeader("X-Frame-Options", null);
        }
    }

    @Override
    public String getName() {
        return NAME;
    }
}
