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

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.TestTemplate;
import org.openqa.selenium.WebDriver;
import org.zaproxy.zap.extension.hud.ui.generic.GenericUnitTest;
import org.zaproxy.zap.extension.hud.ui.uimap.HUD;

@Tag("remote")
/** Alexa top sites */
public class TopSitesUnitTest extends BrowsersTest {

    private void testSite(WebDriver driver, String site) {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud("http://" + site);
        GenericUnitTest.runAllTests(driver);

        hud.openUrlWaitForHud("https://" + site);
        GenericUnitTest.runAllTests(driver);
    }

    @TestTemplate
    public void testGoogle(WebDriver driver) {
        testSite(driver, "google.com");
    }

    @TestTemplate
    public void testYoutube(WebDriver driver) {
        testSite(driver, "youtube.com");
    }

    @TestTemplate
    public void testFacebook(WebDriver driver) {
        testSite(driver, "facebook.com");
    }

    @TestTemplate
    public void testBaidu(WebDriver driver) {
        testSite(driver, "www.baidu.com");
    }

    @TestTemplate
    public void testWikipedia(WebDriver driver) {
        testSite(driver, "www.wikipedia.org");
    }

    @TestTemplate
    public void testQq(WebDriver driver) {
        testSite(driver, "www.qq.com");
    }

    @TestTemplate
    public void testYahoo(WebDriver driver) {
        testSite(driver, "yahoo.com");
    }

    @TestTemplate
    public void testTaobao(WebDriver driver) {
        testSite(driver, "taobao.com");
    }

    @TestTemplate
    public void testTmall(WebDriver driver) {
        testSite(driver, "tmall.com");
    }

    @TestTemplate
    public void testAmazon(WebDriver driver) {
        testSite(driver, "amazon.com");
    }
}
