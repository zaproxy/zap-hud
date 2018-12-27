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
package org.zaproxy.zap.extension.hud.ui.firefox.badsite;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.MalformedURLException;
import java.net.Proxy;
import java.net.URL;
import java.net.URLConnection;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.JavascriptException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.zaproxy.zap.extension.hud.tutorial.pages.IntroPage;
import org.zaproxy.zap.extension.hud.ui.Constants;
import org.zaproxy.zap.extension.hud.ui.firefox.FirefoxUnitTest;
import org.zaproxy.zap.extension.hud.ui.firefox.tutorial.TutorialStatics;
import org.zaproxy.zap.extension.hud.ui.uimap.HUD;

@Tag("tutorial")
public class BadSiteUnitTest extends FirefoxUnitTest {

    // Cache the utils.js url as it wont change and this will speed things up a little bit
    private static String utilsUrl = null;

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

    // This test currently fails - measures put in place to prevent this have proved to be too flaky
    // so far
    // @Test
    // @Disabled
    public void cannotOpenUtilsFileDirectly(HUD hud) throws IOException {
        hud.getWebDriver().get(getHudUtilsFilesUrl(hud));
        String utilsSrc = hud.getWebDriver().getPageSource();
        assertEquals(-1, utilsSrc.indexOf("ZAP_HUD_API"));
    }

    @Test
    public void cannotOpenApiUrlDirectly(HUD hud) throws IOException {
        hud.getWebDriver().get(getHudUtilsFilesUrl(hud));

        URL url = new URL(getHudApiUrl(hud) + "/core/view/version");
        Proxy proxy =
                new Proxy(
                        Proxy.Type.HTTP,
                        new InetSocketAddress(Constants.ZAP_HOST, Constants.ZAP_PORT));
        URLConnection conn = url.openConnection(proxy);
        conn.setConnectTimeout(10 * 1000);

        try {
            conn.getInputStream();
            // This class should not expect a IOException in case this is thrown above
            fail();
        } catch (IOException e) {
            // Expected
        }
    }

    @Test
    public void cannotAccessApiKeyWhenLoadingUtilsAsScript(FirefoxDriver driver)
            throws InterruptedException, MalformedURLException {
        HUD hud = new HUD(driver);
        String utilsUrl = getHudUtilsFilesUrl(hud);

        // Add utils.js to the target site via a script
        StringBuilder sb = new StringBuilder();
        sb.append("var script = document.createElement('script');\n");
        sb.append("script.setAttribute('src','");
        sb.append(utilsUrl);
        sb.append("');\n");
        sb.append("document.head.appendChild(script);\n");

        hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(IntroPage.NAME));
        driver.executeScript(sb.toString());

        // LOG_ERROR is a public var - this should succeed
        driver.executeScript("return LOG_ERROR;");

        // Now try to make use of it
        try {
            // ZAP_HUD_API should be protected via a closure
            driver.executeScript("return ZAP_HUD_API;");
            // This class should not expect a JavascriptException in case the script above fails
            fail();
        } catch (JavascriptException e) {
            // Expected
        }
    }
    /**
     * Obtain the HUD files URL
     *
     * @param driver
     * @return
     * @throws MalformedURLException
     */
    private String getHudUtilsFilesUrl(HUD hud) throws MalformedURLException {
        if (utilsUrl == null) {
            hud.openUrlWaitForHud(TutorialStatics.getTutorialUrl(IntroPage.NAME));
            // Get hold of the API URL
            WebElement panel = hud.getLeftPanel();
            assertNotNull(panel);
            hud.getWebDriver().switchTo().frame(panel);
            String panelSrc = hud.getWebDriver().getPageSource();
            String str = panelSrc.substring(0, panelSrc.indexOf("utils.js") + 8);
            str = str.substring(str.lastIndexOf("https://"));
            // Sanity check its a valid URL
            assertTrue(str.length() > 0);
            new URL(str);
            utilsUrl = str;

            hud.getWebDriver().switchTo().parentFrame();
        }
        return utilsUrl;
    }

    /**
     * Obtain the HUD API URL. Target sites should not be able to do this, but we're testing defence
     * in depth.
     *
     * @param driver
     * @return
     * @throws MalformedURLException
     */
    private String getHudApiUrl(HUD hud) throws MalformedURLException {

        // Its worth noting that target sites wont be able to do this ;)
        // We're just checking that even if the API URL is leaked somehow that the target site wont
        // be able to use it
        hud.getWebDriver().get(getHudUtilsFilesUrl(hud));
        String utilsSrc = hud.getWebDriver().getPageSource();
        int defnOffset = utilsSrc.indexOf("ZAP_HUD_API");
        assertTrue(defnOffset > 0);
        String str = utilsSrc.substring(defnOffset);
        String apiUrl = str.substring(str.indexOf("'") + 1, str.indexOf(";") - 1);

        // Sanity check its a valid URL
        assertTrue(apiUrl.length() > 0);
        new URL(apiUrl);
        return apiUrl;
    }
}
