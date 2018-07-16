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

    /**
     * The base configuration key for all HUD configurations.
     */
    private static final String PARAM_BASE_KEY = "hud";

    private static final String PARAM_ENABLED = PARAM_BASE_KEY + ".enabled";
    private static final String PARAM_BASE_DIRECTORY = PARAM_BASE_KEY + ".dir";
    private static final String PARAM_DEV_MODE = PARAM_BASE_KEY + ".devMode";
    private static final String PARAM_ALLOW_UNSAFE_EVAL = PARAM_BASE_KEY + ".unsafeEval";
    private static final String PARAM_IN_SCOPE_ONLY = PARAM_BASE_KEY + ".inScopeOnly";
    private static final String PARAM_TOOLS_LEFT_PANEL = PARAM_BASE_KEY + ".toolsLeftPanel";
    private static final String PARAM_TOOLS_RIGHT_PANEL = PARAM_BASE_KEY + ".toolsRightPanel";
    
    private static final String[] DEFAULT_TOOLS_LEFT_PANEL = 
        {"scope", "break", "showEnable", "page-alerts-high", "page-alerts-medium", "page-alerts-low", "page-alerts-informational"};
    private static final String[] DEFAULT_TOOLS_RIGHT_PANEL =
        {"site-tree", "spider", "active-scan", "attack", "site-alerts-high", "site-alerts-medium", "site-alerts-low", "site-alerts-informational"};

    /**
     * The version of the configurations. Used to keep track of configurations changes between releases, if updates are needed.
     * <p>
     * It only needs to be updated for configurations changes (not releases of the add-on).
     * </p>
     */
    private static final int PARAM_CURRENT_VERSION = 1;

    private String baseDirectory;
    
    private boolean developmentMode;
    
    private boolean allowUnsafeEval;
    
    private boolean enabled;
    
    private boolean inScopeOnly;
    
    private String[] toolsLeftPanel;

    private String[] toolsRightPanel;

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

    
    @ZapApiIgnore   // Feels too dangerous to allow this
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
        baseDirectory = getConfig()
                .getString(PARAM_BASE_DIRECTORY, Constant.getZapHome() + File.separator + ExtensionHUD.DIRECTORY_NAME);
        enabled = getConfig().getBoolean(PARAM_ENABLED, false);
        developmentMode = getConfig().getBoolean(PARAM_DEV_MODE, false);
        allowUnsafeEval = getConfig().getBoolean(PARAM_ALLOW_UNSAFE_EVAL, false);
        inScopeOnly = getConfig().getBoolean(PARAM_IN_SCOPE_ONLY, false);
        toolsLeftPanel = getConfig().getStringArray(PARAM_TOOLS_LEFT_PANEL);
        if (toolsLeftPanel.length == 0) {
            toolsLeftPanel = DEFAULT_TOOLS_LEFT_PANEL;
        }
        toolsRightPanel = getConfig().getStringArray(PARAM_TOOLS_RIGHT_PANEL);
        if (toolsRightPanel.length == 0) {
            toolsRightPanel = DEFAULT_TOOLS_RIGHT_PANEL;
        }
    }
    
    public String[] getToolsLeftPanel() {
        return toolsLeftPanel;
    }
    
    public void setToolsLeftPanel(String[] toolsLeftPanel) {
        this.toolsLeftPanel = toolsLeftPanel;
        getConfig().setProperty(PARAM_TOOLS_LEFT_PANEL, toolsLeftPanel);
    }
    
    public String[] getToolsRightPanel() {
        return toolsRightPanel;
    }
    
    public void setToolsRightPanel(String[] toolsRightPanel) {
        this.toolsRightPanel = toolsRightPanel;
        getConfig().setProperty(PARAM_TOOLS_RIGHT_PANEL, toolsRightPanel);
    }

    @Override
    protected void updateConfigsImpl(int arg0) {
        // Currently nothing to do

    }
}
