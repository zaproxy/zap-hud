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
package org.zaproxy.zap.extension.hud.ui.firefox;

import io.github.bonigarcia.Options;
import io.github.bonigarcia.SeleniumExtension;
import org.junit.jupiter.api.extension.ExtendWith;
import org.openqa.selenium.Proxy;
import org.openqa.selenium.firefox.FirefoxOptions;
import org.openqa.selenium.remote.CapabilityType;
import org.zaproxy.zap.extension.hud.ui.Constants;

@ExtendWith({SeleniumExtension.class})
public abstract class FirefoxUnitTest {
    @Options FirefoxOptions firefoxOptions;

    public FirefoxUnitTest() {
        this.firefoxOptions = new FirefoxOptions();

        Proxy proxy = new Proxy();
        proxy.setHttpProxy(Constants.ZAP_HOST_PORT)
                .setFtpProxy(Constants.ZAP_HOST_PORT)
                .setSslProxy(Constants.ZAP_HOST_PORT);

        this.firefoxOptions.addPreference("network.captive-portal-service.enabled", false);
        this.firefoxOptions.addPreference("browser.safebrowsing.provider.mozilla.gethashURL", "");
        this.firefoxOptions.addPreference("browser.safebrowsing.provider.mozilla.updateURL", "");
        this.firefoxOptions.addPreference("network.proxy.type", 1);
        this.firefoxOptions.addPreference("network.proxy.http", Constants.ZAP_HOST);
        this.firefoxOptions.addPreference("network.proxy.http_port", Constants.ZAP_PORT);
        this.firefoxOptions.addPreference("network.proxy.ssl", Constants.ZAP_HOST);
        this.firefoxOptions.addPreference("network.proxy.ssl_port", Constants.ZAP_PORT);
        this.firefoxOptions.addPreference("network.proxy.share_proxy_settings", true);
        this.firefoxOptions.addPreference("network.proxy.no_proxies_on", "");
        firefoxOptions.setCapability(CapabilityType.PROXY, (Object) null);
        firefoxOptions.setHeadless(true);
    }
}
