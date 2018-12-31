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
import net.sf.json.JSONObject;
import org.apache.log4j.Logger;
import org.parosproxy.paros.network.HttpHeader;
import org.parosproxy.paros.network.HttpMessage;
import org.parosproxy.paros.network.HttpRequestHeader;
import org.zaproxy.zap.extension.api.API;
import org.zaproxy.zap.extension.api.API.RequestType;
import org.zaproxy.zap.extension.api.ApiException;
import org.zaproxy.zap.extension.api.ApiImplementor;
import org.zaproxy.zap.extension.api.ApiResponse;

/** Used to allow content on the HUD domain to make API calls without using the API key. */
public class HudApiProxy extends ApiImplementor {

    private static final String PREFIX = "hudapi";

    private HudAPI api;

    private static final Set<String> ALLOWED_ON_DOMAIN_CALLS;

    static {
        ALLOWED_ON_DOMAIN_CALLS = new HashSet<String>();
        ALLOWED_ON_DOMAIN_CALLS.add("action/log");
        ALLOWED_ON_DOMAIN_CALLS.add("action/setOptionShowWelcomeScreen");
    }

    private static final Logger LOG = Logger.getLogger(HudApiProxy.class);

    public HudApiProxy(HudAPI api) {
        this.api = api;
    }

    @Override
    public String getPrefix() {
        return PREFIX;
    }

    @Override
    public void addCustomHeaders(String name, RequestType type, HttpMessage msg) {
        if (msg.getResponseHeader().getStatusCode() == 200) {
            // Only check valid responses
            String[] elements = msg.getRequestHeader().getURI().toString().split("/");
            if (elements.length > 7
                    && "core".equals(elements[6])
                    && RequestType.other.equals(RequestType.valueOf(elements[7]))
                    && "htmlreport".equals(elements[8])) {
                // Allow inline styles, just for the htmlreport
                msg.getResponseHeader()
                        .setHeader(
                                "Content-Security-Policy",
                                "default-src 'none'; script-src 'self'; connect-src 'self'; child-src 'self'; img-src 'self' data:; font-src 'self' data:; style-src 'unsafe-inline'");
            }
        }
    }

    @Override
    public String handleCallBack(HttpMessage msg) throws ApiException {
        String url = msg.getRequestHeader().getURI().toString();
        try {

            LOG.debug("API proxy callback url = " + url);

            String[] elements = url.split("/");

            // format is url is
            // https://zap/zapCallBackUrl/randomstring/hud/view/hudData/?url=http://localhost:8080/bodgeit/
            // 0 1 2 3 4 5 6 7 8

            if (elements.length < 8) {
                throw new ApiException(ApiException.Type.ILLEGAL_PARAMETER, url);
            }

            String component = elements[6];
            ApiImplementor impl = API.getInstance().getImplementors().get(component);
            if (impl == null) {
                throw new ApiException(ApiException.Type.NO_IMPLEMENTOR, component);
            }
            RequestType reqType;

            // check http method type to get correct params
            JSONObject params = null;

            if (msg.getRequestHeader().getMethod().equalsIgnoreCase(HttpRequestHeader.GET)) {
                params = API.getParams(msg.getRequestHeader().getURI().getEscapedQuery());
            } else if (msg.getRequestHeader()
                    .getMethod()
                    .equalsIgnoreCase(HttpRequestHeader.POST)) {
                String contentTypeHeader =
                        msg.getRequestHeader().getHeader(HttpHeader.CONTENT_TYPE);

                if (contentTypeHeader != null
                        && contentTypeHeader.equals(HttpHeader.FORM_URLENCODED_CONTENT_TYPE)) {
                    params = API.getParams(msg.getRequestBody().toString());
                } else {
                    throw new ApiException(ApiException.Type.CONTENT_TYPE_NOT_SUPPORTED);
                }
            }

            String reqTypeStr = elements[7];
            String opName = elements[8];

            if (ALLOWED_ON_DOMAIN_CALLS.contains(reqTypeStr + "/" + opName)) {
                // Its one of the relatively safe calls we can get which don't always have the
                // strict cookie on
                if (!api.getZapHudSafeCookieValue()
                        .equals(api.getRequestCookieValue(msg, HudAPI.ZAP_HUD_SAFE_COOKIE))) {
                    String errorMsg =
                            "Missing or incorrect cookie supplied when accessing safe API call "
                                    + msg.getRequestHeader().getURI();
                    LOG.warn(errorMsg);
                    throw new ApiException(ApiException.Type.ILLEGAL_PARAMETER, errorMsg);
                }
            } else if (!api.getZapHudStrictCookieValue()
                    .equals(api.getRequestCookieValue(msg, HudAPI.ZAP_HUD_STRICT_COOKIE))) {
                String errorMsg =
                        "Missing or incorrect cookie supplied when accessing strict API call "
                                + msg.getRequestHeader().getURI();
                LOG.warn(errorMsg);
                throw new ApiException(ApiException.Type.ILLEGAL_PARAMETER, errorMsg);
            }

            ApiResponse response = null;
            try {
                reqType = RequestType.valueOf(reqTypeStr);
            } catch (IllegalArgumentException e) {
                throw new ApiException(ApiException.Type.BAD_TYPE, reqTypeStr);
            }
            switch (reqType) {
                case action:
                    response = impl.handleApiOptionAction(opName, params);
                    if (response == null) {
                        response = impl.handleApiAction(opName, params);
                    }
                    break;
                case view:
                    response = impl.handleApiOptionView(opName, params);
                    if (response == null) {
                        response = impl.handleApiView(opName, params);
                    }
                    break;
                case other:
                    msg = impl.handleApiOther(msg, opName, params);
                    break;
                case pconn:
                    // Not currently supported - we want it, but it will require a load more work :/
                    throw new ApiException(ApiException.Type.BAD_TYPE, reqType.name());
                default:
                    throw new ApiException(ApiException.Type.BAD_TYPE, reqType.name());
            }
            if (reqType.equals(RequestType.other)) {
                return msg.getResponseBody().toString();
            } else {
                msg.setResponseHeader(
                        API.getDefaultResponseHeader("application/json; charset=UTF-8", 0, false));
                String body = response.toJSON().toString();
                msg.setResponseBody(body);
                msg.getResponseHeader().setContentLength(msg.getResponseBody().length());
                return body;
            }
        } catch (Exception e) {
            throw new ApiException(ApiException.Type.ILLEGAL_PARAMETER, e.getMessage());
        }
    }
}
