/*
 * Zed Attack Proxy (ZAP) and its related class files.
 *
 * ZAP is an HTTP/HTTPS proxy for assessing web application security.
 *
 * Copyright 2019 The ZAP Development Team
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import org.apache.commons.httpclient.URI;
import org.apache.commons.httpclient.URIException;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.parosproxy.paros.network.HttpMessage;
import org.parosproxy.paros.network.HttpResponseHeader;

/** Unit test for {@link HttpUpgradeProxyListener}. */
public class HttpUpgradeProxyListenerTest {
    private static String httpUrl = "http://www.example.com/";
    private static String httpsUrl = "https://www.example.com/";

    @Test
    public void upgradedHttpUrlUpgradedInHtml() throws URIException {
        // Given
        URI httpUri = new URI(httpUrl, true);
        String body = "<head></head><body>" + httpUrl + "</body><body></body>";
        ExtensionHUD ext = Mockito.mock(ExtensionHUD.class);
        Mockito.when(ext.isHudEnabled()).thenReturn(true);
        Mockito.when(ext.isUpgradedHttpsDomain(httpUri)).thenReturn(true);

        HttpUpgradeProxyListener hupl = new HttpUpgradeProxyListener(ext);
        HttpMessage msg = createMessage(httpUri, "text/html", body);

        // When
        hupl.onHttpResponseReceived(msg);

        // Then
        assertEquals(body.replace(httpUrl, httpsUrl), msg.getResponseBody().toString());
        assertEquals(msg.getResponseBody().length(), msg.getResponseHeader().getContentLength());
    }

    @Test
    public void upgradedHttpUrlsUpgradedInHtml() throws URIException {
        // Given
        URI httpUri = new URI(httpUrl, true);
        String body =
                "<head></head><body>"
                        + httpUrl
                        + " "
                        + httpUrl
                        + " "
                        + httpUrl
                        + "</body><body></body>";
        ExtensionHUD ext = Mockito.mock(ExtensionHUD.class);
        Mockito.when(ext.isHudEnabled()).thenReturn(true);
        Mockito.when(ext.isUpgradedHttpsDomain(httpUri)).thenReturn(true);

        HttpUpgradeProxyListener hupl = new HttpUpgradeProxyListener(ext);
        HttpMessage msg = createMessage(httpUri, "text/html", body);

        // When
        hupl.onHttpResponseReceived(msg);

        // Then
        assertEquals(body.replace(httpUrl, httpsUrl), msg.getResponseBody().toString());
        assertEquals(msg.getResponseBody().length(), msg.getResponseHeader().getContentLength());
    }

    @Test
    public void upgradedHttpUrlNotUpgradedInPng() throws URIException {
        // Given
        URI httpUri = new URI(httpUrl, true);
        String body = "any old text" + httpUrl + "blah blah blah";
        ExtensionHUD ext = Mockito.mock(ExtensionHUD.class);
        Mockito.when(ext.isHudEnabled()).thenReturn(true);
        Mockito.when(ext.isUpgradedHttpsDomain(httpUri)).thenReturn(true);

        HttpUpgradeProxyListener hupl = new HttpUpgradeProxyListener(ext);
        HttpMessage msg = createMessage(httpUri, "image/png", body);

        // When
        hupl.onHttpResponseReceived(msg);

        // Then
        assertEquals(body, msg.getResponseBody().toString());
        assertEquals(msg.getResponseBody().length(), msg.getResponseHeader().getContentLength());
    }

    @Test
    public void notUpgradedHttpUrlNotUpgradedInHtml() throws URIException {
        // Given
        URI httpUri = new URI(httpUrl, true);
        String body = "<head></head><body>" + httpUrl + "</body><body></body>";
        ExtensionHUD ext = Mockito.mock(ExtensionHUD.class);
        Mockito.when(ext.isHudEnabled()).thenReturn(true);
        Mockito.when(ext.isUpgradedHttpsDomain(httpUri)).thenReturn(false);

        HttpUpgradeProxyListener hupl = new HttpUpgradeProxyListener(ext);
        HttpMessage msg = createMessage(httpUri, "text/html", body);

        // When
        hupl.onHttpResponseReceived(msg);

        // Then
        assertEquals(body, msg.getResponseBody().toString());
        assertEquals(msg.getResponseBody().length(), msg.getResponseHeader().getContentLength());
    }

    @Test
    public void extractValidWssUrls() throws URIException, NullPointerException {
        // Given
        URI wssUri1 = new URI("wss://www.example.com", true);
        URI wssUri2 = new URI("wss://www.example2.com", true);

        String str = "  " + wssUri1 + " http://example.com  " + wssUri2;

        // When
        List<URI> list = HttpUpgradeProxyListener.extractWssUrls(str);

        // Then
        assertEquals(2, list.size());
        assertTrue(list.contains(wssUri1));
        assertTrue(list.contains(wssUri2));
    }

    @Test
    public void extractValidWssUrlsWithPorts() throws URIException, NullPointerException {
        // Given
        URI wssUri1 = new URI("wss://www.example.com:80", true);
        URI wssUri2 = new URI("wss://www.example2.com:9070/", true);

        String str = "  " + wssUri1 + " ws://example.com  " + wssUri2;

        // When
        List<URI> list = HttpUpgradeProxyListener.extractWssUrls(str);

        // Then
        assertEquals(2, list.size());
        assertTrue(list.contains(wssUri1));
        assertTrue(list.contains(wssUri2));
    }

    private static HttpMessage createMessage(URI uri, String contentType, String body)
            throws URIException {
        HttpMessage msg = new HttpMessage();
        msg.getRequestHeader().setURI(uri);
        msg.getResponseHeader().setHeader(HttpResponseHeader.CONTENT_TYPE, contentType);
        msg.setResponseBody(body);
        msg.getResponseHeader().setContentLength(msg.getResponseBody().length());
        return msg;
    }
}
