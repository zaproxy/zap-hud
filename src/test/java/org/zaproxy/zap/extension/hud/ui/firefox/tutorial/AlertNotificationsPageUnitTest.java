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

import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.NoSuchElementException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.zaproxy.zap.extension.hud.tutorial.pages.AlertNotificationsPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.AlertsPage;
import org.zaproxy.zap.extension.hud.tutorial.pages.PageAlertsPage;
import org.zaproxy.zap.extension.hud.ui.Constants;
import org.zaproxy.zap.extension.hud.ui.firefox.FirefoxUnitTest;
import org.zaproxy.zap.extension.hud.ui.generic.GenericUnitTest;
import org.zaproxy.zap.extension.hud.ui.uimap.HUD;

@Tag("tutorial")
@Disabled
public class AlertNotificationsPageUnitTest extends FirefoxUnitTest {

    @Test
    public void genericPageUnitTests(FirefoxDriver driver) throws InterruptedException {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(AlertNotificationsPage.NAME));
        Thread.sleep(Constants.POST_LOAD_DELAY_MS);

        GenericUnitTest.runAllTests(driver);
    }

    @Test
    public void testPreviousButtonWorks(FirefoxDriver driver) {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(AlertNotificationsPage.NAME));
        WebElement previousButton = TutorialStatics.getPreviousButton(driver);
        assertNotNull(previousButton);
        previousButton.click();
        assertEquals(TutorialStatics.getTutorialHudUrl(AlertsPage.NAME), driver.getCurrentUrl());
    }

    @Test
    public void testTaskAndNextButton(FirefoxDriver driver) {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(AlertNotificationsPage.NAME));

        // Check the Next button is not a link
        try {
            driver.findElement(By.partialLinkText(TutorialStatics.NEXT_BUTTON_PREFIX));
            fail("Next button should not have been a link");
        } catch (NoSuchElementException e) {
            // Expected
        }

        WebElement submitButton = driver.findElement(By.id("submit"));
        submitButton.submit();
        // That should have completed the task. Reload the page so we dont pick up a ref to the old
        // page
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(AlertNotificationsPage.NAME));

        // this shouldnt fail this time
        driver.findElement(By.partialLinkText(TutorialStatics.NEXT_BUTTON_PREFIX));

        // TODO could try to wait for the alert??

        WebElement nextButton = hud.waitForElement(TutorialStatics.NEXT_BUTTON_BY_ID);
        assertNotNull(nextButton);
        nextButton.click();
        assertEquals(
                TutorialStatics.getTutorialHudUrl(PageAlertsPage.NAME), driver.getCurrentUrl());
    }
}
