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
package org.zaproxy.zap.extension.hud.ui.specific;

import io.github.bonigarcia.Options;
import io.github.bonigarcia.SeleniumExtension;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.openqa.selenium.Proxy;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.remote.CapabilityType;
import org.zaproxy.zap.extension.hud.ui.generic.LeftPanelUnitTest;
import org.zaproxy.zap.extension.hud.ui.generic.RightPanelUnitTest;

@ExtendWith(SeleniumExtension.class)
public class ExampleDotComFirefoxUnitTest {

    static final String TARGET = "https://www.example.com";
    // TODO parameterise the host:port
    static final String PROXY_HOST = "localhost";
    static final int PROXY_PORT = 8999;
    static final String PROXY_HOST_PORT = PROXY_HOST + ":" + PROXY_PORT;

    @Options FirefoxOptions firefoxOptions = new FirefoxOptions();

    {
        Proxy proxy = new Proxy();
        proxy.setHttpProxy(PROXY_HOST_PORT)
                .setFtpProxy(PROXY_HOST_PORT)
                .setSslProxy(PROXY_HOST_PORT);

        firefoxOptions.addPreference("network.captive-portal-service.enabled", false);
        firefoxOptions.addPreference("network.proxy.type", 1);
        firefoxOptions.addPreference("network.proxy.http", PROXY_HOST);
        firefoxOptions.addPreference("network.proxy.http_port", PROXY_PORT);
        firefoxOptions.addPreference("network.proxy.ssl", "localhost");
        firefoxOptions.addPreference("network.proxy.ssl_port", PROXY_PORT);
        firefoxOptions.addPreference("network.proxy.share_proxy_settings", true);
        firefoxOptions.addPreference("network.proxy.no_proxies_on", "");
        firefoxOptions.setCapability(CapabilityType.PROXY, (Object) null);
        firefoxOptions.setHeadless(true);
    }

    @Test
    public void frameUnitTests(FirefoxDriver driver) throws InterruptedException {
        driver.get(TARGET);
        // Give the HUD a chance to load
        Thread.sleep(5000);

        LeftPanelUnitTest.runAllTests(driver);
        RightPanelUnitTest.runAllTests(driver);
        // TODO add more tests
    }
}
