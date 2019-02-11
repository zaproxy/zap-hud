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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.zaproxy.zap.extension.hud.ui.uimap.HUD;

public class BottomPanelUnitTest {
    private static final int EXPECTED_BUTTONS = 2;

    public static void runAllTests(WebDriver wd) {
        testBottomPanelLoads(wd);
        testBottomContainsExpectedButtons(wd);
    }

    public static void testBottomPanelLoads(WebDriver wd) {
        HUD hud = new HUD(wd);
        Assertions.assertNotNull(hud.waitForBottomPanel());
    }

    public static void testBottomContainsExpectedButtons(WebDriver wd) {
        HUD hud = new HUD(wd);
        List<WebElement> buttons = hud.waitForHudButtons(HUD.BOTTOM_PANEL_BY_ID, EXPECTED_BUTTONS);
        assertNotNull(buttons);
        assertEquals(EXPECTED_BUTTONS, buttons.size());
        wd.switchTo().parentFrame();
    }
}
