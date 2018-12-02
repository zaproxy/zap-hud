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
import org.parosproxy.paros.network.HttpHeader;
import org.parosproxy.paros.network.HttpMessage;
import org.zaproxy.zap.eventBus.Event;
import org.zaproxy.zap.extension.hud.tutorial.TutorialAlertsPage;
import org.zaproxy.zap.extension.hud.tutorial.TutorialPage;
import org.zaproxy.zap.extension.hud.tutorial.TutorialProxyServer;

public class SiteAlertsJsPage extends TutorialAlertsPage {

    public static final String NAME = "SiteAlerts.js";

    /* This is public so that it can be easily read by the SiteAlertsPage */
    public static String key;
    private boolean alertRaised = false;

    private TutorialProxyServer tutorialProxyServer;

    public SiteAlertsJsPage(TutorialProxyServer tutorialProxyServer) {
        this(tutorialProxyServer, null);
    }

    public SiteAlertsJsPage(TutorialProxyServer tutorialProxyServer, TutorialPage prev) {
        super(tutorialProxyServer, prev);
        this.tutorialProxyServer = tutorialProxyServer;
    }

    @Override
    public String getName() {
        return NAME;
    }

    @Override
    public String getHtml() {
        // This is a special case
        String html = tutorialProxyServer.getLocallizedTextFile(this.getName());
        if (key == null) {
            key = this.setTaskToken();
        }
        return html.replace("<!-- KEY -->", key);
    }

    @Override
    public void hrefAddedEventReceived(Event event) {
        if (!alertRaised) {
            Alert alert =
                    new Alert(
                            TUTORIAL_ALERTS_PLUGIN_ID,
                            Alert.RISK_LOW,
                            Alert.CONFIDENCE_MEDIUM,
                            Constant.messages.getString(
                                    "hud.tutorial.page.sitealerts.alert.title"));
            alert.setDescription(
                    Constant.messages.getString("hud.tutorial.page.sitealerts.alert.description"));
            this.raiseAlert(alert);
            this.alertRaised = true;
        }
    }

    public void handleResponse(HttpMessage msg) {
        // Otherwise it would be html
        msg.getResponseHeader().setHeader(HttpHeader.CONTENT_TYPE, "text/javascript");
    }
}
