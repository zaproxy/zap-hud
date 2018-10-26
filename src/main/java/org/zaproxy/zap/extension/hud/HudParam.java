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

import java.io.File;
import org.parosproxy.paros.Constant;
import org.zaproxy.zap.common.VersionedAbstractParam;
import org.zaproxy.zap.extension.api.ZapApiIgnore;

public class HudParam extends VersionedAbstractParam {

    /** The base configuration key for all HUD configurations. */
    private static final String PARAM_BASE_KEY = "hud";

    private static final String PARAM_ENABLED = PARAM_BASE_KEY + ".enabled";
    private static final String PARAM_BASE_DIRECTORY = PARAM_BASE_KEY + ".dir";
    private static final String PARAM_DEV_MODE = PARAM_BASE_KEY + ".devMode";
    private static final String PARAM_ALLOW_UNSAFE_EVAL = PARAM_BASE_KEY + ".unsafeEval";
    private static final String PARAM_IN_SCOPE_ONLY = PARAM_BASE_KEY + ".inScopeOnly";
    private static final String PARAM_REMOVE_CSP = PARAM_BASE_KEY + ".removeCsp";
    private static final String PARAM_TUTORIAL_PORT = PARAM_BASE_KEY + ".tutorialPort";
    private static final String PARAM_TUTORIAL_HOST = PARAM_BASE_KEY + ".tutorialHost";

    /**
     * The version of the configurations. Used to keep track of configurations changes between
     * releases, if updates are needed.
     *
     * <p>It only needs to be updated for configurations changes (not releases of the add-on).
     */
    private static final int PARAM_CURRENT_VERSION = 1;

    private String baseDirectory;

    private boolean developmentMode;

    private boolean allowUnsafeEval;

    private boolean enabled;

    private boolean inScopeOnly;

    private boolean removeCSP;

    private int tutorialPort;

    private String tutorialHost;

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
        this.allowUnsafeEval = allowUnsafeEval;
        getConfig().setProperty(PARAM_ALLOW_UNSAFE_EVAL, allowUnsafeEval);
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void setEnabled(boolean enabled) {
        this.enabled = enabled;
        getConfig().setProperty(PARAM_ENABLED, enabled);
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
                                Constant.getZapHome()
                                        + File.separator
                                        + ExtensionHUD.DIRECTORY_NAME);
        enabled = getConfig().getBoolean(PARAM_ENABLED, false);
        developmentMode = getConfig().getBoolean(PARAM_DEV_MODE, false);
        allowUnsafeEval = getConfig().getBoolean(PARAM_ALLOW_UNSAFE_EVAL, false);
        inScopeOnly = getConfig().getBoolean(PARAM_IN_SCOPE_ONLY, false);
        removeCSP = getConfig().getBoolean(PARAM_REMOVE_CSP, true);
        tutorialPort = getConfig().getInt(PARAM_TUTORIAL_PORT, 0);
        tutorialHost = getConfig().getString(PARAM_TUTORIAL_HOST, "127.0.0.1");
    }

    @Override
    protected void updateConfigsImpl(int arg0) {
        // Currently nothing to do

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
}
