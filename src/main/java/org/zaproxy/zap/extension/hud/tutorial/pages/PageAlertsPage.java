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

public class PageAlertsPage extends TutorialAlertsPage {

    public static final String NAME = "PageAlerts";
    private boolean alertRaised = false;

    public PageAlertsPage(TutorialProxyServer tutorialProxyServer) {
        this(tutorialProxyServer, null);
    }

    public PageAlertsPage(TutorialProxyServer tutorialProxyServer, TutorialPage prev) {
        super(tutorialProxyServer, prev);
    }

    @Override
    public String getName() {
        return NAME;
    }

    @Override
    public void hrefAddedEventReceived(Event event) {
        if (!alertRaised) {
            Alert alert =
                    new Alert(
                            TUTORIAL_ALERTS_PLUGIN_ID,
                            Alert.RISK_INFO,
                            Alert.CONFIDENCE_MEDIUM,
                            Constant.messages.getString(
                                    "hud.tutorial.page.pagealerts.alert.title"));
            alert.setDescription(
                    Constant.messages.getString(
                            "hud.tutorial.page.pagealerts.alert.description", this.setTaskToken()));
            this.raiseAlert(alert);
            this.alertRaised = true;
        }
    }
}
