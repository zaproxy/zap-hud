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
package org.zaproxy.zap.extension.hud.ui.firefox.tutorial;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.net.URISyntaxException;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.zaproxy.zap.extension.hud.ui.Constants;
import org.zaproxy.zap.extension.hud.ui.firefox.FirefoxUnitTest;
import org.zaproxy.zap.extension.hud.ui.generic.GenericUnitTest;
import org.zaproxy.zap.extension.hud.ui.uimap.HUD;

@Tag("tutorial")
public class FramesPageUnitTest extends FirefoxUnitTest {

    public static final String PAGE = "Frames.html";

    @Test
    public void genericPageUnitTests(FirefoxDriver driver) throws InterruptedException {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(PAGE));
        Thread.sleep(Constants.POST_LOAD_DELAY_MS);

        GenericUnitTest.runAllTests(driver);
    }

    @Test
    public void testPreviousButtonWorks(FirefoxDriver driver) {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(PAGE));
        WebElement previousButton = TutorialStatics.getPreviousButton(driver);
        assertNotNull(previousButton);
        previousButton.click();
        assertEquals(
                TutorialStatics.getTutorialHudUrl(WarningPageUnitTest.PAGE),
                driver.getCurrentUrl());
    }

    @Test
    public void testNextPageButtonWorks(FirefoxDriver driver) {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(PAGE));
        WebElement nextButton = TutorialStatics.getNextButton(driver);
        assertNotNull(nextButton);
        nextButton.click();
        // TODO replace with static when implemented
        assertEquals(TutorialStatics.getTutorialHudUrl("Alerts.html"), driver.getCurrentUrl());
    }

    @Test
    public void testSidePanelsHiddenAndRevealed(FirefoxDriver driver)
            throws URISyntaxException, InterruptedException {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(PAGE));
        Thread.sleep(Constants.POST_LOAD_DELAY_MS);

        // check they visible to start with
        testSidePanesVisible(driver);

        // Check they are hidden after button clicked
        testClickHudButton(driver);
        testSidePanesHidden(driver);

        // Check they stay hidden when the page is refreshed
        hud.openRelativePage(PAGE);
        testSidePanesHidden(driver);

        // Check they are revealed when the button is clicked again
        testClickHudButton(driver);
        testSidePanesVisible(driver);
    }

    private static void checkPanelVisible(WebElement panel) {
        Assertions.assertNotNull(panel);
        Assertions.assertTrue(panel.isDisplayed());
        Assertions.assertEquals("block", panel.getCssValue("display"));
    }

    private static void testSidePanesVisible(WebDriver wd) {
        HUD hud = new HUD(wd);
        checkPanelVisible(hud.getLeftPanel());
        checkPanelVisible(hud.getRightPanel());
        checkPanelVisible(hud.getBottomPanel());
    }

    private static void testClickHudButton(WebDriver wd) {
        HUD hud = new HUD(wd);
        WebElement panel = hud.waitForBottomPanel();
        Assertions.assertNotNull(panel);
        Assertions.assertNotNull(panel);
        wd.switchTo().frame(panel);
        List<WebElement> buttons = hud.waitForHudButtons(2);
        Assertions.assertEquals(2, buttons.size());

        buttons.get(0).click();
        wd.switchTo().parentFrame();
    }

    private static void checkPanelHidden(WebElement panel) {
        Assertions.assertNotNull(panel);
        Assertions.assertFalse(panel.isDisplayed());
        Assertions.assertEquals("none", panel.getCssValue("display"));
    }

    private static void testSidePanesHidden(WebDriver wd) {
        HUD hud = new HUD(wd);
        checkPanelHidden(hud.getLeftPanel());
        checkPanelHidden(hud.getRightPanel());
        checkPanelVisible(hud.getBottomPanel());
    }
}
