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

import org.junit.jupiter.api.Tag;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;

@Tag("tutorial")
public class TutorialStatics {

    private static final String DEFAULT_TUTORIAL_HOST_PORT = "localhost:9998";

    private static String tutorialHostPort = null;

    public static String NEXT_BUTTON_PREFIX = "Next:";
    public static String PREVIOUS_BUTTON_PREFIX = "Previous:";
    public static By NEXT_BUTTON_BY_ID = By.id("next-button");
    public static By PREVIOUS_BUTTON_BY_ID = By.id("previous-button");
    public static int ALERT_LOOP_COUNT = 10;

    private static String getTutorialHostPort() {
        if (tutorialHostPort == null) {
            tutorialHostPort = System.getenv().get("ZAP_HUD_TUTORIAL");
            if (tutorialHostPort == null) {
                tutorialHostPort = DEFAULT_TUTORIAL_HOST_PORT;
            }
        }
        return tutorialHostPort;
    }

    public static String getTutorialUrl() {
        return "http://" + getTutorialHostPort();
    }

    public static String getTutorialUrl(String page) {
        return getTutorialUrl() + "/" + page;
    }

    public static String getTutorialHudUrl() {
        return "https://" + getTutorialHostPort();
    }

    public static String getTutorialHudUrl(String page) {
        return getTutorialHudUrl() + "/" + page;
    }

    public static WebElement getNextButton(WebDriver wd) {
        return wd.findElement(NEXT_BUTTON_BY_ID);
    }

    public static WebElement getPreviousButton(WebDriver wd) {
        return wd.findElement(PREVIOUS_BUTTON_BY_ID);
    }
}
