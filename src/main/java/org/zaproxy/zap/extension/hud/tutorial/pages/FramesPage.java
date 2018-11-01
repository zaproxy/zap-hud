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

import org.zaproxy.zap.extension.hud.tutorial.TutorialPage;
import org.zaproxy.zap.extension.hud.tutorial.TutorialProxyServer;

public class FramesPage extends TutorialPage {

    public static final String NAME = "Frames";

    public FramesPage(TutorialProxyServer tutorialProxyServer) {
        this(tutorialProxyServer, null);
    }

    public FramesPage(TutorialProxyServer tutorialProxyServer, TutorialPage prev) {
        super(tutorialProxyServer, prev);
        this.setTaskCompleted(false);
    }

    @Override
    public String getName() {
        return NAME;
    }

    @Override
    public String getHtml() {
        String html = super.getHtml();
        if (!this.isTaskCompleted()) {
            html = html.replace("<!-- KEY -->", this.setTaskToken());
        }
        return html;
    }

    // @Override
    public String getPreviousPageName() {
        return WarningPage.NAME;
    }

    // @Override
    public String getNextPageNAme() {
        return AlertsPage.NAME;
    }
}
