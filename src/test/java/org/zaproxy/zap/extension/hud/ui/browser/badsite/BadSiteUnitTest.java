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
package org.zaproxy.zap.extension.hud.ui.browser.badsite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import net.sf.json.JSONObject;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.TestTemplate;
import org.openqa.selenium.JavascriptException;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.zaproxy.zap.extension.hud.HudAPI;
import org.zaproxy.zap.extension.hud.tutorial.pages.IntroPage;
import org.zaproxy.zap.extension.hud.ui.browser.BrowsersTest;
import org.zaproxy.zap.extension.hud.ui.browser.tutorial.TutorialStatics;
import org.zaproxy.zap.extension.hud.ui.uimap.HUD;

@Tag("tutorial")
public class BadSiteUnitTest extends BrowsersTest {

    private static final String SERVICE_WORKER = "serviceworker.js";
    private static final String BAD_SITE_TEST_KEY = "badsitetest";

    // Cache the files url as it wont change and this will speed things up a little bit
    private static String filesUrl = null;

    @BeforeAll
    public static void ignoreCertWarnings() {
        TrustManager[] trustAllCerts =
                new TrustManager[] {
                    new X509TrustManager() {
                        public java.security.cert.X509Certificate[] getAcceptedIssuers() {
                            return null;
                        }

                        public void checkClientTrusted(
                                java.security.cert.X509Certificate[] certs, String authType) {}

                        public void checkServerTrusted(
                                java.security.cert.X509Certificate[] certs, String authType) {}
                    }
                };

        // Install the all-trusting trust manager
        try {
            SSLContext sc = SSLContext.getInstance("SSL");
            sc.init(null, trustAllCerts, new java.security.SecureRandom());
            HttpsURLConnection.setDefaultSSLSocketFactory(sc.getSocketFactory());
        } catch (Exception e) {
        }
    }

    @TestTemplate
    public void cannotAccessWebSocketsUrlWhenLoadingSwAsScript(WebDriver driver)
            throws InterruptedException, MalformedURLException {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(IntroPage.NAME));
        String swUrl = getHudFilesUrl(hud) + SERVICE_WORKER;

        // Add utils.js to the target site via a script
        StringBuilder sb = new StringBuilder();
        sb.append("var script = document.createElement('script');\n");
        sb.append("script.setAttribute('src','");
        sb.append(swUrl);
        sb.append("');\n");
        sb.append("document.head.appendChild(script);\n");

        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(IntroPage.NAME));
        ((JavascriptExecutor) driver).executeScript(sb.toString());

        // Now try to make use of it

        Object result =
                executeScriptWithRetry(
                        driver, "return document.getElementById(\"zap-hud-management\").src;");
        assertTrue(result.toString().startsWith("https://zap//zapCallBackUrl"));
        try {
            // ZAP_HUD_WS should be protected via a closure
            result = ((JavascriptExecutor) driver).executeScript("return ZAP_HUD_WS;");
            // This class should not expect a JavascriptException in case the script above fails
            fail();
        } catch (JavascriptException e) {
            // Expected, but double check the error message
            assertTrue(e.getMessage().contains("ZAP_HUD_WS is not defined"));
        }
    }

    @TestTemplate
    public void cannotUseZapApiFromTarget(WebDriver driver)
            throws InterruptedException, IOException {
        HUD hud = new HUD(driver);
        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(IntroPage.NAME));

        // Test the value is empty to start
        JSONObject ret =
                HUD.callZapApi("/JSON/hud/view/getUiOption/?key=" + BAD_SITE_TEST_KEY + "&");
        assertEquals("", ret.get(BAD_SITE_TEST_KEY));

        String script =
                "document.getElementById('"
                        + HUD.MANAGEMENT_PANEL_ID
                        + "').contentWindow.postMessage("
                        + "{sharedSecret: '"
                        + HudAPI.SHARED_TEST_NON_SECRET
                        + "', tabId:'tabId', action: 'zapApiCall', component:'hud',type:'action',name:'setUiOption', "
                        + "params: { key: '"
                        + BAD_SITE_TEST_KEY
                        + "', value: 'this shouldnt work' }}, '*'); "
                        + "return 'Done';";

        executeScriptWithRetry(driver, script);

        Thread.sleep(5000); // Just to make sure

        // And check its still empty
        ret = HUD.callZapApi("/JSON/hud/view/getUiOption/?key=" + BAD_SITE_TEST_KEY + "&");
        assertEquals("", ret.get(BAD_SITE_TEST_KEY));
    }

    private static Object executeScriptWithRetry(WebDriver driver, String script) {
        return new WebDriverWait(driver, 10L)
                .ignoring(JavascriptException.class)
                .until(wd -> ((JavascriptExecutor) wd).executeScript(script));
    }

    /**
     * Obtain the HUD files URL
     *
     * @param driver
     * @return
     * @throws MalformedURLException
     */
    private String getHudFilesUrl(HUD hud) throws MalformedURLException {
        if (filesUrl == null) {
            hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(IntroPage.NAME));
            // Get hold of the API URL
            WebElement panel = hud.getLeftPanel();
            assertNotNull(panel);
            hud.getWebDriver().switchTo().frame(panel);
            String panelSrc = hud.getWebDriver().getPageSource();
            String str = panelSrc.substring(0, panelSrc.indexOf("utils.js"));
            str = str.substring(str.lastIndexOf("https://"));
            // Sanity check its a valid URL
            assertTrue(str.length() > 0);
            new URL(str);
            filesUrl = str;

            hud.getWebDriver().switchTo().parentFrame();
        }
        return filesUrl;
    }
}
