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
package org.zaproxy.zap.extension.hud.tutorial;

import java.util.Map;
import org.parosproxy.paros.control.Control;
import org.parosproxy.paros.core.scanner.Alert;
import org.parosproxy.paros.extension.history.ProxyListenerLogEventPublisher;
import org.parosproxy.paros.model.HistoryReference;
import org.parosproxy.paros.network.HttpMessage;
import org.zaproxy.zap.ZAP;
import org.zaproxy.zap.eventBus.Event;
import org.zaproxy.zap.eventBus.EventConsumer;
import org.zaproxy.zap.extension.alert.ExtensionAlert;

public abstract class TutorialAlertsPage extends TutorialPage implements EventConsumer {

    private static final String PROXY_LOG_EVENT_PUBLISHER_NAME =
            ProxyListenerLogEventPublisher.getPublisher().getPublisherName();

    private String url;
    private HistoryReference href;

    public TutorialAlertsPage(TutorialProxyServer tutorialProxyServer) {
        this(tutorialProxyServer, null);
    }

    public TutorialAlertsPage(TutorialProxyServer tutorialProxyServer, TutorialPage prev) {
        super(tutorialProxyServer, prev);
    }

    @Override
    public void handleGetRequest(HttpMessage msg) {
        super.handleGetRequest(msg);
        if (this.url == null) {
            // Store the URL being used so we don't have issues with localhost vs 127.0.0.1
            this.url = msg.getRequestHeader().getURI().toString();
            // Register for proxy log events so we can find out when the request has been passively
            // scanned and is therefore in the history
            ZAP.getEventBus().registerConsumer(this, PROXY_LOG_EVENT_PUBLISHER_NAME);
        }
    }

    public String getUrl() {
        return url;
    }

    public HistoryReference getHref() {
        return href;
    }

    public void raiseAlert(Alert alert) {
        ExtensionAlert alertsExt =
                Control.getSingleton().getExtensionLoader().getExtension(ExtensionAlert.class);
        alert.setHistoryRef(href);
        alert.setUri(this.getUrl());
        alertsExt.alertFound(alert, href);
    }

    @Override
    public void eventReceived(Event event) {
        if (url == null) {
            return;
        }
        if (event.getEventType().equals(ProxyListenerLogEventPublisher.EVENT_ADDED)) {
            Map<String, String> params = event.getParameters();
            if (url.equals(params.get("uri"))) {
                try {
                    this.href =
                            new HistoryReference(
                                    Integer.parseInt(
                                            params.get(
                                                    ProxyListenerLogEventPublisher
                                                            .FIELD_HISTORY_REFERENCE_ID)));
                    this.hrefAddedEventReceived(event);
                    ZAP.getEventBus().unregisterConsumer(this, PROXY_LOG_EVENT_PUBLISHER_NAME);
                } catch (Exception e) {
                    log.error(e.getMessage(), e);
                }
            }
        }
    }

    /**
     * Called when the request for this page is added into the History. It will therefore be
     * available for raising alerts on. This method will only be called once.
     *
     * @param event
     */
    public abstract void hrefAddedEventReceived(Event event);
}
