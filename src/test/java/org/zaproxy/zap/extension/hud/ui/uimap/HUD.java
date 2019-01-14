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
package org.zaproxy.zap.extension.hud.ui.uimap;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Date;
import java.util.List;
import java.util.function.Function;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebDriverException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Wait;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.zaproxy.zap.extension.hud.ui.Constants;

/**
 * Utility class for making interactions with the HUD easier. Should only be instantiated once per
 * test.
 */
public class HUD {

    private WebDriver webdriver;
    private boolean hudNotInstalled;

    public HUD(WebDriver webdriver) {
        this.webdriver = webdriver;
        this.hudNotInstalled = true;
    }

    public static By LEFT_PANEL_BY_ID = By.id("left-panel");
    public static By RIGHT_PANEL_BY_ID = By.id("right-panel");
    public static By BOTTOM_PANEL_BY_ID = By.id("bottom-drawer");
    public static By DISPLAY_PANEL_BY_ID = By.id("main-display");
    public static By HUD_BUTTON_BY_CLASSNAME = By.className("hud-button");
    public static int LEFT_PANEL_MIN_BUTTONS = 8;

    public WebElement getLeftPanel() {
        return webdriver.findElement(LEFT_PANEL_BY_ID);
    }

    public WebElement waitForElement(By by) {
        return (new WebDriverWait(webdriver, Constants.GENERIC_TESTS_TIMEOUT_SECS))
                .until(ExpectedConditions.presenceOfElementLocated(by));
    }

    public WebElement getFirstVisible(By by) {
        for (WebElement elem : webdriver.findElements(by)) {
            if (elem.isDisplayed()) {
                return elem;
            }
        }
        return null;
    }

    public WebElement waitForLeftPanel() {
        return waitForElement(LEFT_PANEL_BY_ID);
    }

    public WebElement getRightPanel() {
        return webdriver.findElement(RIGHT_PANEL_BY_ID);
    }

    public WebElement waitForRightPanel() {
        return waitForElement(RIGHT_PANEL_BY_ID);
    }

    public WebElement getBottomPanel() {
        return this.webdriver.findElement(BOTTOM_PANEL_BY_ID);
    }

    public WebElement waitForBottomPanel() {
        return waitForElement(BOTTOM_PANEL_BY_ID);
    }

    public WebElement getDisplayPanel() {
        return this.webdriver.findElement(DISPLAY_PANEL_BY_ID);
    }

    public WebElement waitForDisplayPanel() {
        return waitForElement(DISPLAY_PANEL_BY_ID);
    }

    public List<WebElement> getHudButtons() {
        // return webdriver.findElements(HUD_BUTTON_BY_CLASSNAME);
        /* This should work, but it looks like a Firefox bug is causing problems
        return new WebDriverWait(this.webdriver, this.timeoutInSecs)
                .until(ExpectedConditions.presenceOfAllElementsLocatedBy(HUD_BUTTON_BY_CLASSNAME));
                */
        for (int i = 0; i < Constants.GENERIC_TESTS_RETRY_COUNT; i++) {
            try {
                return webdriver.findElements(HUD_BUTTON_BY_CLASSNAME);
            } catch (WebDriverException e1) {
                warning(
                        "HUD.getHudButtons Exception getting buttons, retrying: "
                                + e1.getMessage());
                // Sometimes helps
                webdriver.switchTo().defaultContent();
                try {
                    Thread.sleep(Constants.GENERIC_TESTS_RETRY_SLEEP_MS);
                } catch (InterruptedException e) {
                    // Ignore
                }
            }
        }
        return null;
    }

    public List<WebElement> waitForHudButtons(int expected) {
        List<WebElement> buttons = null;
        for (int i = 0; i < Constants.GENERIC_TESTS_RETRY_COUNT; i++) {
            try {
                buttons = webdriver.findElements(HUD_BUTTON_BY_CLASSNAME);
                if (buttons.size() >= expected) {
                    break;
                }
                warning(
                        "HUD.waitForHudButtons Only got "
                                + buttons.size()
                                + ", expected "
                                + expected
                                + " retrying");
            } catch (WebDriverException e1) {
                // Not unexpected
                warning("Exception getting buttons, retrying: " + e1.getMessage());
                // Sometimes helps
                webdriver.switchTo().defaultContent();
            }
            try {
                Thread.sleep(Constants.GENERIC_TESTS_RETRY_SLEEP_MS);
            } catch (InterruptedException e) {
                // Ignore
            }
        }
        return buttons;
    }

    public void openUrlWaitForHud(String url) {
        this.webdriver.get(url);

        if (hudNotInstalled) {
            // Wait for the service worker installation and subsequent page refresh.
            new WebDriverWait(webdriver, Constants.GENERIC_TESTS_TIMEOUT_SECS)
                    .until(ExpectedConditions.stalenessOf(waitForLeftPanel()));
            hudNotInstalled = false;
        }
        waitForPageLoad();
    }

    public void openRelativePage(String page) throws URISyntaxException {
        this.webdriver
                .navigate()
                .to(new URI(this.webdriver.getCurrentUrl()).resolve(page).toString());
    }

    public void waitForPageLoad() {
        Wait<WebDriver> wait = new WebDriverWait(webdriver, 30);
        wait.until(
                new Function<WebDriver, Boolean>() {
                    public Boolean apply(WebDriver driver) {
                        return String.valueOf(
                                        ((JavascriptExecutor) driver)
                                                .executeScript("return document.readyState"))
                                .equals("complete");
                    }
                });
    }

    public WebDriver getWebDriver() {
        return webdriver;
    }

    public void warning(String msg) {
        System.err.println(new Date() + " " + this.getClass().getSimpleName() + " " + msg);
    }

    public void log(String msg) {
        System.out.println(new Date() + " " + this.getClass().getSimpleName() + " " + msg);
    }
}
