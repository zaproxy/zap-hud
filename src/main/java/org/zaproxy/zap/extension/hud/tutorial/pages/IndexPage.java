/*
 * Zed Attack Proxy (ZAP) and its related class files.
 *
 * ZAP is an HTTP/HTTPS proxy for assessing web application security.
 *
 * Copyright 2019 The ZAP Development Team
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
import org.parosproxy.paros.control.Control;
import org.zaproxy.zap.extension.hud.ExtensionHUD;
import org.zaproxy.zap.extension.hud.tutorial.TutorialPage;
import org.zaproxy.zap.extension.hud.tutorial.TutorialProxyServer;

public class IndexPage extends TutorialPage {

    public static final String NAME = "Index";
    private ExtensionHUD extHUD;

    public IndexPage(TutorialProxyServer tutorialProxyServer) {
        super(tutorialProxyServer);
    }

    public IndexPage(TutorialProxyServer tutorialProxyServer, TutorialPage prev) {
        super(tutorialProxyServer, prev);
    }

    @Override
    public String getName() {
        return NAME;
    }

    private ExtensionHUD getExtHUD() {
        if (this.extHUD == null) {
            this.extHUD =
                    Control.getSingleton().getExtensionLoader().getExtension(ExtensionHUD.class);
        }
        return this.extHUD;
    }

    @Override
    public String getHtml() {
        String html = super.getHtml();
        StringBuilder sb = new StringBuilder();
        TutorialPage page = this.getTutorialProxyServer().getTutorialPage(IntroPage.NAME);
        sb.append("<ul>\n");

        boolean tasksCompletedSoFar = true;
        boolean skipTasks = this.getExtHUD().getHudParam().isSkipTutorialTasks();
        while (page != null) {
            sb.append("<li>\n");
            if (skipTasks || tasksCompletedSoFar) {
                sb.append("<a href=\"");
                sb.append(page.getName());
                sb.append("\">");
                sb.append(page.getI18nName());
                if (this.getTutorialProxyServer()
                        .getHudParam()
                        .getTutorialUpdates()
                        .contains(page.getName())) {
                    sb.append(" <img src=\"exclamation-red.png\" title=\"");
                    sb.append(Constant.messages.getString("hud.tutorial.hover.new"));
                    sb.append("\">");
                }
                sb.append("</a>");
            } else {
                sb.append(page.getI18nName());
                if (this.getTutorialProxyServer()
                        .getHudParam()
                        .getTutorialUpdates()
                        .contains(page.getName())) {
                    sb.append(" <img src=\"exclamation-red.png\" title=\"");
                    sb.append(Constant.messages.getString("hud.tutorial.hover.new"));
                    sb.append("\">");
                }
            }
            if (!page.isTaskCompleted()) {
                tasksCompletedSoFar = false;
            }
            page = page.getNextPage();
            sb.append("</li>\n");
        }
        sb.append("</ul>\n");

        return html.replaceAll("<!-- INDEX -->", sb.toString());
    }
}
