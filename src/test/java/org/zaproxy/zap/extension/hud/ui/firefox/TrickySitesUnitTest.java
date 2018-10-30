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
/** Sites that have been known to cause the HUD problems. Expect this to be added to! */
public class TrickySitesUnitTest extends FirefoxUnitTest {

    private void testSite(FirefoxDriver driver, String site) throws InterruptedException {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud("http://" + site);
        Thread.sleep(Constants.POST_LOAD_DELAY_MS);
        GenericUnitTest.runAllTests(driver);

        hud.openUrlWaitForHud("https://" + site);
        GenericUnitTest.runAllTests(driver);
    }

    @Test
    public void testBbc(FirefoxDriver driver) throws InterruptedException {
        testSite(driver, "bbc.com");
    }
}
