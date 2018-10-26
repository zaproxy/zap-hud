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

import java.util.List;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

public class HUD {

    private WebDriver webdriver;
    private int timeoutInSecs = 10;

    public HUD(WebDriver webdriver) {
        this.webdriver = webdriver;
    }

    public static By LEFT_PANEL_BY_ID = By.id("left-panel");
    public static By RIGHT_PANEL_BY_ID = By.id("right-panel");
    public static By HUD_BUTTON_BY_CLASSNAME = By.className("hud-button");

    public WebElement getLeftPanel() {
        return webdriver.findElement(LEFT_PANEL_BY_ID);
    }

    public WebElement waitForLeftPanel() {
        return (new WebDriverWait(webdriver, timeoutInSecs))
                .until(ExpectedConditions.presenceOfElementLocated(LEFT_PANEL_BY_ID));
    }

    public WebElement getRightPanel() {
        return webdriver.findElement(RIGHT_PANEL_BY_ID);
    }

    public WebElement waitForRightPanel() {
        return (new WebDriverWait(webdriver, timeoutInSecs))
                .until(ExpectedConditions.presenceOfElementLocated(RIGHT_PANEL_BY_ID));
    }

    public List<WebElement> getHudButtons() {
        return webdriver.findElements(HUD_BUTTON_BY_CLASSNAME);
    }
}
