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

import org.apache.log4j.Logger;
import org.parosproxy.paros.core.proxy.OverrideMessageProxyListener;
import org.parosproxy.paros.network.HttpHeader;
import org.parosproxy.paros.network.HttpMessage;


public class HttpUpgradeProxyListener implements OverrideMessageProxyListener {

    private ExtensionHUD extHud;

    private Logger LOG = Logger.getLogger(this.getClass());

    public HttpUpgradeProxyListener(ExtensionHUD extHud) {
        this.extHud = extHud;
    }

    @Override
    public int getArrangeableListenerOrder() {
        return 0;
    }

    @Override
    public boolean onHttpRequestSend(HttpMessage msg) {
        if (this.extHud.isHudEnabled()) {
            if (this.extHud.getHudParam().isInScopeOnly() && ! msg.isInScope()) {
                return false;
            }
            try {
                if (! msg.getRequestHeader().isSecure()) {
                    // 302 to the https version..
                    this.extHud.addUpgradedHttpsDomain(msg.getRequestHeader().getURI());
                    msg.setResponseHeader(
                            HudAPI.getAllowFramingResponseHeader("302 OK", "text/html; charset=UTF-8", 0, false));
                    String url = msg.getRequestHeader().getURI().toString().replaceFirst("(?i)http://", "https://");
                    msg.getResponseHeader().addHeader(HttpHeader.LOCATION, url);
                    // Don't strictly need the body
                    msg.setResponseBody("<html><body>Redirecting to " + url + "</body></html>");
                    msg.getResponseHeader().setContentLength(msg.getResponseBody().length());
                    LOG.debug("onHttpRequestSend returning a 302 to " + url);
                    return true;
                } else {
                    if (this.extHud.isUpgradedHttpsDomain(msg.getRequestHeader().getURI())) {
                        // Switch to using the HTTP version in the background
                        msg.getRequestHeader().setSecure(false);
                    }
                }
            } catch (Exception e) {
                LOG.error(e.getMessage(), e);
            }
        }
        return false;
    }

    @Override
    public boolean onHttpResponseReceived(HttpMessage arg0) {
        return false;
    }

}
