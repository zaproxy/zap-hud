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

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.zaproxy.zap.extension.hud.ui.Constants;
import org.zaproxy.zap.extension.hud.ui.generic.GenericUnitTest;
import org.zaproxy.zap.extension.hud.ui.uimap.HUD;

@Tag("remote")
/** Alexa top sites */
public class TopSitesUnitTest extends FirefoxUnitTest {

    private void testSite(FirefoxDriver driver, String site) throws InterruptedException {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud("http://" + site);
        Thread.sleep(Constants.POST_LOAD_DELAY_MS);
        GenericUnitTest.runAllTests(driver);

        hud.openUrlWaitForHud("https://" + site);
        GenericUnitTest.runAllTests(driver);
    }

    @Test
    public void testGoogle(FirefoxDriver driver) throws InterruptedException {
        testSite(driver, "google.com");
    }

    @Test
    public void testYoutube(FirefoxDriver driver) throws InterruptedException {
        testSite(driver, "youtube.com");
    }

    @Test
    public void testFacebook(FirefoxDriver driver) throws InterruptedException {
        testSite(driver, "facebook.com");
    }

    @Test
    public void testBaidu(FirefoxDriver driver) throws InterruptedException {
        testSite(driver, "www.baidu.com");
    }

    @Test
    public void testWikipedia(FirefoxDriver driver) throws InterruptedException {
        testSite(driver, "www.wikipedia.org");
    }

    @Test
    public void testQq(FirefoxDriver driver) throws InterruptedException {
        testSite(driver, "www.qq.com");
    }

    @Test
    public void testYahoo(FirefoxDriver driver) throws InterruptedException {
        testSite(driver, "yahoo.com");
    }

    @Test
    public void testTaobao(FirefoxDriver driver) throws InterruptedException {
        testSite(driver, "taobao.com");
    }

    @Test
    public void testTmall(FirefoxDriver driver) throws InterruptedException {
        testSite(driver, "tmall.com");
    }

    @Test
    public void testAmazon(FirefoxDriver driver) throws InterruptedException {
        testSite(driver, "amazon.com");
    }
}
