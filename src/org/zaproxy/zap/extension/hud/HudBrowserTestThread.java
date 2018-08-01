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
package org.zaproxy.zap.extension.hud;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.apache.log4j.Logger;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.parosproxy.paros.control.Control;
import org.zaproxy.zap.extension.selenium.ExtensionSelenium;

public class HudBrowserTestThread extends Thread {

    private File file;
    private String browser;
    private WebDriver wd;
    private boolean stop = false;
    private List<String> passes = new ArrayList<String>();
    private List<String> fails = new ArrayList<String>();
    private long startTime;
    private long endTime;

    private static Logger LOG = Logger.getLogger(HudBrowserTestThread.class);

    public HudBrowserTestThread(File file, String browser) throws IllegalArgumentException {
        this.setName("ZAP-HudBrowserTestThread");
        this.file = file;
        this.browser = browser;
        wd = getExtSelenium().getProxiedBrowser(this.browser);
        if (wd == null) {
            throw new IllegalArgumentException("No such browser " + this.browser);
        }
    }

    private ExtensionSelenium getExtSelenium() {
        return Control.getSingleton().getExtensionLoader()
                .getExtension(ExtensionSelenium.class);
    }

    public void run() {
        
        // Give it a bit of time to start up
        try {
            Thread.sleep(3000);
        } catch (InterruptedException e1) {
            // Ignore
        }
        this.startTime = System.currentTimeMillis();
        
        try (BufferedReader br = new BufferedReader(new FileReader(file))) {
            String line;
            while ((line = br.readLine()) != null) {
                if (stop) {
                    break;
                }
                // process the line.
                if (! line.startsWith("#")) {
                    // Not a comment
                    if (! line.toLowerCase().startsWith("http")) {
                        // The Alexa data typically doesnt include http(s)://
                        line = "http://" + line;
                    }
                    testUrl(wd, line);
                }
            }
            this.wd.close();
            this.endTime = System.currentTimeMillis();
        } catch (Exception e) {
            LOG.error(e.getMessage(), e);
        }
    }

    private void testUrl(WebDriver wd, String url)  {
        try {
            wd.get(url);

            WebElement panel = (new WebDriverWait(wd, 10))
                    .until(ExpectedConditions.presenceOfElementLocated(By.id("left-panel")));

            if (panel == null) {
                this.fails.add(url + " : Failed to find left panel"); 
            } else {
                wd.switchTo().frame(wd.findElement(By.id("left-panel")));
                List<WebElement> buttons = null;
                for (int i=0; i < 10; i++) {
                    buttons = wd.findElements(By.className("hud-button"));
                    if (buttons != null && buttons.size() == 8) {
                        this.passes.add(url);
                        return;
                    }
                    Thread.sleep(500);
                }
                if (buttons == null) {
                    this.fails.add(url + " : Failed to find left panel buttons"); 
                } else {
                    this.fails.add(url + " : Only found " + buttons.size() + " left panel buttons"); 
                }
            }
        } catch (Exception e) {
            this.fails.add(url + " : Exception " + e.getMessage()); 
        }
        
    }

    public List<String> getPasses() {
        return Collections.unmodifiableList(passes);
    }
    
    public List<String> getFails() {
        return Collections.unmodifiableList(fails);
    }
    
    public int getProgress () {
        return passes.size() + fails.size();
    }
    
    public long getAverageLoadTimeInMSecs() {
        if (this.startTime == 0) {
            return 0;
        }
        if (this.isAlive()) {
            return (System.currentTimeMillis() - this.startTime) / this.getProgress();
        }
        return (this.endTime - this.startTime) / this.getProgress();
    }
    
    public void setStop(boolean stop) {
        this.stop = stop;
    }
}
