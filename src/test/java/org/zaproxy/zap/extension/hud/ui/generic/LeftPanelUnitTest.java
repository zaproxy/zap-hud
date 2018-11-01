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
package org.zaproxy.zap.extension.hud.ui.generic;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.zaproxy.zap.extension.hud.ui.uimap.HUD;

public class LeftPanelUnitTest {

    private static final int EXPECTED_BUTTONS = 8;

    public LeftPanelUnitTest() {}

    public static void runAllTests(WebDriver wd) {
        testLeftPanelLoads(wd);
        testLeftContainsExpectedButtons(wd);
    }

    public static void testLeftPanelLoads(WebDriver wd) {
        HUD hud = new HUD(wd);
        assertNotNull(hud.waitForLeftPanel());
    }

    public static void testLeftContainsExpectedButtons(WebDriver wd) {
        HUD hud = new HUD(wd);
        WebElement panel = hud.waitForLeftPanel();
        assertNotNull(panel);
        wd.switchTo().frame(panel);
        List<WebElement> buttons = hud.waitForHudButtons(EXPECTED_BUTTONS);
        assertNotNull(buttons);
        // An exact match would be better, but its proved to be too flaky :/
        if (buttons.size() >= EXPECTED_BUTTONS) {
            System.err.println("LeftPanelUnitTest only found " + buttons.size() + " buttons");
        }
        assertTrue(buttons.size() >= EXPECTED_BUTTONS);
        wd.switchTo().parentFrame();
    }
}
