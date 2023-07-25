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
import java.time.Duration;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;
import net.sf.json.JSONObject;
import org.apache.commons.io.IOUtils;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedCondition;
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
        this.webdriver.manage().timeouts().pageLoadTimeout(Duration.of(30, ChronoUnit.SECONDS));
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

    public WebDriverWait wbWait() {
        return new WebDriverWait(webdriver, Duration.of(20, ChronoUnit.SECONDS));
    }

    public WebElement waitForElement(By by) {
        return wbWait().until(ExpectedConditions.presenceOfElementLocated(by));
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
        return webdriver.findElement(LEFT_PANEL_BY_ID);
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
        webdriver.switchTo().frame(this.waitForElement(byPanel));
        return webdriver.findElements(By.partialLinkText(href)).get(0);
    }

    public List<WebElement> getHudButtons() {
        return webdriver.findElements(HUD_BUTTON_BY_CLASSNAME);
    }

    public List<WebElement> waitForHudButtons(By byPanel, int expected) {
        waitAndSwitchToFrame(byPanel);
        return wbWait().until(numberOfElementsToBeAtLeast(HUD_BUTTON_BY_CLASSNAME, expected));
    }

    public WebElement waitAndSwitchToFrame(By by) {
        webdriver.switchTo().defaultContent();
        wbWait().until(HUD::documentReadyStateIsComplete);
        WebElement frame = wbWait().until(ExpectedConditions.presenceOfElementLocated(by));
        webdriver.switchTo().frame(frame);
        wbWait().until(HUD::documentReadyStateIsComplete);
        return frame;
    }

    public void openUrlWaitForHud(String url) {
        this.webdriver.get(url);
        waitForPageLoad();
        waitForHudInitialisation();
    }

    private void waitForHudInitialisation() {
        TimeoutException exception = null;
        for (int i = 0; i < 10; i++) {
            try {
                waitForHudButtons(LEFT_PANEL_BY_ID, 2);
                webdriver.switchTo().defaultContent();
                return;
            } catch (TimeoutException e) {
                exception = e;

                // Try removing the ServiceWorker as sometimes it's not properly initialised.
                JavascriptExecutor jsExecutor = (JavascriptExecutor) webdriver;
                jsExecutor.executeScript(
                        "let unregister = regs => regs.forEach(reg => reg.unregister())\n"
                                + "navigator.serviceWorker.getRegistrations().then(unregister)");
                webdriver.navigate().refresh();
            }
        }
        throw exception;
    }

    public void openRelativePage(String page) throws URISyntaxException {
        this.webdriver
                .navigate()
                .to(new URI(this.webdriver.getCurrentUrl()).resolve(page).toString());
    }

    public void waitForPageLoad() {
        Wait<WebDriver> wait = new WebDriverWait(webdriver, Duration.of(30, ChronoUnit.SECONDS));
        wait.until(HUD::documentReadyStateIsComplete);
    }

    private static boolean documentReadyStateIsComplete(WebDriver driver) {
        JavascriptExecutor jsExecutor = (JavascriptExecutor) driver;
        Object readyState = jsExecutor.executeScript("return document.readyState");
        return String.valueOf(readyState).equals("complete");
    }

    public static JSONObject callZapApi(String apiCall) throws MalformedURLException, IOException {
        String apiUrl =
                "http://"
                        + Constants.ZAP_HOST_PORT
                        + apiCall
                        + API.API_KEY_PARAM
                        + "="
                        + Constants.ZAP_TEST_API_KEY;

        try (InputStream in = new URI(apiUrl).toURL().openStream()) {
            String str = IOUtils.toString(in, "UTF-8");
            return JSONObject.fromObject(str);
        } catch (URISyntaxException e) {
            throw new MalformedURLException(e.getMessage());
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

    private static ExpectedCondition<List<WebElement>> numberOfElementsToBeAtLeast(
            By locator, int number) {
        return new ExpectedCondition<>() {
            private int currentNumber = 0;

            @Override
            public List<WebElement> apply(WebDriver webDriver) {
                List<WebElement> elements = webDriver.findElements(locator);
                currentNumber = elements.size();
                return currentNumber >= number ? elements : null;
            }

            @Override
            public String toString() {
                return String.format(
                        "number of elements found by %s to be at least \"%s\". Current number: \"%s\"",
                        locator, number, currentNumber);
            }
        };
    }
}
