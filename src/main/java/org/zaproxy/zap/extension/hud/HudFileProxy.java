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

import java.util.HashSet;
import java.util.Set;
import org.apache.log4j.Logger;
import org.parosproxy.paros.network.HttpHeader;
import org.parosproxy.paros.network.HttpMalformedHeaderException;
import org.parosproxy.paros.network.HttpMessage;
import org.parosproxy.paros.network.HttpResponseHeader;
import org.zaproxy.zap.extension.api.API;
import org.zaproxy.zap.extension.api.ApiException;
import org.zaproxy.zap.extension.api.ApiImplementor;

/** Used to serve HUD files via callbacks. These files can be on either the HUD or target domains */
public class HudFileProxy extends ApiImplementor {

    private static final String PREFIX = "hudfiles";

    private static final Logger LOG = Logger.getLogger(HudFileProxy.class);

    private HudAPI api;

    private static final Set<String> DYNAMIC_FILES;

    static {
        DYNAMIC_FILES = new HashSet<String>();
        DYNAMIC_FILES.add("inject.js");
        DYNAMIC_FILES.add("management.js");
    }

    public HudFileProxy(HudAPI api) {
        this.api = api;
    }

    @Override
    public String getPrefix() {
        return PREFIX;
    }

    private HttpResponseHeader getResponseHeader(String fileName, int contentLength)
            throws HttpMalformedHeaderException {
        if (DYNAMIC_FILES.contains(fileName)) {
            return new HttpResponseHeader(
                    API.getDefaultResponseHeader(
                            "application/javascript; charset=UTF-8", contentLength, false));
        } else {
            HttpResponseHeader header;
            if (fileName.endsWith(".html")) {
                // Must allow framing
                header =
                        new HttpResponseHeader(
                                HudAPI.getAllowFramingResponseHeader(
                                        "200 OK",
                                        "text/html; charset=UTF-8",
                                        contentLength,
                                        false));
            } else {
                String contentType;
                if (fileName.endsWith(".js")) {
                    contentType = "application/javascript; charset=UTF-8";
                } else if (fileName.endsWith(".css")) {
                    contentType = "text/css; charset=UTF-8";
                } else {
                    contentType = getImageContentType(fileName);
                }
                header =
                        new HttpResponseHeader(
                                API.getDefaultResponseHeader(contentType, contentLength, true));
            }
            header.setHeader(HttpHeader.CACHE_CONTROL, "public, max-age=31536000");
            return header;
        }
    }

    @Override
    public String handleCallBack(HttpMessage msg) throws ApiException {
        try {
            String query = msg.getRequestHeader().getURI().getPathQuery();
            LOG.debug("callback query = " + query);
            if (query != null) {
                if (query.contains("..")) {
                    // Looks like an injection attack
                    throw new ApiException(
                            ApiException.Type.ILLEGAL_PARAMETER,
                            msg.getRequestHeader().getURI().toString());
                }
                if (query.indexOf("name=") > 0) {
                    String file = query.substring(query.indexOf("name=") + 5);
                    if (file.indexOf("&") > 0) {
                        file = file.substring(0, file.indexOf("&"));
                    }
                    msg.setResponseBody(api.getFile(msg, file));
                    msg.setResponseHeader(getResponseHeader(file, msg.getResponseBody().length()));

                    if (msg.getRequestHeader().getURI().toString().startsWith(API.API_URL_S)) {
                        if (api.allowUnsafeEval()) {
                            msg.getResponseHeader()
                                    .setHeader(
                                            "Content-Security-Policy",
                                            HudAPI.CSP_POLICY_UNSAFE_EVAL);
                        } else {
                            msg.getResponseHeader()
                                    .setHeader("Content-Security-Policy", HudAPI.CSP_POLICY);
                        }
                    }

                    return msg.getResponseBody().toString();
                } else if (query.indexOf("image=") > 0) {
                    String file = query.substring(query.indexOf("image=") + 6);

                    msg.setResponseBody(api.getImage(file));
                    msg.setResponseHeader(getResponseHeader(file, msg.getResponseBody().length()));
                    return msg.getResponseBody().toString();
                }
            }
        } catch (Exception e) {
            throw new ApiException(
                    ApiException.Type.URL_NOT_FOUND, msg.getRequestHeader().getURI().toString());
        }
        throw new ApiException(
                ApiException.Type.URL_NOT_FOUND, msg.getRequestHeader().getURI().toString());
    }

    private String getImageContentType(String name) {
        if (name.endsWith(".png")) {
            return "image/png";
        } else if (name.endsWith(".jpg") || name.endsWith(".jpeg")) {
            return "image/jpeg";
        } else {
            // better than nothing
            return "image";
        }
    }
}
