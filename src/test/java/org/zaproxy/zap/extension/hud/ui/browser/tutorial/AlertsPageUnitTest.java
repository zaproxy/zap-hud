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
package org.zaproxy.zap.extension.hud.ui.browser.tutorial;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.TestTemplate;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.zaproxy.zap.extension.hud.tutorial.pages.AlertNotificationsPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.AlertsPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.FramesPage;
import org.zaproxy.zap.extension.hud.ui.browser.BrowsersTest;
import org.zaproxy.zap.extension.hud.ui.generic.GenericUnitTest;
import org.zaproxy.zap.extension.hud.ui.uimap.HUD;

@Tag("tutorial")
public class AlertsPageUnitTest extends BrowsersTest {

    @TestTemplate
    public void genericPageUnitTests(WebDriver driver) {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(AlertsPage.NAME));
        GenericUnitTest.runAllTests(driver);
    }

    @Disabled
    @TestTemplate
    public void testPreviousButtonWorks(WebDriver driver) {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(AlertsPage.NAME));
        WebElement previousButton = TutorialStatics.getPreviousButton(driver);
        assertNotNull(previousButton);
        previousButton.click();
        assertEquals(TutorialStatics.getTutorialHudUrl(FramesPage.NAME), driver.getCurrentUrl());
    }

    @TestTemplate
    public void testNextPageButtonWorks(WebDriver driver) {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(AlertsPage.NAME));
        WebElement nextButton = TutorialStatics.getNextButton(driver);
        assertNotNull(nextButton);
        nextButton.click();
        hud.waitForPageLoad();
        assertEquals(
                TutorialStatics.getTutorialHudUrl(AlertNotificationsPage.NAME),
                driver.getCurrentUrl());
    }
}
