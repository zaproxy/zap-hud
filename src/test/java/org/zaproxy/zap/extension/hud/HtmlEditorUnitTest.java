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

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.parosproxy.paros.network.HttpMessage;

/** Unit test for {@link HtmlEditor}. */
public class HtmlEditorUnitTest {

    private static final String EOB_TOKEN = "EOB";
    private static final String INJECT_TOKEN = "INJECT";

    @Test
    public void testNoBodyTag() {
        genericTestWithNoBodyTag("<head></head>");
    }

    @Test
    public void testNoHeadTag() {
        genericTestWithNoHeadTag("<body></body>");
    }

    @Test
    public void testCommentedBody() {
        genericTestWithNoBodyTag("<head></head><!--<body></body>-->");
    }

    @Test
    public void testCommentedHead() {
        genericTestWithNoHeadTag("<!--<head></head>--><body></body>");
    }

    @Test
    public void testSimpleHtml() {
        genericTestWithBodyTag("<head></head><body>" + EOB_TOKEN + "</body>");
        genericTestWithHeadTag("<head>" + EOB_TOKEN + "</head><body></body>");
    }

    @Test
    public void testCommentedAndUncommentedBody() {
        genericTestWithBodyTag("<head></head><!--<body></body>--><body>" + EOB_TOKEN + "</body>");
    }

    @Test
    public void testTwitterStyleBody() {
        genericTestWithBodyTag(
                "<head>"
                        + "</head>"
                        + " <body class=\"three-col logged-out static-logged-out-home-page\" \n"
                        + "data-fouc-class-names=\"swift-loading\"\n"
                        + " dir=\"ltr\">"
                        + EOB_TOKEN
                        + "\n"
                        + "      <script id=\"swift_loading_indicator\" nonce=\"G5f1XC57dp7ig7dTGs9oxw==\">\n"
                        + "        document.body.className=document.body.className+\" \"+document.body.getAttribute(\"data-fouc-class-names\");\n"
                        + "      </script>\n");
    }

    @Test
    public void testMultipleBodyTags() {
        genericTestWithBodyTag("<head></head><body>" + EOB_TOKEN + "</body><body></body>");
    }

    @Test
    public void testMultipleHeadTags() {
        genericTestWithHeadTag(
                "<head>" + EOB_TOKEN + "</head><head></head><body></body><body></body>");
    }

    private void genericTestWithBodyTag(String htmlBody) {
        // Given
        HttpMessage msg = new HttpMessage();
        msg.setResponseBody(htmlBody);
        HtmlEditor htmlEd = new HtmlEditor(msg);

        // When
        htmlEd.injectAtStartOfBody(INJECT_TOKEN);
        htmlEd.rewriteHttpMessage();

        // Then
        assertTrue(htmlEd.isChanged());
        assertTrue(msg.getResponseBody().toString().indexOf(INJECT_TOKEN + EOB_TOKEN) > 0);
    }

    private void genericTestWithNoBodyTag(String htmlBody) {
        // Given
        HttpMessage msg = new HttpMessage();
        msg.setResponseBody(htmlBody);
        HtmlEditor htmlEd = new HtmlEditor(msg);

        // When
        htmlEd.injectAtStartOfBody(INJECT_TOKEN);
        htmlEd.rewriteHttpMessage();

        // Then
        assertFalse(htmlEd.isChanged());
        assertTrue(msg.getResponseBody().toString().equals(htmlBody));
    }

    private void genericTestWithHeadTag(String htmlBody) {
        // Given
        HttpMessage msg = new HttpMessage();
        msg.setResponseBody(htmlBody);
        HtmlEditor htmlEd = new HtmlEditor(msg);

        // When
        htmlEd.injectAtStartOfHead(INJECT_TOKEN);
        htmlEd.rewriteHttpMessage();

        // Then
        assertTrue(htmlEd.isChanged());
        assertTrue(msg.getResponseBody().toString().indexOf(INJECT_TOKEN + EOB_TOKEN) > 0);
    }

    private void genericTestWithNoHeadTag(String htmlBody) {
        // Given
        HttpMessage msg = new HttpMessage();
        msg.setResponseBody(htmlBody);
        HtmlEditor htmlEd = new HtmlEditor(msg);

        // When
        htmlEd.injectAtStartOfHead(INJECT_TOKEN);
        htmlEd.rewriteHttpMessage();

        // Then
        assertFalse(htmlEd.isChanged());
        assertTrue(msg.getResponseBody().toString().equals(htmlBody));
    }
}
