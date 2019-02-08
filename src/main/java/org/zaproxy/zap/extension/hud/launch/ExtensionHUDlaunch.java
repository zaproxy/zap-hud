/*
 * Zed Attack Proxy (ZAP) and its related class files.
 *
 * ZAP is an HTTP/HTTPS proxy for assessing web application security.
 *
 * Copyright 2019 The ZAP Development Team
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
package org.zaproxy.zap.extension.hud.launch;

import java.io.File;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import org.apache.log4j.Logger;
import org.parosproxy.paros.Constant;
import org.parosproxy.paros.control.Control;
import org.parosproxy.paros.extension.CommandLineArgument;
import org.parosproxy.paros.extension.CommandLineListener;
import org.parosproxy.paros.extension.Extension;
import org.parosproxy.paros.extension.ExtensionAdaptor;
import org.parosproxy.paros.extension.ExtensionHook;
import org.parosproxy.paros.view.View;
import org.zaproxy.zap.extension.hud.ExtensionHUD;

/** Adds a -hud command line option which launches Firefox with the HUD enabled */
@SuppressWarnings("unchecked")
public class ExtensionHUDlaunch extends ExtensionAdaptor implements CommandLineListener {

    public static final String NAME = "ExtensionHUDlaunch";

    private static List<Class<? extends Extension>> DEPENDENCIES;
    private static final String SELENIUM_EXTENSION_CLASS_NAME =
            "org.zaproxy.zap.extension.selenium.ExtensionSelenium";

    private CommandLineArgument[] arguments = new CommandLineArgument[1];
    private static final int ARG_BROWSER_IDX = 0;

    private static final Logger LOGGER = Logger.getLogger(ExtensionHUDlaunch.class);

    static {
        List<Class<? extends Extension>> dependencies = new ArrayList<>(1);
        Class<?> extSeleniumClass;
        try {
            extSeleniumClass = Class.forName(SELENIUM_EXTENSION_CLASS_NAME);
            dependencies.add((Class<? extends Extension>) extSeleniumClass);
            DEPENDENCIES = Collections.unmodifiableList(dependencies);
        } catch (ClassNotFoundException e) {
            DEPENDENCIES = null;
        }
    }

    public ExtensionHUDlaunch() {
        super(NAME);
    }

    @Override
    public boolean supportsDb(String type) {
        return true;
    }

    @Override
    public void hook(ExtensionHook extensionHook) {
        super.hook(extensionHook);
        extensionHook.addCommandLine(getCommandLineArguments());
    }

    @Override
    public boolean canUnload() {
        return true;
    }

    @Override
    public List<Class<? extends Extension>> getDependencies() {
        return DEPENDENCIES;
    }

    private Extension getExtSelenium() {
        return Control.getSingleton()
                .getExtensionLoader()
                .getExtensionByClassName(SELENIUM_EXTENSION_CLASS_NAME);
    }

    private ExtensionHUD getExtHUD() {
        return Control.getSingleton().getExtensionLoader().getExtension(ExtensionHUD.class);
    }

    private Object callMethodByReflection(Object obj, String methodName, Object... args)
            throws IllegalAccessException, IllegalArgumentException, InvocationTargetException,
                    NoSuchMethodException, SecurityException {
        @SuppressWarnings("rawtypes")
        Class[] argClasses = new Class[args.length];
        int i = 0;
        for (Object arg : args) {
            argClasses[i] = arg.getClass();
            i++;
        }
        Method method = obj.getClass().getMethod(methodName, argClasses);
        return method.invoke(obj, args);
    }

    private void launchBrowser() {
        Runnable task =
                () -> {
                    try {
                        if (!View.isInitialised()) {
                            // If we dont set this the HUD wont be enabled,
                            // which is a bit pointless
                            getExtHUD().setHudCmdlineOptionUsed(true);
                        }
                        // Object wd =
                        callMethodByReflection(
                                getExtSelenium(), "getProxiedBrowserByName", "Firefox");

                        // callMethodByReflection(wd, "get", "https://zaproxy.org");
                    } catch (Exception e1) {
                        LOGGER.error(e1.getMessage(), e1);
                    }
                };
        new Thread(task).start();
    }

    @Override
    public void execute(CommandLineArgument[] args) {
        if (arguments[ARG_BROWSER_IDX].isEnabled()) {
            this.launchBrowser();
        }
    }

    private CommandLineArgument[] getCommandLineArguments() {
        arguments[ARG_BROWSER_IDX] =
                new CommandLineArgument(
                        "-hud",
                        0,
                        null,
                        "",
                        "-hud                     "
                                + Constant.messages.getString("hud.cmdline.hud.help"));
        return arguments;
    }

    @Override
    public String getAuthor() {
        return Constant.ZAP_TEAM;
    }

    @Override
    public boolean handleFile(File file) {
        return false;
    }

    @Override
    public List<String> getHandledExtensions() {
        return null;
    }
}
