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

import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.util.Date;
import java.util.List;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebDriverException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Wait;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.zaproxy.zap.extension.api.API;
import org.zaproxy.zap.extension.hud.ui.Constants;

/**
 * Utility class for making interactions with the HUD easier. Should only be instantiated once per
 * test.
 */
public class HUD {

    private WebDriver webdriver;

    public HUD(WebDriver webdriver) {
        this.webdriver = webdriver;
    }

    public static String LEFT_PANEL_ID = "zap-hud-left-panel";
    public static String RIGHT_PANEL_ID = "zap-hud-right-panel";
    public static String BOTTOM_PANEL_ID = "zap-hud-bottom-drawer";
    public static String DISPLAY_PANEL_ID = "zap-hud-main-display";
    public static String MANAGEMENT_PANEL_ID = "zap-hud-management";
    public static String HISTORY_TABLE_ID = "history-messages";
    public static String BOTTOM_TAB_HISTORY_ID = "tab.history";
    public static String BOTTOM_TAB_WEBSOCKETS_ID = "tab.websockets";

    public static By LEFT_PANEL_BY_ID = By.id(LEFT_PANEL_ID);
    public static By RIGHT_PANEL_BY_ID = By.id(RIGHT_PANEL_ID);
    public static By BOTTOM_PANEL_BY_ID = By.id(BOTTOM_PANEL_ID);
    public static By DISPLAY_PANEL_BY_ID = By.id(DISPLAY_PANEL_ID);
    public static By MANAGEMENT_PANEL_BY_ID = By.id(MANAGEMENT_PANEL_ID);

    public static By HISTORY_TABLE_BY_ID = By.id(HISTORY_TABLE_ID);

    public static By HUD_BUTTON_BY_CLASSNAME = By.className("hud-button");

    public static int LEFT_PANEL_MIN_BUTTONS = 8;
    public static String HISTORY_TAB_LABEL = "History";

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

    public WebElement waitForHistoryTab() {
        return this.waitForHudTab(HUD.BOTTOM_PANEL_BY_ID, HISTORY_TAB_LABEL);
    }

    public WebElement waitForHudTab(By byPanel, String href) {
        List<WebElement> links = null;
        for (int i = 0; i < Constants.GENERIC_TESTS_RETRY_COUNT; i++) {
            try {
                webdriver.switchTo().frame(this.waitForElement(byPanel));
                links = webdriver.findElements(By.partialLinkText(href));
                if (links.size() > 0) {
                    return links.get(0);
                }
                warning("HUD.waitForHudTab No links containing " + href);
            } catch (WebDriverException e1) {
                // Not unexpected
                warning("Exception getting tab, retrying: " + e1.getMessage());
                // Sometimes helps
                webdriver.switchTo().defaultContent();
            }
            try {
                Thread.sleep(Constants.GENERIC_TESTS_RETRY_SLEEP_MS);
            } catch (InterruptedException e) {
                // Ignore
            }
        }
        return null;
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

    public List<WebElement> waitForHudButtons(By byPanel, int expected) {
        List<WebElement> buttons = null;
        for (int i = 0; i < Constants.GENERIC_TESTS_RETRY_COUNT; i++) {
            try {
                webdriver.switchTo().frame(this.waitForElement(byPanel));
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
                driver ->
                        String.valueOf(
                                        ((JavascriptExecutor) driver)
                                                .executeScript("return document.readyState"))
                                .equals("complete"));
    }

    public static JSONObject callZapApi(String apiCall) throws MalformedURLException, IOException {
        String apiUrl =
                "http://"
                        + Constants.ZAP_HOST_PORT
                        + apiCall
                        + API.API_KEY_PARAM
                        + "="
                        + Constants.ZAP_TEST_API_KEY;

        try (InputStream in = new URL(apiUrl).openStream()) {
            String str = IOUtils.toString(in, "UTF-8");
            return JSONObject.fromObject(str);
        }
    }

    /**
     * Resets all of the tutorial tasks - can be used where multiple tests can clear the same task.
     *
     * @throws MalformedURLException
     * @throws IOException
     */
    public static void callZapApiResetTasks() throws MalformedURLException, IOException {
        HUD.callZapApi("/JSON/hud/action/resetTutorialTasks?");
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
