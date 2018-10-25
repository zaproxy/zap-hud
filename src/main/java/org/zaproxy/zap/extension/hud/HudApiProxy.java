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

    private static final Logger LOG = Logger.getLogger(HudApiProxy.class);

    public HudApiProxy() {}

    @Override
    public String getPrefix() {
        return PREFIX;
    }

    @Override
    public String handleCallBack(HttpMessage msg) throws ApiException {
        try {

            String url = msg.getRequestHeader().getURI().toString();
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

            ApiResponse response;
            try {
                reqType = RequestType.valueOf(elements[7]);
            } catch (IllegalArgumentException e) {
                throw new ApiException(ApiException.Type.BAD_TYPE, elements[7]);
            }
            switch (reqType) {
                case action:
                    response = impl.handleApiAction(elements[8], params);
                    break;
                case view:
                    response = impl.handleApiView(elements[8], params);
                    break;
                case other:
                    // Not currently needed
                    throw new ApiException(ApiException.Type.BAD_TYPE, reqType.name());
                case pconn:
                    // Not currently supported - we want it, but it will require a load more work :/
                    throw new ApiException(ApiException.Type.BAD_TYPE, reqType.name());
                default:
                    throw new ApiException(ApiException.Type.BAD_TYPE, reqType.name());
            }
            msg.setResponseHeader(
                    API.getDefaultResponseHeader("application/json; charset=UTF-8", 0, false));
            String body = response.toJSON().toString();
            msg.setResponseBody(body);
            msg.getResponseHeader().setContentLength(msg.getResponseBody().length());
            return body;
        } catch (Exception e) {
            LOG.error("Failed at end " + e.getMessage(), e);
            throw new ApiException(
                    ApiException.Type.URL_NOT_FOUND, msg.getRequestHeader().getURI().toString());
        }
    }
}
