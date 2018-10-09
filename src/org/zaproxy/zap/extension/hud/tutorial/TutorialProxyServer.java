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

import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.File;
import java.io.IOException;
import java.net.Socket;
import java.nio.file.Files;

import org.apache.log4j.Logger;
import org.openqa.selenium.WebDriver;
import org.parosproxy.paros.Constant;
import org.parosproxy.paros.control.Control;
import org.parosproxy.paros.core.proxy.OverrideMessageProxyListener;
import org.parosproxy.paros.core.proxy.ProxyServer;
import org.parosproxy.paros.core.proxy.ProxyThread;
import org.parosproxy.paros.network.HttpMalformedHeaderException;
import org.parosproxy.paros.network.HttpMessage;
import org.parosproxy.paros.network.HttpSender;
import org.zaproxy.zap.extension.hud.ExtensionHUD;
import org.zaproxy.zap.extension.selenium.ExtensionSelenium;
import org.zaproxy.zap.view.ZapMenuItem;

public class TutorialProxyServer extends ProxyServer {

    private static final String DEFAULT_LOCALE = "en_GB";
    private static final String STATUS_OK = "200 OK";
    private static final String STATUS_NOT_FOUND = "404 Not Found";
    private static final Logger LOG = Logger.getLogger(TutorialProxyServer.class);

    private ExtensionHUD extension;
    private ZapMenuItem firefoxToolsMenuItem;
    private ZapMenuItem chromeToolsMenuItem;
    private String hostPort;

    public TutorialProxyServer(ExtensionHUD extension) {
        this("ZAP-HUD-Tutorial");
        this.extension = extension;
        int port = this.startServer("127.0.0.1", 0, true);
        LOG.debug("HUD Tutorial port is " + port);
        this.hostPort = "127.0.0.1:" + port;
    }

    public TutorialProxyServer(String threadName) {
        super(threadName);
        this.addOverrideMessageProxyListener(new TutorialListener());
    }

    @Override
    protected ProxyThread createProxyProcess(Socket clientSocket) {
        return new TutorialProxyThread(this, clientSocket);
    }

    private String getTextFile(String name) {
        File f = new File(this.extension.getHudParam().getBaseDirectory() + "/../hudtutorial", name);
        if (!f.exists()) {
            LOG.debug("No such tutorial file: " + f.getAbsolutePath());
            return null;
        }
        // Quick way to read a small text file
        try {
            return new String(Files.readAllBytes(f.toPath()));
        } catch (IOException e) {
            LOG.error(e.getMessage() + e);
            return null;
        }
    }

    private static String getDefaultResponseHeader(String contentType, int contentLength) {
        return getDefaultResponseHeader(STATUS_OK, contentType, contentLength);
    }

    private static String getDefaultResponseHeader(String responseStatus, String contentType, int contentLength) {
        StringBuilder sb = new StringBuilder(250);

        sb.append("HTTP/1.1 ").append(responseStatus).append("\r\n");
        sb.append("Pragma: no-cache\r\n");
        sb.append("Cache-Control: no-cache, no-store, must-revalidate\r\n");
        sb.append("Content-Security-Policy: default-src 'none'; script-src 'self'; connect-src 'self'; child-src 'self'; img-src 'self' data:; font-src 'self' data:; style-src 'self'\r\n");
        sb.append("Access-Control-Allow-Methods: GET,POST,OPTIONS\r\n");
        sb.append("Access-Control-Allow-Headers: ZAP-Header\r\n");
        sb.append("X-Frame-Options: DENY\r\n");
        sb.append("X-XSS-Protection: 1; mode=block\r\n");
        sb.append("X-Content-Type-Options: nosniff\r\n");
        sb.append("X-Clacks-Overhead: GNU Terry Pratchett\r\n");
        sb.append("Content-Length: ").append(contentLength).append("\r\n");
        sb.append("Content-Type: ").append(contentType).append("\r\n");

        return sb.toString();
    }

    private class TutorialListener implements OverrideMessageProxyListener {

        @Override
        public int getArrangeableListenerOrder() {
            return 0;
        }

        @Override
        public boolean onHttpRequestSend(HttpMessage msg) {
            LOG.debug("onHttpRequestSend " + msg.getRequestHeader().getURI().toString());
            try {
                String name = msg.getRequestHeader().getURI().getEscapedName();
                if (name.length() == 0) {
                    name = "1-Intro.html";
                }
                String localStr = Constant.getLocale().toString();
                String body = getTextFile(localStr + "/" + name);
                if (body == null) {
                    body = getTextFile(DEFAULT_LOCALE + "/" + name);
                }
                if (body == null) {
                    LOG.debug("Failed to find tutorial file " + name);
                    msg.setResponseBody("<html><body><h1>404 Not found</h1><body></html>");
                    msg.setResponseHeader(getDefaultResponseHeader(STATUS_NOT_FOUND, "text/html", 0));
                } else {
                    msg.setResponseBody(body);
                    String contentType = "text/html";
                    if (name.endsWith(".css")) {
                        contentType = "text/css";
                    }
                    msg.setResponseHeader(getDefaultResponseHeader(contentType, msg.getResponseBody().length()));
                }
            } catch (HttpMalformedHeaderException e) {
                LOG.error(e.getMessage(), e);
            }
            return true;
        }

        @Override
        public boolean onHttpResponseReceived(HttpMessage msg) {
            LOG.debug("onHttpResponseReceived " + msg.getRequestHeader().getURI().toString());
            return false;
        }

    }

    private class TutorialProxyThread extends ProxyThread {

        TutorialProxyThread(ProxyServer server, Socket socket) {
            // TODO change initiator?
            super(server, socket, new HttpSender(server.getConnectionParam(), true, HttpSender.MANUAL_REQUEST_INITIATOR));
        }

    }

    public ZapMenuItem getFirefoxToolsMenuItem() {
        // TODO This is a temporary solution, and should be removed
        // when the tutorial can be accessed via a HUD 'loading' page.
        // And maybe from the Quick Start tab as well :)

        if (firefoxToolsMenuItem == null) {
            firefoxToolsMenuItem = new ZapMenuItem("hud.menu.tutorial.firefox");
            firefoxToolsMenuItem.addActionListener(new ActionListener() {

                @Override
                public void actionPerformed(ActionEvent arg0) {
                    ExtensionSelenium extSel = Control.getSingleton().getExtensionLoader().getExtension(
                            ExtensionSelenium.class);
                    WebDriver wd = extSel.getProxiedBrowserByName("Firefox");
                    wd.get("http://" + hostPort);
                }
            });
        }
        return firefoxToolsMenuItem;
    }

    public ZapMenuItem getChromeToolsMenuItem() {
        // TODO This is a temporary solution, and should be removed
        // when the tutorial can be accessed via a HUD 'loading' page.
        // And maybe from the Quick Start tab as well :)

        if (chromeToolsMenuItem == null) {
            chromeToolsMenuItem = new ZapMenuItem("hud.menu.tutorial.chrome");
            chromeToolsMenuItem.addActionListener(new ActionListener() {

                @Override
                public void actionPerformed(ActionEvent arg0) {
                    ExtensionSelenium extSel = Control.getSingleton().getExtensionLoader().getExtension(
                            ExtensionSelenium.class);
                    WebDriver wd = extSel.getProxiedBrowserByName("Chrome");
                    wd.get("http://" + hostPort);
                }
            });
        }
        return chromeToolsMenuItem;
    }

}
