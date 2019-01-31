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

import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.File;
import java.io.IOException;
import java.lang.reflect.Method;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.swing.ImageIcon;
import org.apache.commons.httpclient.URI;
import org.apache.commons.httpclient.URIException;
import org.apache.log4j.Logger;
import org.parosproxy.paros.Constant;
import org.parosproxy.paros.control.Control;
import org.parosproxy.paros.core.proxy.ProxyListener;
import org.parosproxy.paros.extension.Extension;
import org.parosproxy.paros.extension.ExtensionAdaptor;
import org.parosproxy.paros.extension.ExtensionHook;
import org.parosproxy.paros.extension.OptionsChangedListener;
import org.parosproxy.paros.extension.history.ProxyListenerLog;
import org.parosproxy.paros.model.OptionsParam;
import org.parosproxy.paros.network.HttpHeader;
import org.parosproxy.paros.network.HttpMessage;
import org.parosproxy.paros.view.View;
import org.zaproxy.zap.ZAP;
import org.zaproxy.zap.eventBus.Event;
import org.zaproxy.zap.extension.hud.tutorial.TutorialProxyServer;
import org.zaproxy.zap.extension.script.ExtensionScript;
import org.zaproxy.zap.extension.script.ScriptEventListener;
import org.zaproxy.zap.extension.script.ScriptType;
import org.zaproxy.zap.extension.script.ScriptWrapper;
import org.zaproxy.zap.extension.websocket.ExtensionWebSocket;
import org.zaproxy.zap.view.ZapToggleButton;

/*
 * An example ZAP extension which adds a top level menu item.
 *
 * This class is defines the extension.
 */
public class ExtensionHUD extends ExtensionAdaptor
        implements ProxyListener, ScriptEventListener, OptionsChangedListener {

    // The name is public so that other extensions can access it
    public static final String NAME = "ExtensionHUD";

    // The i18n prefix, by default the package name - defined in one place to make it easier
    // to copy and change this example
    protected static final String PREFIX = "hud";

    protected static final String RESOURCE = "/org/zaproxy/zap/extension/hud/resources";

    private static final ImageIcon ICON =
            new ImageIcon(ExtensionHUD.class.getResource(RESOURCE + "/radar.png"));

    public static final String SCRIPT_TYPE_HUD = "hud";

    protected static final String DIRECTORY_NAME = "hud";
    protected static final String TARGET_DIRECTORY = "target";
    protected static final String HUD_HTML = TARGET_DIRECTORY + "/injectionHtml.html";

    private static final String HTTP_HEADER_CSP = "Content-Security-Policy";
    private static final String HTTP_HEADER_XCSP = "X-Content-Security-Policy";
    private static final String HTTP_HEADER_WEBKIT_CSP = "X-WebKit-CSP";
    private static final String HTTP_HEADER_REFERRER_POLICY = "Referrer-Policy";

    // Change only after the message has been persisted, otherwise ZAP would see the HUD injections.
    private static final int PROXY_LISTENER_ORDER = ProxyListenerLog.PROXY_LISTENER_ORDER + 1000;

    private static final List<Class<? extends Extension>> DEPENDENCIES;

    private static final String REPLACE_REQUEST_PARAM = "zapHudReplaceReq=";
    private Map<String, HttpMessage> recordedRequests = new HashMap<String, HttpMessage>();

    static {
        List<Class<? extends Extension>> dependencies = new ArrayList<>(1);
        dependencies.add(ExtensionScript.class);
        dependencies.add(ExtensionWebSocket.class);

        DEPENDENCIES = Collections.unmodifiableList(dependencies);
    }

    private HudAPI api = new HudAPI(this);

    private ScriptType hudScriptType =
            new ScriptType(SCRIPT_TYPE_HUD, "hud.script.type.hud", ICON, false);

    private Logger log = Logger.getLogger(this.getClass());

    private ZapToggleButton hudButton = null;
    private boolean hudEnabledForDesktop = false;
    private boolean hudEnabledForDaemon = false;
    private HudParam hudParam = null;
    private OptionsHudPanel optionsPanel = null;

    private ExtensionScript extScript = null;
    private String baseDirectory;
    private Set<String> upgradedHttpsDomains = new HashSet<String>();
    private TutorialProxyServer tutorialServer;

    /** */
    public ExtensionHUD() {
        super();
        initialize();
    }

    /** @param name */
    public ExtensionHUD(String name) {
        super(name);
    }

    /** This method initializes this */
    private void initialize() {
        this.setName(NAME);
    }

    @Override
    public List<Class<? extends Extension>> getDependencies() {
        return DEPENDENCIES;
    }

    @Override
    public void hook(ExtensionHook extensionHook) {
        super.hook(extensionHook);

        this.api.addApiOptions(getHudParam());
        extensionHook.addApiImplementor(this.api);
        extensionHook.addApiImplementor(this.api.getHudApiProxy());
        extensionHook.addApiImplementor(this.api.getHudFileProxy());

        extensionHook.addOptionsParamSet(this.getHudParam());
        extensionHook.addOptionsChangedListener(this);

        extensionHook.addOverrideMessageProxyListener(new HttpUpgradeProxyListener(this));

        if (getView() != null) {
            extensionHook.getHookView().addOptionPanel(getOptionsPanel());
            extensionHook.getHookView().addMainToolBarComponent(getHudButton());
        }

        // No reason this cant be used in daemon mode ;)
        extensionHook.addProxyListener(this);

        hudScriptType.addCapability("external");
        this.getExtScript().registerScriptType(hudScriptType);

        this.getExtScript().addListener(this);

        tutorialServer = new TutorialProxyServer(this);
    }

    @Override
    public boolean canUnload() {
        return true;
    }

    @Override
    public void unload() {
        getExtScript().removeScripType(hudScriptType);
        getExtScript().removeListener(this);

        HudEventPublisher.unregister();

        tutorialServer.stopServer();
    }

    @Override
    public void optionsLoaded() {
        addHudScripts();
        this.hudEnabledForDesktop = getHudParam().isEnabledForDesktop();
        if (View.isInitialised()) {
            this.getHudButton().setSelected(hudEnabledForDesktop);
            setZapCanGetFocus(!this.hudEnabledForDesktop);
        }
        this.hudEnabledForDaemon = getHudParam().isEnabledForDaemon();
        if (getHudParam().isDevelopmentMode()) {
            ZAP.getEventBus()
                    .publishSyncEvent(
                            HudEventPublisher.getPublisher(),
                            new Event(
                                    HudEventPublisher.getPublisher(),
                                    HudEventPublisher.EVENT_DEV_MODE_ENABLED,
                                    null));
        }
        tutorialServer.start();
    }

    protected boolean isHudEnabled() {
        if (View.isInitialised()) {
            return hudEnabledForDesktop;
        } else {
            return hudEnabledForDaemon;
        }
    }

    /**
     * Tell ZAP if it can grab the focus or not - should only be called if the View has been
     * initialised.
     *
     * @param canGetFocus
     */
    private void setZapCanGetFocus(boolean canGetFocus) {
        // Post 2.7.0 so for now try to access via reflection
        try {
            Method m = View.class.getMethod("setCanGetFocus", boolean.class);
            m.invoke(View.getSingleton(), canGetFocus);
        } catch (Exception e) {
            log.debug(e.getMessage(), e);
        }
    }

    private void addHudScripts() {
        this.baseDirectory = this.getHudParam().getBaseDirectory();
        File hudDir = new File(this.baseDirectory);
        this.addScripts(hudDir, "", hudScriptType);
    }

    private void removeHudScripts() {
        for (ScriptWrapper sw : this.getExtScript().getScripts(hudScriptType)) {
            this.getExtScript().removeScript(sw);
        }
    }

    public HudParam getHudParam() {
        if (hudParam == null) {
            hudParam = new HudParam();
        }
        return hudParam;
    }

    private OptionsHudPanel getOptionsPanel() {
        if (optionsPanel == null) {
            optionsPanel = new OptionsHudPanel(this);
        }
        return optionsPanel;
    }

    public void addUpgradedHttpsDomain(URI uri) throws URIException {
        this.upgradedHttpsDomains.add(getNormalisedDomain(uri));
    }

    static String getNormalisedDomain(URI uri) throws URIException {
        int port = uri.getPort();
        if (port == -1) {
            return uri.getHost();
        }
        return uri.getHost() + ":" + uri.getPort();
    }

    public void removeUpgradedHttpsDomain(URI uri) throws URIException {
        this.upgradedHttpsDomains.remove(getNormalisedDomain(uri));
    }

    public boolean isUpgradedHttpsDomain(URI uri) throws URIException {
        return this.upgradedHttpsDomains.contains(getNormalisedDomain(uri));
    }

    private void addScripts(File file, String prefix, ScriptType hudScriptType) {
        if (file.isFile()) {
            try {
                // Add to tree
                ScriptWrapper sw =
                        new ScriptWrapper(
                                prefix + file.getName(), "", "Null", hudScriptType, false, file);
                this.getExtScript().loadScript(sw);
                this.getExtScript().addScript(sw, false);
            } catch (IOException e) {
                log.error(e.getMessage(), e);
            }

        } else if (file.isDirectory()) {
            if (!DIRECTORY_NAME.equals(file.getName())) {
                // strip out the top level 'hud' directory to make it a bit tidier
                prefix = prefix + file.getName() + "/";
            }
            for (File f : file.listFiles()) {
                this.addScripts(f, prefix, hudScriptType);
            }
        }
    }

    private ZapToggleButton getHudButton() {
        if (hudButton == null) {
            hudButton = new ZapToggleButton(ICON);
            hudButton.setSelectedToolTipText(
                    Constant.messages.getString("hud.toolbar.button.on.tooltip"));
            hudButton.setToolTipText(Constant.messages.getString("hud.toolbar.button.off.tooltip"));
            hudButton.addActionListener(
                    new ActionListener() {
                        @Override
                        public void actionPerformed(ActionEvent e) {
                            hudEnabledForDesktop = hudButton.isSelected();
                            getHudParam().setEnabledForDesktop(hudEnabledForDesktop);
                            setZapCanGetFocus(!hudEnabledForDesktop);
                        }
                    });
        }
        return hudButton;
    }

    @Override
    public String getAuthor() {
        return Constant.ZAP_TEAM;
    }

    @Override
    public String getDescription() {
        return Constant.messages.getString(PREFIX + ".desc");
    }

    @Override
    public URL getURL() {
        try {
            return new URL(Constant.ZAP_EXTENSIONS_PAGE);
        } catch (MalformedURLException e) {
            return null;
        }
    }

    @Override
    public int getArrangeableListenerOrder() {
        return PROXY_LISTENER_ORDER;
    }

    @Override
    public boolean onHttpRequestSend(HttpMessage msg) {
        // Check for a replaced request
        try {
            String url = msg.getRequestHeader().getURI().toString();
            if (this.recordedRequests.size() > 0 && url.indexOf(REPLACE_REQUEST_PARAM) > 0) {
                HttpMessage replacedMsg = this.recordedRequests.remove(url);
                if (replacedMsg != null) {
                    msg.setRequestHeader(replacedMsg.getRequestHeader());
                    msg.setRequestBody(replacedMsg.getRequestBody());
                    log.debug("Replaced full message " + msg.getRequestHeader().getMethod());
                } else {
                    log.warn("Failed to find request with url " + url);
                }
            }
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }
        return true;
    }

    @Override
    public boolean onHttpResponseReceive(HttpMessage msg) {
        if (this.isHudEnabled() && msg.getResponseHeader().isHtml()) {
            if (getHudParam().isInScopeOnly() && !msg.isInScope()) {
                return true;
            }
            try {
                HtmlEditor htmlEd = new HtmlEditor(msg);
                String hudScript = this.api.getFile(msg, HUD_HTML);
                // These are the only files that use FILE_PREFIX
                hudScript =
                        hudScript.replace("<<FILE_PREFIX>>", api.getUrlPrefix(api.getSite(msg)));
                htmlEd.injectAtStartOfBody(hudScript);
                htmlEd.rewriteHttpMessage();

                if (htmlEd.isChanged()) {
                    URI uri = msg.getRequestHeader().getURI();
                    if (this.isUpgradedHttpsDomain(uri)) {
                        // Advise that we've upgraded this domain to https
                        Map<String, String> map = new HashMap<String, String>();
                        map.put(HudEventPublisher.FIELD_DOMAIN, getNormalisedDomain(uri));
                        ZAP.getEventBus()
                                .publishSyncEvent(
                                        HudEventPublisher.getPublisher(),
                                        new Event(
                                                HudEventPublisher.getPublisher(),
                                                HudEventPublisher.EVENT_DOMAIN_UPGRADED_TO_HTTPS,
                                                null,
                                                map));
                    }

                    // The Referrer-Policy header break the HUD, always strip it out
                    msg.getResponseHeader().setHeader(HTTP_HEADER_REFERRER_POLICY, null);
                    // Browser caches will cause the browser to use old callback urls which will
                    // also fail
                    msg.getResponseHeader()
                            .setHeader(HttpHeader.CACHE_CONTROL, "no-cache, no-store");

                    if (this.getHudParam().isRemoveCSP()) {
                        // Remove all of them, just in case
                        msg.getResponseHeader().setHeader(HTTP_HEADER_CSP, null);
                        msg.getResponseHeader().setHeader(HTTP_HEADER_XCSP, null);
                        msg.getResponseHeader().setHeader(HTTP_HEADER_WEBKIT_CSP, null);
                    }
                } else {
                    log.debug("Failed to find body tag on " + msg.getRequestHeader().getURI());
                }
            } catch (Exception e) {
                log.error(e.getMessage(), e);
            }
        }
        return true;
    }

    protected String setRecordedRequest(HttpMessage request) throws URIException {
        /*
         * The HUD UI calls the API endpoint that calls this function and then
         * immediately calls the URL this function returns, which removes the
         * recorded request. If that ever changes then there might be a requirement
         * to delete any requests that have not been consumed.
         */
        String key = UUID.randomUUID().toString();
        String url = request.getRequestHeader().getURI().toString();
        String fragment = null;
        StringBuilder sb = new StringBuilder();
        int fragmentOffset = url.indexOf("%23");
        if (fragmentOffset > 0) {
            // %23 is the # character, so this is really a fragment
            fragment = url.substring(fragmentOffset + 3);
            // Replace in the header
            request.getRequestHeader().setURI(new URI(url.replace("%23", "#"), true));
            // Remove from the local copy - it will be added again at the end
            url = url.substring(0, fragmentOffset);
        }
        if (url.indexOf(REPLACE_REQUEST_PARAM) > 0) {
            sb.append(url.substring(0, url.indexOf(REPLACE_REQUEST_PARAM)));
        } else {
            sb.append(url);
            if (url.contains("?")) {
                sb.append('&');
            } else {
                sb.append('?');
            }
        }
        sb.append(REPLACE_REQUEST_PARAM);
        sb.append(key);
        // The request we get from the browser wont contain the fragment
        // and will have been downgraded from https -> http is relevant
        this.recordedRequests.put(sb.toString(), request);

        if (fragment != null) {
            sb.append("#");
            sb.append(fragment);
        }
        String reqUrl = sb.toString().replace("http://", "https://");
        log.debug("setRecordedRequest returning " + reqUrl);
        return reqUrl;
    }

    /** @return index of pattern in s or -1, if not found */
    public static int regexEndOf(Pattern pattern, String s) {
        Matcher matcher = pattern.matcher(s);
        return matcher.find() ? matcher.end() : -1;
    }

    public ExtensionScript getExtScript() {
        if (extScript == null) {
            extScript =
                    Control.getSingleton().getExtensionLoader().getExtension(ExtensionScript.class);
        }
        return extScript;
    }

    public void resetTutorialTasks() {
        this.getHudParam().resetTutorialTasks();
        this.tutorialServer.resetTasks();
    }

    public String getTutorialUrl(String page, boolean https) {
        return this.tutorialServer.getTutorialUrl(page, https);
    }

    @Override
    public void preInvoke(ScriptWrapper arg0) {
        // Ignore
    }

    @Override
    public void refreshScript(ScriptWrapper arg0) {
        // Ignore
    }

    @Override
    public void scriptAdded(ScriptWrapper sw, boolean arg1) {
        if (!hudScriptType.equals(sw.getType())) {
            return;
        }

        // Detect duplicated files and save them to the right place
        if (sw.getFile() == null) {
            try {
                sw.setFile(new File(this.baseDirectory, sw.getName()));
                this.getExtScript().saveScript(sw);
            } catch (IOException e) {
                log.error(e.getMessage(), e);
            }
        }
    }

    @Override
    public void scriptChanged(ScriptWrapper arg0) {
        // Ignore
    }

    @Override
    public void scriptError(ScriptWrapper arg0) {
        // Ignore
    }

    @Override
    public void scriptRemoved(ScriptWrapper arg0) {
        // Ignore
    }

    @Override
    public void scriptSaved(ScriptWrapper arg0) {
        // Ignore
    }

    @Override
    public void templateAdded(ScriptWrapper arg0, boolean arg1) {
        // Ignore
    }

    @Override
    public void templateRemoved(ScriptWrapper arg0) {
        // Ignore
    }

    @Override
    public void optionsChanged(OptionsParam arg0) {
        if (!this.getHudParam().getBaseDirectory().equals(this.baseDirectory)) {
            log.info("Reloading HUD scripts");
            this.removeHudScripts();
            this.addHudScripts();
        }
        this.hudEnabledForDesktop = getHudParam().isEnabledForDesktop();
        if (View.isInitialised()) {
            this.getHudButton().setSelected(hudEnabledForDesktop);
            setZapCanGetFocus(!this.hudEnabledForDesktop);
        }
        this.hudEnabledForDaemon = getHudParam().isEnabledForDaemon();
    }

    public HudAPI getAPI() {
        return this.api;
    }

    protected Set<String> getUpgradedHttpsDomains() {
        return upgradedHttpsDomains;
    }
}
