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

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.apache.commons.httpclient.URI;
import org.apache.commons.httpclient.URIException;
import org.junit.Test;
import org.parosproxy.paros.network.HttpMessage;
import org.parosproxy.paros.network.HttpRequestHeader;

/**
 * Unit test for {@link HtmlEditor}.
 */
public class HtmlEditorUnitTest {

    private static final String EOB_TOKEN = "EOB";
    private static final String INJECT_TOKEN = "INJECT";
    
    @Test
    public void testNoBodyTag() throws URIException, NullPointerException {
        genericTestWithNoBodyTag("<head></head>");
    }
    
    @Test
    public void testCommentedBody() throws URIException, NullPointerException {
        genericTestWithNoBodyTag("<head></head><!--<body></body>-->");
    }
    
    @Test
    public void testSimpleHtml() throws URIException, NullPointerException {
        genericTestWithBodyTag(
                "<head></head><body>" + EOB_TOKEN + "</body>");
    }
    
    @Test
    public void testCommentedAndUncommentedBody() throws URIException, NullPointerException {
        genericTestWithBodyTag(
                "<head></head><!--<body></body>--><body>" + EOB_TOKEN + "</body>");
    }
    
    @Test
    public void testTwitterStyleBody() throws URIException, NullPointerException {
        genericTestWithBodyTag(
                "<head>"
                + "</head>"
                + " <body class=\"three-col logged-out static-logged-out-home-page\" \n" + 
                "data-fouc-class-names=\"swift-loading\"\n" + 
                " dir=\"ltr\">" + EOB_TOKEN + "\n" + 
                "      <script id=\"swift_loading_indicator\" nonce=\"G5f1XC57dp7ig7dTGs9oxw==\">\n" + 
                "        document.body.className=document.body.className+\" \"+document.body.getAttribute(\"data-fouc-class-names\");\n" + 
                "      </script>\n");
    }
    
    @Test
    public void testMultipleBodyTags() throws URIException, NullPointerException {
        genericTestWithBodyTag(
                "<head></head><body>" + EOB_TOKEN + "</body><body></body>");
    }
    
    @Test
    public void testBbcStyleBody() throws URIException, NullPointerException {
        genericTestWithBodyTag(
                "<head></head>\n" +
                "<!--[if lt IE 7]>      <body class=\"lt-ie10 lt-ie9 lt-ie8 lt-ie7\">  <![endif]-->\n" + 
                "<!--[if IE 7]>         <body class=\"ie7 lt-ie10 lt-ie9 lt-ie8\">     <![endif]-->\n" + 
                "<!--[if IE 8]>         <body class=\"ie8 lt-ie10 lt-ie9\">            <![endif]-->\n" + 
                "<!--[if IE 9]>         <body class=\"ie9 lt-ie10\">                   <![endif]-->\n" + 
                "<!--[if gt IE 9]><!--> <body>" + EOB_TOKEN + "                                   <!--<![endif]-->\n" + 
                "</body>");
    }
    
    private void genericTestWithBodyTag(String htmlBody) throws URIException, NullPointerException {
        // Given
        HttpMessage msg = new HttpMessage();
        HttpRequestHeader reqHeader = new HttpRequestHeader();
        reqHeader.setURI(new URI("http://www.example.com", true));
        msg.setRequestHeader(reqHeader);
        msg.setResponseBody(htmlBody);
        HtmlEditor htmlEd = new HtmlEditor(msg);

        // When
        htmlEd.injectAtStartOfBody(INJECT_TOKEN);
        htmlEd.rewriteHttpMessage();

        // Then
        assertTrue(htmlEd.isChanged());
        assertTrue(msg.getResponseBody().toString().indexOf(INJECT_TOKEN + EOB_TOKEN) > 0);
    }

    private void genericTestWithNoBodyTag(String htmlBody) throws URIException, NullPointerException {
        // Given
        HttpMessage msg = new HttpMessage();
        HttpRequestHeader reqHeader = new HttpRequestHeader();
        reqHeader.setURI(new URI("http://www.example.com", true));
        msg.setRequestHeader(reqHeader);
        msg.setResponseBody(htmlBody);
        HtmlEditor htmlEd = new HtmlEditor(msg);

        // When
        htmlEd.injectAtStartOfBody(INJECT_TOKEN);
        htmlEd.rewriteHttpMessage();

        // Then
        assertFalse(htmlEd.isChanged());
        assertTrue(msg.getResponseBody().toString().equals(htmlBody));
    }
}
