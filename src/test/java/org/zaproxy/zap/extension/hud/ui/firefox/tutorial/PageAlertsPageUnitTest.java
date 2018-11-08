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

import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.zaproxy.zap.extension.hud.tutorial.pages.AlertNotificationsPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.PageAlertsPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.SiteAlertsPage;
import org.zaproxy.zap.extension.hud.ui.firefox.FirefoxUnitTest;
import org.zaproxy.zap.extension.hud.ui.generic.GenericUnitTest;
import org.zaproxy.zap.extension.hud.ui.uimap.HUD;

@Tag("tutorial")
public class PageAlertsPageUnitTest extends FirefoxUnitTest {

    @Test
    public void genericPageUnitTests(FirefoxDriver driver) throws InterruptedException {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(PageAlertsPage.NAME));
        GenericUnitTest.runAllTests(driver);
    }

    @Test
    public void testPreviousButtonWorks(FirefoxDriver driver) {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(PageAlertsPage.NAME));
        WebElement previousButton = TutorialStatics.getPreviousButton(driver);
        assertNotNull(previousButton);
        previousButton.click();
        assertEquals(
                TutorialStatics.getTutorialHudUrl(AlertNotificationsPage.NAME),
                driver.getCurrentUrl());
    }

    @Test
    public void testTaskAndNextButton(FirefoxDriver driver) throws InterruptedException {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(PageAlertsPage.NAME));

        // Check the Next button is not a link
        try {
            driver.findElement(By.partialLinkText(TutorialStatics.NEXT_BUTTON_PREFIX));
            fail("Next button should not have been a link");
        } catch (NoSuchElementException e) {
            // Expected
        }

        // Wait for the alert - this will depend on the ZAP passive scan thread
        WebElement panel = hud.waitForLeftPanel();
        assertNotNull(panel);
        driver.switchTo().frame(panel);

        WebElement infoPageButton = null;
        for (int i = 0; i < TutorialStatics.ALERT_LOOP_COUNT; i++) {
            try {
                List<WebElement> buttons = hud.getHudButtons();
                if (buttons != null && buttons.size() >= 7) {
                    infoPageButton = buttons.get(6);
                    if (!infoPageButton.getText().equals("0")) {
                        break;
                    }
                }
            } catch (Exception e1) {
                System.out.println("PageAlertsPage exception " + e1.getMessage());
            }
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                // Ignore
            }
        }
        assertNotNull(infoPageButton);
        assertEquals("1", infoPageButton.getText());

        // Click it, make sure we can see the alert
        infoPageButton.click();
        driver.switchTo().parentFrame();
        panel = hud.waitForDisplayPanel();
        assertNotNull(panel);
        driver.switchTo().frame(panel);

        // Find and click on the alert
        WebElement header = hud.getFirstVisible(By.className("accordion-header"));
        assertNotNull(header);
        assertEquals("HUD Tutorial Page Alert (1)", header.getText());
        header.click();

        // Find and click on the instance
        WebElement instanceLink = hud.getFirstVisible(By.partialLinkText("/PageAlerts"));
        assertNotNull(instanceLink);
        instanceLink.click();

        WebElement desc =
                driver.findElement(By.xpath("//*[contains(text(), 'the key you need is')]"));
        assertNotNull(desc);
        String description = desc.getText();
        String key = description.substring(description.length() - 8);
        hud.log("Got key " + key);
        assertEquals(8, key.length());

        // Close alerts window
        WebElement close = hud.getFirstVisible(By.className("btn-clear"));
        assertNotNull(close);
        close.click();

        // Shouldn't really have to reload the page, but it helps
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(PageAlertsPage.NAME));

        // Submit the key
        driver.findElement(By.id("key")).sendKeys(key);
        driver.findElement(By.id("submit")).click();

        // That should have completed the task. Reload the page so we dont pick up a ref to the old
        // page
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(PageAlertsPage.NAME));

        // this should pass this time
        driver.findElement(By.partialLinkText(TutorialStatics.NEXT_BUTTON_PREFIX));

        WebElement nextButton = hud.waitForElement(TutorialStatics.NEXT_BUTTON_BY_ID);
        assertNotNull(nextButton);
        nextButton.click();
        hud.waitForPageLoad();
        assertEquals(
                TutorialStatics.getTutorialHudUrl(SiteAlertsPage.NAME), driver.getCurrentUrl());
    }
}
