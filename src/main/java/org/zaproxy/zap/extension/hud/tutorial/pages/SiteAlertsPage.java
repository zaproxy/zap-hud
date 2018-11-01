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

import java.util.Map;
import org.parosproxy.paros.Constant;
import org.parosproxy.paros.control.Control;
import org.parosproxy.paros.core.scanner.Alert;
import org.parosproxy.paros.model.HistoryReference;
import org.parosproxy.paros.network.HttpMessage;
import org.zaproxy.zap.ZAP;
import org.zaproxy.zap.eventBus.Event;
import org.zaproxy.zap.eventBus.EventConsumer;
import org.zaproxy.zap.extension.alert.ExtensionAlert;
import org.zaproxy.zap.extension.hud.tutorial.TutorialPage;
import org.zaproxy.zap.extension.hud.tutorial.TutorialProxyServer;

public class SiteAlertsPage extends TutorialPage implements EventConsumer {

    public static final String NAME = "SiteAlerts";

    // TODO change to reference the class once we've updated to use a ZAP jar that contains it
    private static final String PROXY_LOG_EVENT_PUBLISHER_NAME =
            "org.parosproxy.paros.extension.history.ProxyListenerLogEventPublisher";

    private boolean firstAccess = true;
    private boolean alertRaised = false;

    public SiteAlertsPage(TutorialProxyServer tutorialProxyServer) {
        this(tutorialProxyServer, null);
    }

    public SiteAlertsPage(TutorialProxyServer tutorialProxyServer, TutorialPage prev) {
        super(tutorialProxyServer, prev);
        this.setTaskCompleted(false);
    }

    @Override
    public String getHtml() {
        String html = super.getHtml();
        if (this.firstAccess) {
            this.firstAccess = false;
            // Register for proxy log events so we can find out when the request has been passively
            // scanned and is therefore in the history
            ZAP.getEventBus().registerConsumer(this, PROXY_LOG_EVENT_PUBLISHER_NAME);
        }
        return html;
    }

    @Override
    public void handlePostRequest(HttpMessage msg) {
        // The token for this task will be set in the SiteAlertsJsPage
        this.setTaskToken(SiteAlertsJsPage.key);
        super.handlePostRequest(msg);
    }

    @Override
    public void taskPassed() {
        ZAP.getEventBus().unregisterConsumer(this, PROXY_LOG_EVENT_PUBLISHER_NAME);
    }

    @Override
    public void eventReceived(Event event) {
        if (alertRaised) {
            return;
        }
        String url = this.getTutorialProxyServer().getTutorialUrl(SiteAlertsJsPage.NAME, false);

        if (event.getEventType().equals("href.added")) {
            Map<String, String> params = event.getParameters();
            if (url.equals(params.get("uri"))) {
                // Found it, raise a custom alert
                ExtensionAlert alertsExt =
                        Control.getSingleton()
                                .getExtensionLoader()
                                .getExtension(ExtensionAlert.class);
                try {
                    Alert alert =
                            new Alert(
                                    TUTORIAL_ALERTS_PLUGIN_ID,
                                    Alert.RISK_LOW,
                                    Alert.CONFIDENCE_MEDIUM,
                                    Constant.messages.getString(
                                            "hud.tutorial.page.sitealerts.alert.title"));
                    HistoryReference href =
                            new HistoryReference(
                                    Integer.parseInt(params.get("historyReferenceId")));
                    alert.setDescription(
                            Constant.messages.getString(
                                    "hud.tutorial.page.sitealerts.alert.description"));
                    alert.setHistoryRef(href);
                    alert.setUri(url);
                    alertsExt.alertFound(alert, href);
                    alertRaised = true;
                } catch (Exception e) {
                    log.error(e.getMessage(), e);
                }
            }
        }
    }

    @Override
    public String getName() {
        return NAME;
    }
}
