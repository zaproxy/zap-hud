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
package org.zaproxy.zap.extension.hud;

import java.util.List;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.Node;
import org.parosproxy.paros.network.HttpMessage;
/**
 * A class for injecting content into HTML responses
 */
public class HtmlEditor {
    
    private HttpMessage msg;
    private Document doc;
    private boolean changed = false;

    public HtmlEditor(HttpMessage msg) {
        this.msg = msg;
        doc = Jsoup.parse(msg.getResponseBody().toString(), msg.getRequestHeader().getURI().toString());
    }

    public void injectAtStartOfBody(String inject) {
        Element bodyElement = this.doc.body();
        if (bodyElement != null) {
            List<Node> childNodes = bodyElement.childNodes();
            if (childNodes.size() > 0) {
                childNodes.get(0).before(inject);
                this.changed = true;
            }
        }
    }
    
    public void rewriteHttpMessage() {
        if (this.changed) {
            msg.setResponseBody(this.doc.toString());
            msg.getResponseHeader().setContentLength(this.msg.getResponseBody().length());
        }
    }
    
    public boolean isChanged () {
        return this.changed;
    }
}
