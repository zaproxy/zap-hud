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
package org.zaproxy.zap.extension.hud.ui.browser;

import io.github.bonigarcia.seljup.BrowserBuilder;
import io.github.bonigarcia.seljup.Options;
import io.github.bonigarcia.seljup.SeleniumExtension;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestInstance.Lifecycle;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.openqa.selenium.Proxy;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.zaproxy.zap.extension.hud.ui.Constants;

@TestInstance(Lifecycle.PER_CLASS)
public abstract class BrowsersTest {

    private static final Proxy PROXY =
            new Proxy()
                    .setHttpProxy(Constants.ZAP_HOST_PORT)
                    .setFtpProxy(Constants.ZAP_HOST_PORT)
                    .setSslProxy(Constants.ZAP_HOST_PORT);

    @Options
    private static final FirefoxOptions FIREFOX_OPTIONS =
            new FirefoxOptions()
                    .setHeadless(true)
                    .setAcceptInsecureCerts(true)
                    .addPreference("network.captive-portal-service.enabled", false)
                    .addPreference("browser.safebrowsing.provider.mozilla.gethashURL", "")
                    .addPreference("browser.safebrowsing.provider.mozilla.updateURL", "")
                    .addPreference("network.proxy.no_proxies_on", "")
                    .addPreference("network.proxy.allow_hijacking_localhost", true)
                    // Breaks the HUD otherwise (Issue 701)
                    .addPreference("browser.tabs.documentchannel", false)
                    .setProxy(PROXY);

    @Options
    private static final ChromeOptions CHROME_OPTIONS =
            new ChromeOptions()
                    .setHeadless(true)
                    .setAcceptInsecureCerts(true)
                    .addArguments("--proxy-bypass-list=<-loopback>", "--window-size=1024,768")
                    .setProxy(PROXY);

    @RegisterExtension SeleniumExtension seleniumExtension = new SeleniumExtension();

    @BeforeAll
    void setup() {
        seleniumExtension.addBrowsers(BrowserBuilder.firefox().build());
        // TODO uncomment once the tests are more reliable
        // https://github.com/zaproxy/zap-hud/issues/344
        // seleniumExtension.addBrowsers(BrowserBuilder.chrome().build());
    }
}
