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
import org.parosproxy.paros.network.HttpMessage;
import org.zaproxy.zap.extension.hud.tutorial.TutorialPage;
import org.zaproxy.zap.extension.hud.tutorial.TutorialProxyServer;

public class BreakPage extends TutorialPage {

    public static final String NAME = "Break";

    public BreakPage(TutorialProxyServer tutorialProxyServer) {
        super(tutorialProxyServer);
    }

    public BreakPage(TutorialProxyServer tutorialProxyServer, TutorialPage prev) {
        super(tutorialProxyServer, prev);
    }

    @Override
    public void handlePostRequest(HttpMessage msg, Map<String, String> params) {
        if ("ZAP".equals(params.get("number"))) {
            this.setTaskCompleted(true);
            this.setTaskJustCompleted(true);
        }
        super.handlePostRequest(msg, params);
    }

    @Override
    public String getName() {
        return NAME;
    }
}
