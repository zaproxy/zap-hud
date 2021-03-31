/*
 * Zed Attack Proxy (ZAP) and its related class files.
 *
 * ZAP is an HTTP/HTTPS proxy for assessing web application security.
 *
 * Copyright 2017 The ZAP Development Team
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

import java.util.ArrayList;
import java.util.List;
import net.sf.json.JSONArray;
import net.sf.json.JSONObject;
import org.apache.commons.configuration.ConfigurationException;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.parosproxy.paros.Constant;
import org.zaproxy.zap.ZAP;
import org.zaproxy.zap.common.VersionedAbstractParam;
import org.zaproxy.zap.eventBus.Event;
import org.zaproxy.zap.extension.api.ZapApiIgnore;
import org.zaproxy.zap.extension.hud.tutorial.pages.AjaxSpiderPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.CommentsPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.HistoryPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.HudConfigPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.ToggleScriptPage;

public class HudParam extends VersionedAbstractParam {

    public static final String UI_OPTION_LEFT_PANEL = "leftPanel";
    public static final String UI_OPTION_RIGHT_PANEL = "rightPanel";
    public static final String UI_OPTION_DRAWER = "drawer";

    private static final String ZAP_HUD_CONFIG_TOOLS_LEFT =
            "['scope', 'break', 'showEnable', 'page-alerts-high', 'page-alerts-medium', 'page-alerts-low', 'page-alerts-informational']";
    private static final String ZAP_HUD_CONFIG_TOOLS_RIGHT =
            "['site-tree', 'spider', 'ajaxspider', 'active-scan', 'attack', 'site-alerts-high', 'site-alerts-medium', 'site-alerts-low', 'site-alerts-informational']";

    /** The base configuration key for all HUD configurations. */
    private static final String PARAM_BASE_KEY = "hud";

    private static final String PARAM_ENABLED_DESKTOP = PARAM_BASE_KEY + ".enabledForDesktop";
    private static final String PARAM_ENABLED_DAEMON = PARAM_BASE_KEY + ".enabledForDaemon";
    private static final String PARAM_BASE_DIRECTORY = PARAM_BASE_KEY + ".dir";
    private static final String PARAM_DEV_MODE = PARAM_BASE_KEY + ".devMode";
    private static final String PARAM_ALLOW_UNSAFE_EVAL = PARAM_BASE_KEY + ".unsafeEval";
    private static final String PARAM_IN_SCOPE_ONLY = PARAM_BASE_KEY + ".inScopeOnly";
    private static final String PARAM_REMOVE_CSP = PARAM_BASE_KEY + ".removeCsp";
    private static final String PARAM_TUTORIAL_PORT = PARAM_BASE_KEY + ".tutorialPort";
    private static final String PARAM_TUTORIAL_HOST = PARAM_BASE_KEY + ".tutorialHost";
    private static final String PARAM_TUTORIAL_SKIP_TASKS = PARAM_BASE_KEY + ".tutorialSkipTasks";
    private static final String PARAM_TUTORIAL_TEST_MODE = PARAM_BASE_KEY + ".tutorialTestMode";
    private static final String PARAM_TUTORIAL_TASKS = PARAM_BASE_KEY + ".tutorialTasks";
    private static final String PARAM_TUTORIAL_UPDATES = PARAM_BASE_KEY + ".tutorialUpdates";
    private static final String PARAM_SHOW_WELCOME_SCREEN = PARAM_BASE_KEY + ".showWelcomeScreen";
    private static final String PARAM_NEW_CHANGELOG = PARAM_BASE_KEY + ".newChangelog";
    private static final String PARAM_ENABLE_ON_DOMAIN_MSGS =
            PARAM_BASE_KEY + ".enableOnDomainMsgs";
    private static final String PARAM_UI_OPTION_PREFIX = PARAM_BASE_KEY + ".uiOption.";
    private static final String PARAM_ENABLE_TELEMETRY = PARAM_BASE_KEY + ".enableTelemetry";

    /**
     * The version of the configurations. Used to keep track of configurations changes between
     * releases, if updates are needed.
     *
     * <p>It only needs to be updated for configurations changes (not releases of the add-on).
     * However for the HUD we do use it to flag new features, so it will typically be updated for
     * each new version of the HUD.
     */
    private static final int PARAM_CURRENT_VERSION = 4;

    private String baseDirectory;

    private boolean developmentMode;

    private boolean allowUnsafeEval;

    private boolean enabledForDesktop;
    private boolean enabledForDaemon;

    private boolean inScopeOnly;

    private boolean removeCSP;

    private int tutorialPort;

    private String tutorialHost;

    private boolean isSkipTutorialTasks;

    private boolean isTutorialTestMode;

    private boolean showWelcomeScreen;

    private boolean enableOnDomainMsgs;

    private boolean enableTelemetry;

    private List<String> tutorialTasks;

    private List<String> tutorialUpdates = new ArrayList<>();

    private boolean newChangelog;

    private Logger log = LogManager.getLogger(this.getClass());

    public String getBaseDirectory() {
        return baseDirectory;
    }

    public void setBaseDirectory(String baseDirectory) {
        this.baseDirectory = baseDirectory;
        getConfig().setProperty(PARAM_BASE_DIRECTORY, baseDirectory);
    }

    public boolean isDevelopmentMode() {
        return developmentMode;
    }

    public void setDevelopmentMode(boolean developmentMode) {
        this.developmentMode = developmentMode;
        getConfig().setProperty(PARAM_DEV_MODE, developmentMode);
    }

    public boolean isAllowUnsafeEval() {
        return allowUnsafeEval;
    }

    @ZapApiIgnore // Feels too dangerous to allow this
    public void setAllowUnsafeEval(boolean allowUnsafeEval) {
        /* TODO uncomment when the HUD can run without this
        this.allowUnsafeEval = allowUnsafeEval;
        getConfig().setProperty(PARAM_ALLOW_UNSAFE_EVAL, allowUnsafeEval);
        */
    }

    public boolean isEnabledForDesktop() {
        return enabledForDesktop;
    }

    public void setEnabledForDesktop(boolean enabledForDesktop) {
        this.enabledForDesktop = enabledForDesktop;
        getConfig().setProperty(PARAM_ENABLED_DESKTOP, enabledForDesktop);
        String event;
        if (enabledForDesktop) {
            event = HudEventPublisher.EVENT_ENABLED_FOR_DESKTOP;
        } else {
            event = HudEventPublisher.EVENT_DISABLED_FOR_DESKTOP;
        }
        ZAP.getEventBus()
                .publishSyncEvent(
                        HudEventPublisher.getPublisher(),
                        new Event(HudEventPublisher.getPublisher(), event, null));
    }

    public boolean isEnabledForDaemon() {
        return enabledForDaemon;
    }

    public void setEnabledForDaemon(boolean enabledForDaemon) {
        this.enabledForDaemon = enabledForDaemon;
        getConfig().setProperty(PARAM_ENABLED_DAEMON, enabledForDaemon);
        String event;
        if (enabledForDaemon) {
            event = HudEventPublisher.EVENT_ENABLED_FOR_DAEMON;
        } else {
            event = HudEventPublisher.EVENT_DISABLED_FOR_DAEMON;
        }
        ZAP.getEventBus()
                .publishSyncEvent(
                        HudEventPublisher.getPublisher(),
                        new Event(HudEventPublisher.getPublisher(), event, null));
    }

    public boolean isInScopeOnly() {
        return inScopeOnly;
    }

    public void setInScopeOnly(boolean inScopeOnly) {
        this.inScopeOnly = inScopeOnly;
        getConfig().setProperty(PARAM_IN_SCOPE_ONLY, inScopeOnly);
    }

    public boolean isRemoveCSP() {
        return removeCSP;
    }

    public void setRemoveCSP(boolean removeCSP) {
        this.removeCSP = removeCSP;
        getConfig().setProperty(PARAM_REMOVE_CSP, removeCSP);
    }

    public boolean isSkipTutorialTasks() {
        return isSkipTutorialTasks;
    }

    public void setSkipTutorialTasks(boolean isSkipTutorialTasks) {
        this.isSkipTutorialTasks = isSkipTutorialTasks;
        getConfig().setProperty(PARAM_TUTORIAL_SKIP_TASKS, isSkipTutorialTasks);
    }

    public boolean isTutorialTestMode() {
        return isTutorialTestMode;
    }

    public void setTutorialTestMode(boolean isTutorialTestMode) {
        this.isTutorialTestMode = isTutorialTestMode;
        getConfig().setProperty(PARAM_TUTORIAL_TEST_MODE, isTutorialTestMode);
    }

    public boolean isShowWelcomeScreen() {
        return showWelcomeScreen;
    }

    public void setShowWelcomeScreen(boolean showWelcomeScreen) {
        this.showWelcomeScreen = showWelcomeScreen;
        getConfig().setProperty(PARAM_SHOW_WELCOME_SCREEN, showWelcomeScreen);
    }

    public boolean isEnableOnDomainMsgs() {
        return enableOnDomainMsgs;
    }

    public void setEnableOnDomainMsgs(boolean enableOnDomainMsgs) {
        this.enableOnDomainMsgs = enableOnDomainMsgs;
        getConfig().setProperty(PARAM_ENABLE_ON_DOMAIN_MSGS, enableOnDomainMsgs);
    }

    public boolean isEnableTelemetry() {
        return enableTelemetry;
    }

    public void setEnableTelemetry(boolean enableTelemetry) {
        this.enableTelemetry = enableTelemetry;
        getConfig().setProperty(PARAM_ENABLE_TELEMETRY, enableTelemetry);
    }

    @Override
    protected String getConfigVersionKey() {
        return PARAM_BASE_KEY + VERSION_ATTRIBUTE;
    }

    @Override
    protected int getCurrentVersion() {
        return PARAM_CURRENT_VERSION;
    }

    @Override
    protected void parseImpl() {
        baseDirectory =
                getConfig()
                        .getString(
                                PARAM_BASE_DIRECTORY,
                                Constant.getZapHome() + ExtensionHUD.DIRECTORY_NAME);
        enabledForDesktop = getConfig().getBoolean(PARAM_ENABLED_DESKTOP, true);
        enabledForDaemon = getConfig().getBoolean(PARAM_ENABLED_DAEMON, false);
        developmentMode = getConfig().getBoolean(PARAM_DEV_MODE, false);
        // TODO default allowUnsafeEval to false once the HUD works without it set
        allowUnsafeEval = getConfig().getBoolean(PARAM_ALLOW_UNSAFE_EVAL, true);
        // Remove the next line when the HUD can run without this
        allowUnsafeEval = true;
        inScopeOnly = getConfig().getBoolean(PARAM_IN_SCOPE_ONLY, false);
        removeCSP = getConfig().getBoolean(PARAM_REMOVE_CSP, true);
        tutorialPort = getConfig().getInt(PARAM_TUTORIAL_PORT, 0);
        tutorialHost = getConfig().getString(PARAM_TUTORIAL_HOST, "127.0.0.1");
        isSkipTutorialTasks = getConfig().getBoolean(PARAM_TUTORIAL_SKIP_TASKS, false);
        isTutorialTestMode = getConfig().getBoolean(PARAM_TUTORIAL_TEST_MODE, false);
        tutorialTasks = convert(getConfig().getList(PARAM_TUTORIAL_TASKS));
        tutorialUpdates = convert(getConfig().getList(PARAM_TUTORIAL_UPDATES));
        showWelcomeScreen = getConfig().getBoolean(PARAM_SHOW_WELCOME_SCREEN, true);
        newChangelog = getConfig().getBoolean(PARAM_NEW_CHANGELOG, false);
        enableOnDomainMsgs = getConfig().getBoolean(PARAM_ENABLE_ON_DOMAIN_MSGS, true);
        enableTelemetry =
                !Constant.isSilent()
                        && getConfig().getBoolean(PARAM_ENABLE_TELEMETRY, !Constant.isDevMode());
    }

    private List<String> convert(List<Object> objs) {
        List<String> strs = new ArrayList<>(objs.size());
        for (Object obj : objs) {
            strs.add(obj.toString());
        }
        return strs;
    }

    private void saveConfig() {
        try {
            this.getConfig().save();
        } catch (ConfigurationException e) {
            log.error(e.getMessage(), e);
        }
    }

    @Override
    protected void updateConfigsImpl(int fileVersion) {
        newChangelog = true;
        getConfig().setProperty(PARAM_NEW_CHANGELOG, newChangelog);

        if (fileVersion == 1) {
            addTutorialUpdate(AjaxSpiderPage.NAME);
            addTutorialUpdate(HudConfigPage.NAME);
        }
        if (fileVersion <= 2) {
            addTutorialUpdate(HistoryPage.NAME);
        }
        if (fileVersion <= 3) {
            addTutorialUpdate(CommentsPage.NAME);
            addTutorialUpdate(ToggleScriptPage.NAME);
        }
        getConfig().setProperty(PARAM_TUTORIAL_UPDATES, tutorialUpdates);

        saveConfig();
    }

    private void addTutorialUpdate(String page) {
        if (!tutorialUpdates.contains(page)) {
            tutorialUpdates.add(page);
        }
    }

    /**
     * Returns the port the tutorial should run on. By default this will be 0, meaning that a random
     * port will be used. This can be changed via a command line config value for unit tests where
     * the port needs to be known in advance.
     *
     * @return
     */
    public int getTutorialPort() {
        return tutorialPort;
    }

    /**
     * Returns the host address the tutorial should run on. By default this will be 127.0.0.1. This
     * can be changed via a command line config value for unit tests where the host needs to be
     * another value.
     *
     * @return
     */
    public String getTutorialHost() {
        return tutorialHost;
    }

    public void setTutorialTaskDone(String task) {
        if (!isTutorialTaskDone(task)) {
            this.tutorialTasks.add(task);
            getConfig().setProperty(PARAM_TUTORIAL_TASKS, tutorialTasks);
            saveConfig();
        }
    }

    public boolean isTutorialTaskDone(String task) {
        return this.tutorialTasks.contains(task);
    }

    public List<String> getTutorialTasksDone() {
        return this.tutorialTasks;
    }

    public void resetTutorialTasks() {
        tutorialTasks.clear();
        getConfig().setProperty(PARAM_TUTORIAL_TASKS, tutorialTasks);
        saveConfig();
    }

    public List<String> getTutorialUpdates() {
        return this.tutorialUpdates;
    }

    public void clearTutorialUpdate(String page) {
        if (this.tutorialUpdates.remove(page)) {
            getConfig().setProperty(PARAM_TUTORIAL_UPDATES, tutorialUpdates);
            saveConfig();
        }
    }

    public void setUiOption(String key, String value) {
        getConfig().setProperty(PARAM_UI_OPTION_PREFIX + key, value);
        saveConfig();
    }

    public void clearNewChangelog() {
        this.newChangelog = false;
        getConfig().setProperty(PARAM_NEW_CHANGELOG, newChangelog);
        saveConfig();
    }

    public String getUiOption(String key) {
        String value = getConfig().getString(PARAM_UI_OPTION_PREFIX + key, "");
        if (value.length() == 0) {
            // Set the relevant default values
            switch (key) {
                case UI_OPTION_LEFT_PANEL:
                    value = ZAP_HUD_CONFIG_TOOLS_LEFT;
                    break;
                case UI_OPTION_RIGHT_PANEL:
                    value = ZAP_HUD_CONFIG_TOOLS_RIGHT;
                    break;
                case UI_OPTION_DRAWER:
                    JSONObject obj = new JSONObject();
                    JSONArray upds = new JSONArray();
                    upds.addAll(this.getTutorialUpdates());
                    obj.put("tutorialUpdates", upds);
                    obj.put("newChangelog", newChangelog);
                    value = obj.toString();
                    break;
            }
        }
        return value;
    }
}
