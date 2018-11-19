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
import static org.junit.jupiter.api.Assertions.fail;

import java.net.URISyntaxException;
import java.util.List;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.zaproxy.zap.extension.hud.tutorial.pages.AlertsPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.FramesPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.WarningPage;
import org.zaproxy.zap.extension.hud.ui.firefox.FirefoxUnitTest;
import org.zaproxy.zap.extension.hud.ui.generic.GenericUnitTest;
import org.zaproxy.zap.extension.hud.ui.uimap.HUD;

@Tag("tutorial")
public class FramesPageUnitTest extends FirefoxUnitTest {

    @Test
    public void genericPageUnitTests(FirefoxDriver driver) throws InterruptedException {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(FramesPage.NAME));
        GenericUnitTest.runAllTests(driver);
    }

    @Test
    public void testPreviousButtonWorks(FirefoxDriver driver) {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(FramesPage.NAME));
        WebElement previousButton = TutorialStatics.getPreviousButton(driver);
        assertNotNull(previousButton);
        previousButton.click();
        assertEquals(TutorialStatics.getTutorialHudUrl(WarningPage.NAME), driver.getCurrentUrl());
    }

    @Test
    public void testTaskAndNextButton(FirefoxDriver driver) {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(FramesPage.NAME));

        // Check the Next button is not a link
        try {
            driver.findElement(By.partialLinkText(TutorialStatics.NEXT_BUTTON_PREFIX));
            fail("Next button should not have been a link");
        } catch (NoSuchElementException e) {
            // Expected
        }

        WebElement keyElem = driver.findElement(By.className("frameskey"));
        assertNotNull(keyElem);
        String key = keyElem.getText();
        hud.log("Got key " + key);
        assertEquals(8, key.length());
        driver.findElement(By.id("key")).sendKeys(key);
        driver.findElement(By.id("submit")).click();
        // That should have completed the task. Reload the page so we dont pick up a ref to the old
        // page
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(FramesPage.NAME));

        // this should pass this time
        driver.findElement(By.partialLinkText(TutorialStatics.NEXT_BUTTON_PREFIX));

        WebElement nextButton = hud.waitForElement(TutorialStatics.NEXT_BUTTON_BY_ID);
        assertNotNull(nextButton);
        nextButton.click();
        hud.waitForPageLoad();
        assertEquals(TutorialStatics.getTutorialHudUrl(AlertsPage.NAME), driver.getCurrentUrl());
    }

    @Test
    public void testSidePanelsHiddenAndRevealed(FirefoxDriver driver)
            throws URISyntaxException, InterruptedException {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(FramesPage.NAME));

        // check they visible to start with
        testSidePanesVisible(driver);

        // Check they are hidden after button clicked
        testClickHudButton(driver);
        testSidePanesHidden(driver);

        // Check they stay hidden when the page is refreshed
        hud.openRelativePage(FramesPage.NAME);
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
