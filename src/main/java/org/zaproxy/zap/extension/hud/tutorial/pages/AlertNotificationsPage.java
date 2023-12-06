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

import org.parosproxy.paros.Constant;
import org.parosproxy.paros.core.scanner.Alert;
import org.zaproxy.zap.eventBus.Event;
import org.zaproxy.zap.extension.hud.tutorial.TutorialAlertsPage;
import org.zaproxy.zap.extension.hud.tutorial.TutorialPage;
import org.zaproxy.zap.extension.hud.tutorial.TutorialProxyServer;

public class AlertNotificationsPage extends TutorialAlertsPage {

    public static final String NAME = "AlertNotifications";

    public AlertNotificationsPage(TutorialProxyServer tutorialProxyServer) {
        super(tutorialProxyServer);
    }

    @SuppressWarnings("this-escape")
    public AlertNotificationsPage(TutorialProxyServer tutorialProxyServer, TutorialPage prev) {
        super(tutorialProxyServer, prev);
        this.setTaskCompleted(false);
    }

    @Override
    public String getHtml() {
        String html = super.getHtml();
        if (!this.isTaskCompleted()) {
            html = html.replace("<!-- KEY -->", this.setTaskToken());
        }
        return html;
    }

    @Override
    public void setTaskCompleted(boolean taskCompleted) {
        super.setTaskCompleted(taskCompleted);
        if (taskCompleted) {
            Thread thread =
                    new Thread(
                            () -> {
                                int alertRisk = Alert.RISK_INFO;
                                while (alertRisk <= Alert.RISK_HIGH) {
                                    try {
                                        Thread.sleep(500);
                                    } catch (InterruptedException e) {
                                        // Ignore
                                    }
                                    if (getHref() != null) {
                                        Alert alert =
                                                new Alert(
                                                        TUTORIAL_ALERTS_PLUGIN_ID,
                                                        alertRisk,
                                                        Alert.CONFIDENCE_LOW,
                                                        Constant.messages.getString(
                                                                "hud.tutorial.page.alertnotifications.alert.title."
                                                                        + alertRisk));
                                        alert.setDescription(
                                                Constant.messages.getString(
                                                        "hud.tutorial.page.alertnotifications.alert.description"));
                                        alertRisk += 1;
                                        raiseAlert(alert);
                                    }
                                }
                            });

            thread.start();
        }
    }

    @Override
    public void hrefAddedEventReceived(Event event) {
        // Do nothing
    }

    @Override
    public String getName() {
        return NAME;
    }
}
