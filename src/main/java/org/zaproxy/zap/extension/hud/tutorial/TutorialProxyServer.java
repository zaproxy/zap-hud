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

import java.io.File;
import java.io.IOException;
import java.net.Socket;
import java.nio.file.Files;
import java.util.HashMap;
import java.util.Map;
import org.apache.log4j.Logger;
import org.parosproxy.paros.Constant;
import org.parosproxy.paros.core.proxy.OverrideMessageProxyListener;
import org.parosproxy.paros.core.proxy.ProxyServer;
import org.parosproxy.paros.core.proxy.ProxyThread;
import org.parosproxy.paros.network.HttpHeader;
import org.parosproxy.paros.network.HttpMalformedHeaderException;
import org.parosproxy.paros.network.HttpMessage;
import org.parosproxy.paros.network.HttpSender;
import org.zaproxy.zap.extension.api.API;
import org.zaproxy.zap.extension.hud.ExtensionHUD;
import org.zaproxy.zap.extension.hud.ExtensionHUD.Telemetry;
import org.zaproxy.zap.extension.hud.HudParam;
import org.zaproxy.zap.extension.hud.tutorial.pages.ActiveScanPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.AjaxSpiderPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.AlertNotificationsPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.AlertsPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.AttackModePage;
import org.zaproxy.zap.extension.hud.tutorial.pages.BreakPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.CommentsPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.CompletePage;
import org.zaproxy.zap.extension.hud.tutorial.pages.EnablePage;
import org.zaproxy.zap.extension.hud.tutorial.pages.ErrorPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.FramesPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.HistoryJsPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.HistoryPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.HtmlReportPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.HudConfigPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.IndexPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.IntroPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.PageAlertsPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.ResendPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.ScopePage;
import org.zaproxy.zap.extension.hud.tutorial.pages.ShowPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.SiteAlertsJsPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.SiteAlertsPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.SitesPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.SpiderPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.ToggleScriptPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.ToolConfigPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.TutorialJsPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.UpgradePage;
import org.zaproxy.zap.extension.hud.tutorial.pages.WarningPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.WebSocketsPage;

public class TutorialProxyServer extends ProxyServer {

    private static final String DEFAULT_LOCALE = "en_GB";
    private static final String STATUS_OK = "200 OK";
    private static final String STATUS_NOT_FOUND = "404 Not Found";
    private static final String STATUS_REDIRECT = "302 Found";
    private static final Logger LOG = Logger.getLogger(TutorialProxyServer.class);

    private ExtensionHUD extension;
    private String hostPort;
    private Map<String, TutorialPage> pages = new HashMap<>();

    private Logger log = Logger.getLogger(this.getClass());

    public TutorialProxyServer(ExtensionHUD extension) {
        this("ZAP-HUD-Tutorial");
        this.extension = extension;

        // New pages must be added here
        TutorialPage prev = addPage(new IntroPage(this));
        prev = addPage(new WarningPage(this, prev));
        prev = addPage(new UpgradePage(this, prev));
        prev = addPage(new FramesPage(this, prev));
        prev = addPage(new AlertsPage(this, prev));
        prev = addPage(new AlertNotificationsPage(this, prev));
        prev = addPage(new PageAlertsPage(this, prev));
        prev = addPage(new SiteAlertsPage(this, prev));
        prev = addPage(new HistoryPage(this, prev));
        prev = addPage(new WebSocketsPage(this, prev));
        prev = addPage(new SitesPage(this, prev));
        prev = addPage(new ScopePage(this, prev));
        prev = addPage(new EnablePage(this, prev));
        prev = addPage(new ShowPage(this, prev));
        prev = addPage(new BreakPage(this, prev));
        prev = addPage(new ResendPage(this, prev));
        prev = addPage(new SpiderPage(this, prev));
        prev = addPage(new AjaxSpiderPage(this, prev));
        prev = addPage(new ActiveScanPage(this, prev));
        prev = addPage(new AttackModePage(this, prev));
        prev = addPage(new ToolConfigPage(this, prev));
        prev = addPage(new CommentsPage(this, prev));
        prev = addPage(new ToggleScriptPage(this, prev));
        prev = addPage(new HtmlReportPage(this, prev));
        prev = addPage(new HudConfigPage(this, prev));
        prev = addPage(new CompletePage(this, prev));

        // Tutorial pages that are not part of the standard flow
        addPage(new IndexPage(this));
        addPage(new ErrorPage(this));
        addPage(new SiteAlertsJsPage(this));
        addPage(new HistoryJsPage(this));
        addPage(new TutorialJsPage(this));
    }

    private TutorialPage addPage(TutorialPage page) {
        if (this.pages.put(page.getName(), page) != null) {
            log.error("2 tutorial pages with the same name registered: " + page.getName());
        }
        return page;
    }

    /** The server is started after initialisation so that the parameters will have been loaded. */
    public void start() {
        int port =
                this.startServer(
                        extension.getHudParam().getTutorialHost(),
                        extension.getHudParam().getTutorialPort(),
                        true);
        LOG.debug("HUD Tutorial port is " + port);
        this.hostPort = extension.getHudParam().getTutorialHost() + ":" + port;
    }

    public TutorialProxyServer(String threadName) {
        super(threadName);
        this.addOverrideMessageProxyListener(new TutorialListener());
    }

    @Override
    protected ProxyThread createProxyProcess(Socket clientSocket) {
        return new TutorialProxyThread(this, clientSocket);
    }

    public String getTutorialUrl(String page) {
        return this.getTutorialUrl(page, true);
    }

    public String getTutorialUrl(String page, boolean https) {
        StringBuilder sb = new StringBuilder();
        if (https) {
            sb.append("https://");
        } else {
            sb.append("http://");
        }
        sb.append(this.hostPort);
        sb.append("/");
        sb.append(page);
        return sb.toString();
    }

    public String getLocallizedTextFile(String name) {
        String localStr = Constant.getLocale().toString();
        String body = getTextFile(localStr + "/" + name);
        if (body == null) {
            body = getTextFile(DEFAULT_LOCALE + "/" + name);
        }
        return body;
    }

    private String getTextFile(String name) {
        File f =
                new File(this.extension.getHudParam().getBaseDirectory() + "/../hudtutorial", name);
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

    private static String getDefaultResponseHeader(
            String responseStatus, String contentType, int contentLength) {
        StringBuilder sb = new StringBuilder(250);

        sb.append("HTTP/1.1 ").append(responseStatus).append("\r\n");
        sb.append("Pragma: no-cache\r\n");
        sb.append("Cache-Control: no-cache, no-store, must-revalidate\r\n");
        sb.append(
                "Content-Security-Policy: default-src 'none'; script-src 'self'; connect-src 'self'; child-src 'self'; img-src 'self' data:; font-src 'self' data:; style-src 'self'\r\n");
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

    public HudParam getHudParam() {
        return extension.getHudParam();
    }

    protected boolean isSkipTutorialTasks() {
        return extension.getHudParam().isSkipTutorialTasks();
    }

    protected boolean isTutorialTestMode() {
        return extension.getHudParam().isTutorialTestMode();
    }

    private class TutorialListener implements OverrideMessageProxyListener {

        @Override
        public int getArrangeableListenerOrder() {
            return 0;
        }

        @Override
        public boolean onHttpRequestSend(HttpMessage msg) {
            if (isTutorialTestMode()) {
                LOG.info(
                        "onHttpRequestSend "
                                + msg.getRequestHeader().getMethod()
                                + " "
                                + msg.getRequestHeader().getURI().toString());
            } else {
                LOG.debug(
                        "onHttpRequestSend "
                                + msg.getRequestHeader().getMethod()
                                + " "
                                + msg.getRequestHeader().getURI().toString());
            }

            try {
                String name = msg.getRequestHeader().getURI().getEscapedName();
                if (name.length() == 0) {
                    name = IntroPage.NAME;
                }
                TutorialPage page = pages.get(name);
                if (page != null) {
                    TutorialPage uncompletedPage = page.getPreviousUncompletedPage();
                    if (uncompletedPage != null) {
                        // Tut tut, they are trying to cheat ;) Redirect to the first uncompleted
                        // task
                        msg.setResponseHeader(
                                getDefaultResponseHeader(STATUS_REDIRECT, "text/html", 0));
                        msg.getResponseHeader()
                                .setHeader(HttpHeader.LOCATION, uncompletedPage.getName());
                    } else {
                        if (msg.getRequestHeader().getMethod().equals("POST")) {
                            page.handlePostRequest(msg, page.parsePostParams(msg));
                        } else if (msg.getRequestHeader().getMethod().equals("GET")) {
                            page.handleGetRequest(msg);
                        }

                        // Clear update (if any) before the page is rendered
                        // so the icon on the index is set correctly
                        extension.getHudParam().clearTutorialUpdate(page.getName());

                        String body = page.getHtml();
                        msg.setResponseBody(body);
                        msg.setResponseHeader(
                                getDefaultResponseHeader(
                                        STATUS_OK, "text/html", msg.getResponseBody().length()));
                        // This allows the pages to tweak things like the response headers
                        page.handleResponse(msg);
                    }
                } else if (name.endsWith(".png")) {
                    byte[] image = extension.getAPI().getImage(name);
                    if (image == null) {
                        msg.setResponseBody("<html><body><h1>404 Not found</h1><body></html>");
                        msg.setResponseHeader(
                                getDefaultResponseHeader(STATUS_NOT_FOUND, "text/html", 0));
                    } else {
                        msg.setResponseBody(image);
                        msg.setResponseHeader(
                                API.getDefaultResponseHeader(
                                        "image/png", msg.getResponseBody().length(), true));
                    }
                } else {
                    String body = getLocallizedTextFile(name);
                    if (body == null) {
                        LOG.debug("Failed to find tutorial file " + name);
                        body = getLocallizedTextFile("404.html");
                        msg.setResponseBody(body);
                        msg.setResponseHeader(
                                getDefaultResponseHeader(
                                        STATUS_NOT_FOUND,
                                        "text/html",
                                        msg.getResponseBody().length()));
                    } else {
                        msg.setResponseBody(body);
                        String contentType = "text/plain"; // Fallback
                        if (name.endsWith(".css")) {
                            contentType = "text/css";
                        } else if (name.endsWith(".js")) {
                            contentType = "text/javascript";
                        } else {
                            log.error("Unexpected tutorial file extension: " + name);
                        }
                        msg.setResponseHeader(
                                getDefaultResponseHeader(
                                        contentType, msg.getResponseBody().length()));
                    }
                }
            } catch (HttpMalformedHeaderException e) {
                LOG.error(e.getMessage(), e);
            }
            return true;
        }

        @Override
        public boolean onHttpResponseReceived(HttpMessage msg) {
            if (isTutorialTestMode()) {
                LOG.info("onHttpResponseReceived " + msg.getRequestHeader().getURI().toString());
            }
            return false;
        }
    }

    public TutorialPage getTutorialPage(String name) {
        return this.pages.get(name);
    }

    private class TutorialProxyThread extends ProxyThread {

        TutorialProxyThread(ProxyServer server, Socket socket) {
            // TODO change initiator?
            super(
                    server,
                    socket,
                    new HttpSender(
                            server.getConnectionParam(),
                            true,
                            HttpSender.MANUAL_REQUEST_INITIATOR));
        }
    }

    public void resetTasks() {
        for (TutorialPage page : pages.values()) {
            page.resetTask();
        }
    }

    public void telemetryPoint(Telemetry telemetry) {
        this.extension.telemetryPoint(telemetry);
    }
}
