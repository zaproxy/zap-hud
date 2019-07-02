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
import java.util.function.Function;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.zaproxy.zap.extension.hud.tutorial.pages.AlertsPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.FramesPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.UpgradePage;
import org.zaproxy.zap.extension.hud.ui.Constants;
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
        assertEquals(TutorialStatics.getTutorialHudUrl(UpgradePage.NAME), driver.getCurrentUrl());
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
    public void testSidePanelsHiddenAndRevealed(FirefoxDriver driver) throws URISyntaxException {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(FramesPage.NAME));

        // check they visible to start with
        testSidePanesVisible(hud);

        // Check they are hidden after button clicked
        testClickHudButton(driver);
        testSidePanesHidden(hud);

        // Check they stay hidden when the page is refreshed
        hud.openRelativePage(FramesPage.NAME);

        testSidePanesHidden(hud);

        // Check they are revealed when the button is clicked again
        testClickHudButton(driver);
        testSidePanesVisible(hud);
    }

    private static void checkPanelVisible(WebDriver wd, WebElement panel) {
        checkWithRetry(wd, driver -> panel.isDisplayed());
        Assertions.assertEquals("block", panel.getCssValue("display"));
    }

    private static void checkWithRetry(WebDriver driver, Function<WebDriver, Object> check) {
        new WebDriverWait(driver, Constants.GENERIC_TESTS_TIMEOUT_SECS)
                .until(wd -> check.apply(driver));
    }

    private static void testSidePanesVisible(HUD hud) {
        WebDriver wd = hud.getWebDriver();
        checkPanelVisible(wd, hud.waitForLeftPanel());
        checkPanelVisible(wd, hud.waitForRightPanel());
        checkPanelVisible(wd, hud.waitForBottomPanel());
    }

    private static void testClickHudButton(WebDriver wd) {
        HUD hud = new HUD(wd);
        List<WebElement> buttons = hud.waitForHudButtons(HUD.BOTTOM_PANEL_BY_ID, 2);
        Assertions.assertEquals(2, buttons.size());

        buttons.get(0).click();
        wd.switchTo().defaultContent();
    }

    private static void checkPanelHidden(WebDriver wd, WebElement panel) {
        checkWithRetry(wd, driver -> !panel.isDisplayed());
        Assertions.assertEquals("none", panel.getCssValue("display"));
    }

    private static void testSidePanesHidden(HUD hud) {
        WebDriver wd = hud.getWebDriver();
        checkPanelHidden(wd, hud.waitForLeftPanel());
        checkPanelHidden(wd, hud.waitForRightPanel());
        checkPanelVisible(wd, hud.waitForBottomPanel());
    }
}
