/*
 * Zed Attack Proxy (ZAP) and its related class files.
 *
 * ZAP is an HTTP/HTTPS proxy for assessing web application security.
 *
 * Copyright 2016 The ZAP Development Team
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

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.nio.file.Files;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import net.sf.json.JSONObject;
import org.apache.commons.httpclient.URIException;
import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;
import org.parosproxy.paros.Constant;
import org.parosproxy.paros.control.Control;
import org.parosproxy.paros.network.HttpMalformedHeaderException;
import org.parosproxy.paros.network.HttpMessage;
import org.parosproxy.paros.view.View;
import org.zaproxy.zap.extension.api.API;
import org.zaproxy.zap.extension.api.ApiAction;
import org.zaproxy.zap.extension.api.ApiException;
import org.zaproxy.zap.extension.api.ApiImplementor;
import org.zaproxy.zap.extension.api.ApiResponse;
import org.zaproxy.zap.extension.api.ApiResponseElement;
import org.zaproxy.zap.extension.api.ApiResponseList;
import org.zaproxy.zap.extension.api.ApiView;
import org.zaproxy.zap.extension.script.ScriptWrapper;
import org.zaproxy.zap.extension.websocket.ExtensionWebSocket;

public class HudAPI extends ApiImplementor {

    // TODO shouldnt allow unsafe-inline styles - need to work out where they are being used
    protected static final String CSP_POLICY =
            "default-src 'none'; script-src 'self'; connect-src https://zap wss://zap; frame-src 'self'; img-src 'self' data:; "
                    + "font-src 'self' data:; style-src 'self' 'unsafe-inline' ;";

    protected static final String CSP_POLICY_UNSAFE_EVAL =
            "default-src 'none'; script-src 'self' 'unsafe-eval'; connect-src https://zap wss://zap; frame-src 'self'; img-src 'self' data:; "
                    + "font-src 'self' data:; style-src 'self' 'unsafe-inline' ;";

    private static final String PREFIX = "hud";

    private Map<String, String> siteUrls = new HashMap<String, String>();
    private ExtensionHUD extension;

    private static final String ACTION_LOG = "log";
    private static final String ACTION_RECORD_REQUEST = "recordRequest";
    private static final String ACTION_START_TEST = "startTest";
    private static final String ACTION_STOP_TEST = "stopTest";
    private static final String ACTION_RESET_TUTORIAL_TASKS = "resetTutorialTasks";

    private static final String VIEW_TEST_PROGRESS = "testProgress";
    private static final String VIEW_TEST_AVERAGE_LOAD_TIME = "testAverageLoadTime";
    private static final String VIEW_TEST_PASSES = "testPasses";
    private static final String VIEW_TEST_FAILURES = "testFailures";

    private static final String PARAM_RECORD = "record";
    private static final String PARAM_HEADER = "header";
    private static final String PARAM_BODY = "body";
    private static final String PARAM_BROWSER = "browser";
    private static final String PARAM_TEST_FILE = "testFile";

    /** The only files that can be included on domain */
    private static final List<String> DOMAIN_FILE_WHITELIST =
            Arrays.asList(new String[] {"inject.js"});

    private ApiImplementor hudFileProxy;
    private ApiImplementor hudApiProxy;

    private String hudFileUrl;
    private String hudApiUrl;

    private String websocketUrl;

    /**
     * Shared secret used to ensure that we only accept messages from the ZAP code running on the
     * target domain
     */
    private final String sharedSecret = UUID.randomUUID().toString();

    private static Logger logger = Logger.getLogger(HudAPI.class);

    public HudAPI(ExtensionHUD extension) {
        this.extension = extension;

        this.addApiAction(new ApiAction(ACTION_LOG, new String[] {PARAM_RECORD}));
        this.addApiAction(
                new ApiAction(ACTION_RECORD_REQUEST, new String[] {PARAM_HEADER, PARAM_BODY}));
        this.addApiAction(
                new ApiAction(ACTION_START_TEST, new String[] {PARAM_TEST_FILE, PARAM_BROWSER}));
        this.addApiAction(new ApiAction(ACTION_STOP_TEST));
        this.addApiAction(new ApiAction(ACTION_RESET_TUTORIAL_TASKS));

        this.addApiView(new ApiView(VIEW_TEST_PROGRESS));
        this.addApiView(new ApiView(VIEW_TEST_AVERAGE_LOAD_TIME));
        this.addApiView(new ApiView(VIEW_TEST_PASSES));
        this.addApiView(new ApiView(VIEW_TEST_FAILURES));

        hudFileProxy = new HudFileProxy(this);
        hudFileUrl = API.getInstance().getCallBackUrl(hudFileProxy, API.API_URL_S);
        hudApiProxy = new HudApiProxy();
        hudApiUrl = API.getInstance().getCallBackUrl(hudApiProxy, API.API_URL_S);

        // Temporary hack to make it easier to find the websocket test page
        // We could launch a browser, but then we'd need to depend on selenium
        // and work out which browser to choose...
        new Thread() {
            @Override
            public void run() {
                try {
                    Thread.sleep(5000);
                } catch (InterruptedException e) {
                    // Ignore
                }
                if (View.isInitialised()) {
                    View.getSingleton()
                            .getOutputPanel()
                            .append(
                                    "The websocket testing page is: "
                                            + hudFileUrl
                                            + "?name=websockettest.html\n");
                }
            }
        }.start();
    }

    @Override
    public String getPrefix() {
        return PREFIX;
    }

    protected ApiImplementor getHudApiProxy() {
        return hudApiProxy;
    }

    protected ApiImplementor getHudFileProxy() {
        return hudFileProxy;
    }

    public String getUrlPrefix(String site) {
        String url = this.siteUrls.get(site);
        if (url == null) {
            url = API.getInstance().getCallBackUrl(this, site);
            this.siteUrls.put(site, url);
        }
        return url;
    }

    public void reset() {
        this.siteUrls.clear();
    }

    public boolean allowUnsafeEval() {
        return this.extension.getHudParam().isDevelopmentMode()
                && this.extension.getHudParam().isAllowUnsafeEval();
    }

    @Override
    public String handleCallBack(HttpMessage msg) throws ApiException {
        // Just used to handle files which need to be on the target domain
        try {
            String query = msg.getRequestHeader().getURI().getPathQuery();
            logger.debug("callback query = " + query);
            if (query != null) {
                if (query.indexOf("zapfile=") > 0) {
                    String fileName = query.substring(query.indexOf("zapfile=") + 8);
                    if (DOMAIN_FILE_WHITELIST.contains(fileName)) {
                        msg.setResponseBody(
                                this.getFile(msg, ExtensionHUD.TARGET_DIRECTORY + "/" + fileName));
                        // Currently only javascript files are returned
                        msg.setResponseHeader(
                                API.getDefaultResponseHeader(
                                        "application/javascript; charset=UTF-8",
                                        msg.getResponseBody().length(),
                                        false));
                        return msg.getResponseBody().toString();
                    }
                }
            }
        } catch (Exception e) {
            throw new ApiException(
                    ApiException.Type.URL_NOT_FOUND, msg.getRequestHeader().getURI().toString());
        }
        throw new ApiException(
                ApiException.Type.URL_NOT_FOUND, msg.getRequestHeader().getURI().toString());
    }

    @Override
    public ApiResponse handleApiAction(String name, JSONObject params) throws ApiException {

        switch (name) {
            case ACTION_LOG:
                String record = params.getString(PARAM_RECORD);
                if (View.isInitialised()) {
                    View.getSingleton().getOutputPanel().appendAsync(record + "\n");
                }
                logger.debug(record);
                break;
            case ACTION_RECORD_REQUEST:
                String header = params.getString(PARAM_HEADER);
                String body = params.getString(PARAM_BODY);
                try {
                    HttpMessage requestMsg = new HttpMessage();
                    requestMsg.setRequestHeader(header);
                    requestMsg.setRequestBody(body);
                    requestMsg
                            .getRequestHeader()
                            .setContentLength(requestMsg.getRequestBody().length());
                    return new ApiResponseElement(
                            "requestUrl", this.extension.setRecordedRequest(requestMsg));
                } catch (HttpMalformedHeaderException | URIException e) {
                    throw new ApiException(ApiException.Type.ILLEGAL_PARAMETER, PARAM_HEADER);
                }

            case ACTION_START_TEST:
                File f = new File(params.getString(PARAM_TEST_FILE));
                if (!f.isFile() && !f.canRead()) {
                    throw new ApiException(ApiException.Type.ILLEGAL_PARAMETER, PARAM_TEST_FILE);
                }
                try {
                    if (this.extension.newTestThread(f, params.getString(PARAM_BROWSER)) == null) {
                        throw new ApiException(ApiException.Type.SCAN_IN_PROGRESS);
                    }
                } catch (IllegalArgumentException e) {
                    throw new ApiException(ApiException.Type.ILLEGAL_PARAMETER, PARAM_BROWSER);
                }
                break;
            case ACTION_STOP_TEST:
                HudBrowserTestThread tt = this.extension.getTestThread();
                if (tt != null && tt.isAlive()) {
                    tt.setStop(true);
                } else {
                    throw new ApiException(ApiException.Type.DOES_NOT_EXIST);
                }
                break;

            case ACTION_RESET_TUTORIAL_TASKS:
                this.extension.resetTutorialTasks();
                break;

            default:
                throw new ApiException(ApiException.Type.BAD_ACTION);
        }

        return ApiResponseElement.OK;
    }

    @Override
    public ApiResponse handleApiView(String name, JSONObject params) throws ApiException {

        switch (name) {
            case VIEW_TEST_PROGRESS:
                return new ApiResponseElement(
                        name, Integer.toString(getTestThread().getProgress()));
            case VIEW_TEST_AVERAGE_LOAD_TIME:
                return new ApiResponseElement(
                        name, Long.toString(getTestThread().getAverageLoadTimeInMSecs()));
            case VIEW_TEST_PASSES:
                ApiResponseList passes = new ApiResponseList(name);
                for (String pass : getTestThread().getPasses()) {
                    passes.addItem(new ApiResponseElement("pass", pass));
                }
                return passes;
            case VIEW_TEST_FAILURES:
                ApiResponseList failures = new ApiResponseList(name);
                for (String fail : getTestThread().getFails()) {
                    failures.addItem(new ApiResponseElement("fail", fail));
                }
                return failures;
            default:
                throw new ApiException(ApiException.Type.BAD_VIEW);
        }
    }

    private HudBrowserTestThread getTestThread() throws ApiException {
        HudBrowserTestThread tt = this.extension.getTestThread();
        if (tt == null) {
            throw new ApiException(ApiException.Type.DOES_NOT_EXIST);
        }
        return tt;
    }

    protected String getSite(HttpMessage msg) throws URIException {
        StringBuilder site = new StringBuilder();
        // Always force to https - we fakw this for http sites
        site.append("https://");
        site.append(msg.getRequestHeader().getURI().getHost());
        if (msg.getRequestHeader().getURI().getPort() > 0) {
            site.append(":");
            site.append(msg.getRequestHeader().getURI().getPort());
        }
        return site.toString();
    }

    protected String getFile(HttpMessage msg, String file) {
        try {
            String contents;
            ScriptWrapper sw = this.extension.getExtScript().getScript(file);
            if (sw != null) {
                contents = sw.getContents();
            } else {
                logger.warn("Failed to access script " + file + " via the script extension");
                File f = new File(this.extension.getHudParam().getBaseDirectory(), file);
                if (!f.exists()) {
                    logger.error(
                            "No such file " + f.getAbsolutePath(), new FileNotFoundException(file));
                    return null;
                }
                // Quick way to read a small text file
                contents = new String(Files.readAllBytes(f.toPath()));
            }

            String url = msg.getRequestHeader().getURI().toString();
            if (url.indexOf("/zapCallBackUrl") > 0) {
                // Strip off the callback path
                url = url.substring(0, url.indexOf("/zapCallBackUrl"));
            }
            // Inject content into specific files
            if (file.equals("target/inject.js")) {
                contents =
                        contents.replace("<<URL>>", url)
                                .replace("<<ZAP_SHARED_SECRET>>", this.sharedSecret);
            }
            contents = contents.replace("<<ZAP_HUD_FILES>>", this.hudFileUrl);

            if (url.startsWith(API.API_URL_S)) {
                // Only do these on the ZAP domain
                contents =
                        contents.replace("<<ZAP_HUD_API>>", this.hudApiUrl)
                                .replace("<<ZAP_HUD_WS>>", getWebSocketUrl());

                if (file.equals("serviceworker.js")) {
                    // Inject the tool filenames
                    StringBuilder sb = new StringBuilder();
                    File toolsDir =
                            new File(this.extension.getHudParam().getBaseDirectory(), "tools");
                    for (String tool : toolsDir.list()) {
                        if (tool.toLowerCase(Locale.ROOT).endsWith(".js")) {
                            sb.append("\t\"");
                            sb.append(this.hudFileUrl);
                            sb.append("?name=tools/");
                            sb.append(tool);
                            sb.append("\",\n");
                        }
                    }
                    // The single quotes are to keep the JS linter happy
                    contents = contents.replace("'<<ZAP_HUD_TOOLS>>'", sb.toString());
                } else if (file.equals("i18n.js")) {
                    contents =
                            contents.replace(
                                    "<<ZAP_LOCALE>>", Constant.messages.getLocal().toString());

                } else if (file.equals("utils.js")) {
                    contents = contents.replace("<<ZAP_HUD_API>>", this.hudApiUrl);
                } else if (file.equals("serviceworker.js")) {
                    contents = contents.replace("<<ZAP_HUD_WS>>", getWebSocketUrl());
                } else if (file.equals("websockettest.js")) {
                    contents = contents.replace("<<ZAP_HUD_WS>>", getWebSocketUrl());
                } else if (file.equals("management.html")) {
                    // TODO move into js
                    contents =
                            contents.replace(
                                    "<<SHOW_WELCOME_SCREEN>>",
                                    Boolean.toString(
                                            this.extension.getHudParam().isShowWelcomeScreen()));
                } else if (file.equals("management.js")) {
                    contents =
                            contents.replace(
                                            "<<SHOW_WELCOME_SCREEN>>",
                                            Boolean.toString(
                                                    this.extension
                                                            .getHudParam()
                                                            .isShowWelcomeScreen()))
                                    .replace(
                                            "<<TUTORIAL_URL>>",
                                            this.extension.getTutorialUrl("", false))
                                    .replace("<<ZAP_SHARED_SECRET>>", this.sharedSecret);
                }
            }

            return contents;
        } catch (Exception e) {
            // Something unexpected went wrong, write the error to the log
            logger.error(e.getMessage(), e);
            return null;
        }
    }

    private String getWebSocketUrl() {
        if (websocketUrl == null) {
            websocketUrl =
                    Control.getSingleton()
                            .getExtensionLoader()
                            .getExtension(ExtensionWebSocket.class)
                            .getCallbackUrl();
        }
        return websocketUrl;
    }

    public byte[] getImage(String name) {
        // TODO cache? And support local files
        try {
            InputStream is =
                    this.getClass().getResourceAsStream(ExtensionHUD.RESOURCE + "/" + name);
            if (is == null) {
                logger.error("No such resource: " + name);
                return null;
            }
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            IOUtils.copy(is, bos);
            return bos.toByteArray();
        } catch (Exception e) {
            // Something unexpected went wrong, write the error to the log
            logger.error(e.getMessage(), e);
            return null;
        }
    }

    public static String getAllowFramingResponseHeader(
            String responseStatus, String contentType, int contentLength, boolean canCache) {
        StringBuilder sb = new StringBuilder(250);

        sb.append("HTTP/1.1 ").append(responseStatus).append("\r\n");
        if (!canCache) {
            sb.append("Pragma: no-cache\r\n");
            sb.append("Cache-Control: no-cache\r\n");
        } else {
            // todo: found this necessary to cache, remove if not
            sb.append("Cache-Control: public,max-age=3000000\r\n");
        }
        sb.append("Content-Security-Policy: ").append(HudAPI.CSP_POLICY).append("\r\n");
        sb.append("Access-Control-Allow-Methods: GET,POST,OPTIONS\r\n");
        sb.append("Access-Control-Allow-Headers: ZAP-Header\r\n");
        sb.append("X-XSS-Protection: 1; mode=block\r\n");
        sb.append("X-Content-Type-Options: nosniff\r\n");
        sb.append("X-Clacks-Overhead: GNU Terry Pratchett\r\n");
        sb.append("Content-Length: ").append(contentLength).append("\r\n");
        sb.append("Content-Type: ").append(contentType).append("\r\n");

        return sb.toString();
    }
}
