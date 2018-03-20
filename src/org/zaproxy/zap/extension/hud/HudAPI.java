/*
 * Zed Attack Proxy (ZAP) and its related class files.
 *
 * ZAP is an HTTP/HTTPS proxy for assessing web application security.
 *
 * Copyright 2016 The ZAP Development Team
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

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.InputStream;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import org.apache.commons.httpclient.URI;
import org.apache.commons.httpclient.URIException;
import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;
import org.parosproxy.paros.control.Control;
import org.parosproxy.paros.core.scanner.Alert;
import org.parosproxy.paros.model.Model;
import org.parosproxy.paros.model.SiteNode;
import org.parosproxy.paros.network.HttpMessage;
import org.parosproxy.paros.view.View;
import org.zaproxy.zap.extension.api.API;
import org.zaproxy.zap.extension.api.ApiAction;
import org.zaproxy.zap.extension.api.ApiException;
import org.zaproxy.zap.extension.api.ApiImplementor;
import org.zaproxy.zap.extension.api.ApiResponse;
import org.zaproxy.zap.extension.api.ApiResponseElement;
import org.zaproxy.zap.extension.api.ApiResponseList;
import org.zaproxy.zap.extension.api.ApiResponseSet;
import org.zaproxy.zap.extension.api.ApiView;
import org.zaproxy.zap.extension.ascan.ActiveScan;
import org.zaproxy.zap.extension.ascan.ExtensionActiveScan;
import org.zaproxy.zap.extension.brk.ExtensionBreak;
import org.zaproxy.zap.extension.script.ScriptWrapper;
import org.zaproxy.zap.extension.spider.ExtensionSpider;
import org.zaproxy.zap.extension.spider.SpiderScan;
import org.zaproxy.zap.extension.websocket.ExtensionWebSocket;

import net.sf.json.JSONObject;

public class HudAPI extends ApiImplementor {

    // TODO shouldnt allow unsafe-inline styles - need to work out where they are being used
	protected static final String CSP_POLICY =
			"default-src 'none'; script-src 'self'; connect-src https://zap wss://zap; frame-src 'self'; img-src 'self' data:; "
			+ "font-src 'self' data:; style-src 'self' 'unsafe-inline' ;";

    protected static final String CSP_POLICY_UNSAFE_EVAL =
            "default-src 'none'; script-src 'self' 'unsafe-eval'; connect-src https://zap wss://zap; frame-src 'self'; img-src 'self' data:; "
            + "font-src 'self' data:; style-src 'self' 'unsafe-inline' ;";

    private static final String PREFIX = "hud";
    
    private Map<String, String> siteUrls = new HashMap<String, String>();
    private ExtensionHUD extension;

	private static final String HUD_DATA = "hudData";

	private static final String ACTION_ENABLE_TIMELINE = "enableTimeline";
	private static final String ACTION_DISABLE_TIMELINE = "disableTimeline";

	private static final String PARAM_URL = "url";
	
	/**
	 * The only files that can be included on domain
	 */
	private static final List<String> DOMAIN_FILE_WHITELIST = Arrays.asList(new String[] { "inject.js" });

    private ApiImplementor hudFileProxy;
	private ApiImplementor hudApiProxy;
	
	private String hudFileUrl;
    private String hudApiUrl;

    private String websocketUrl;

    private boolean isTimelineEnabled = false;

    private static Logger logger = Logger.getLogger(HudAPI.class);
    
    public HudAPI(ExtensionHUD extension) {
    	this.extension = extension;

    	this.addApiView(new ApiView(HUD_DATA, new String[] {PARAM_URL}));

    	this.addApiAction(new ApiAction(ACTION_ENABLE_TIMELINE));
    	this.addApiAction(new ApiAction(ACTION_DISABLE_TIMELINE));
    	
    	hudFileProxy = new HudFileProxy(this);
    	hudFileUrl = API.getInstance().getCallBackUrl(hudFileProxy, API.API_URL_S); 
        hudApiProxy = new HudApiProxy();
        hudApiUrl = API.getInstance().getCallBackUrl(hudApiProxy, API.API_URL_S);

        // Temporary hack to make it easier to find the websocket test page
        // We could launch a browser, but then we'd need to depend on selenium
        // and work out which browser to choose...
        new Thread() {
            @Override
            public void run() {
                try {
                    Thread.sleep(5000);
                } catch (InterruptedException e) {
                    // Ignore
                }
                if (View.isInitialised()) {
                    View.getSingleton().getOutputPanel().append(
                            "The websocket testing page is: " + hudFileUrl + "?name=websockettest.html\n");
                }
            }
        }.start();

    }

	@Override
	public String getPrefix() {
		return PREFIX;
	}
	
    protected ApiImplementor getHudApiProxy() {
        return hudApiProxy;
    }

    protected ApiImplementor getHudFileProxy() {
        return hudFileProxy;
    }

    public String getUrlPrefix(String site) {
		String url = this.siteUrls.get(site);
		if (url == null) {
			url = API.getInstance().getCallBackUrl(this, site); 
			this.siteUrls.put(site, url);
		}
		return url;
	}
	
	public void reset() {
		this.siteUrls.clear();
	}
	
	public boolean allowUnsafeEval() {
	    return this.extension.getHudParam().isDevelopmentMode() && this.extension.getHudParam().isAllowUnsafeEval();
	}
	
	public boolean isTimelineEnabled() {
		return this.isTimelineEnabled;
	}
	
	@Override
	public String handleCallBack(HttpMessage msg)  throws ApiException {
		// Just used to handle files which need to be on the target domain
		try {
			String query = msg.getRequestHeader().getURI().getPathQuery();
			logger.debug("callback query = " + query);
			if (query != null) {
				if (query.indexOf("zapfile=") > 0) {
					String fileName = query.substring(query.indexOf("zapfile=") + 8);
					if (DOMAIN_FILE_WHITELIST.contains(fileName)) {
						msg.setResponseBody(this.getFile(msg, ExtensionHUD.TARGET_DIRECTORY + "/" + fileName));
						// Currently only javascript files are returned
						msg.setResponseHeader(API.getDefaultResponseHeader("application/javascript; charset=UTF-8", msg.getResponseBody().length(), false));
						return msg.getResponseBody().toString();
					}
				}
			}
		} catch (Exception e) {
			throw new ApiException (ApiException.Type.URL_NOT_FOUND, msg.getRequestHeader().getURI().toString());
		}
		throw new ApiException (ApiException.Type.URL_NOT_FOUND, msg.getRequestHeader().getURI().toString());
	}

	@Override
	public ApiResponse handleApiView (String name,
			JSONObject params) throws ApiException {
		ApiResponse result = null;
		Map<String, Object> resultMap = null;

		if (HUD_DATA.equals(name)) {
			//result = new ApiResponseList(name);
			resultMap = new HashMap<String, Object>();

			String url = this.getParam(params, PARAM_URL, (String) null);
			
			SiteNode node = null;
			SiteNode parent = null;
			try {
				URI uri = new URI(url, false);
				node = Model.getSingleton().getSession().getSiteTree().findNode(uri);
				parent = Model.getSingleton().getSession().getSiteTree().findClosestParent(uri);
			} catch (URIException e) {
				throw new ApiException(ApiException.Type.ILLEGAL_PARAMETER, PARAM_URL);
			}
			if (parent != null) {
				//ApiResponseList siteSummary = new ApiResponseList("siteSummary");
				List<Map<String, String>> summary = new ArrayList<Map<String, String>>();

				// find the top level site node
				while (!parent.getParent().isRoot()) {
					parent = parent.getParent();
				}
				Map<Integer, Map<String, Integer>> alertCounts = new HashMap<>(); 
				for (Alert alert : parent.getAlerts() ) {
					Map<String, Integer> alertCount = alertCounts.get(alert.getRisk());
					if (alertCount == null) {
						alertCount = new HashMap<String, Integer>();
						alertCounts.put(alert.getRisk(), alertCount);
					}
					int count = 0;
					if (alertCount.containsKey(alert.getName())) {
						count = alertCount.get(alert.getName());
					}
					count++;
					alertCount.put(alert.getName(), count);

					// site alerts
					Map<String, String> alertAtts = new HashMap<String, String>();
					alertAtts.put("alert", alert.getName());
					alertAtts.put("risk", Alert.MSG_RISK[alert.getRisk()]);
					alertAtts.put("param", alert.getParam());
					alertAtts.put("id", Integer.toString(alert.getAlertId()));
					alertAtts.put("uri", alert.getUri());
					summary.add(alertAtts);
				}
				for (Entry<Integer, Map<String, Integer>> entry : alertCounts.entrySet()) {
					// loop through info, low, medium, high
					Map<String, Integer> alertCount = entry.getValue();
					if (alertCount != null) {
						for (Map.Entry<String, Integer>alert : alertCount.entrySet()) {
							// Loop through the alert counts for each level
							Map<String, String> alertAtts = new HashMap<String, String>();
							alertAtts.put("alert", alert.getKey());
							alertAtts.put("risk", Alert.MSG_RISK[entry.getKey()]);
							//alertAtts.put("param", alert.getKey().getParam());
							//alertAtts.put("id", Integer.toString(alert.getAlertId()));
							//siteSummary.addItem(new ApiResponseSet("alert", alertAtts));
							//summary.add(alertAtts);
						}
					}
				}
				//((ApiResponseList)result).addItem(siteSummary);
				resultMap.put("siteAlerts", summary);
			}
			if (node != null) {
				// Loop through siblings to find nodes for the same url
				List<Map<String, String>> pageAlerts = new ArrayList<Map<String, String>>();
				String cleanName = node.getHierarchicNodeName();
				@SuppressWarnings("rawtypes")
				Enumeration en = node.getParent().children();
				while (en.hasMoreElements()) {
					SiteNode sibling = (SiteNode)en.nextElement();
					if (sibling.getHierarchicNodeName().equals(cleanName)) {
						for (Alert alert : sibling.getAlerts()) {
							if (alert.getUri().startsWith(cleanName)) {
								// TODO is this a good enough match? Could still match child alerts :/
								Map<String, String> alertAtts = new HashMap<String, String>();
								alertAtts.put("alert", alert.getName());
								alertAtts.put("risk", Alert.MSG_RISK[alert.getRisk()]);
								alertAtts.put("param", alert.getParam());
								alertAtts.put("id", Integer.toString(alert.getAlertId()));
								//pageAlerts.addItem(new ApiResponseSet("alert", alertAtts));
								alertAtts.put("uri", alert.getUri());
								pageAlerts.add(alertAtts);
							}
						}
					}
				}
				//((ApiResponseList)result).addItem(pageAlerts);
				resultMap.put("pageAlerts", pageAlerts);

				// Report on scope
				ApiResponseList scopeData = new ApiResponseList("scope");
				Map<String, String> scopeAtts = new HashMap<String, String>();
				scopeAtts.put("inscope", Boolean.toString(node.isIncludedInScope()));
				scopeAtts.put("attack", Boolean.toString(Control.getSingleton().getMode().equals(Control.Mode.attack)));
				scopeData.addItem(new ApiResponseSet<>("scope", scopeAtts));
				scopeData.addItem(new ApiResponseSet<>("attack", scopeAtts));
				//((ApiResponseList)result).addItem(scopeData);
				resultMap.put("scope", scopeAtts);
			}
			
			// Spider
			ExtensionSpider extSpider = (ExtensionSpider) Control.getSingleton().getExtensionLoader().getExtension("ExtensionSpider");
			if (extSpider != null) {
				int progress = 0;
				List<SpiderScan> scans = extSpider.getActiveScans();
				if (scans.size() == 0) {
					// No current scans, were there any before?
					if (extSpider.getAllScans().size() > 0) {
						// Yep, all must have finished
						progress = 100;
					} else {
						// Use -1 to indicate no scans have been started
						progress = -1;
					}
				} else {
					for (SpiderScan scan : scans) {
						progress += scan.getProgress();
					}
					progress = progress / scans.size();
				}
				ApiResponseList spiderData = new ApiResponseList("spider");
				Map<String, String> spiderAtts = new HashMap<String, String>();
				spiderAtts.put("progress", Integer.toString(progress));
				spiderData.addItem(new ApiResponseSet<>("spider", spiderAtts));
				//((ApiResponseList)result).addItem(spiderData);
				resultMap.put("spider", spiderAtts);
			}

			// Active Scan
			ExtensionActiveScan extAscan = (ExtensionActiveScan) Control.getSingleton().getExtensionLoader().getExtension("ExtensionActiveScan");
			if (extAscan != null) {
				int progress = 0;
				List<ActiveScan> scans = extAscan.getActiveScans();
				if (scans.size() == 0) {
					// No current scans, were there any before?
					if (extAscan.getAllScans().size() > 0) {
						// Yep, all must have finished
						progress = 100;
					} else {
						// Use -1 to indicate no scans have been started
						progress = -1;
					}
				} else {
					for (ActiveScan scan : scans) {
						progress += scan.getProgress();
					}
					progress = progress / scans.size();
				}
				ApiResponseList ascanData = new ApiResponseList("ascan");
				Map<String, String> ascanAtts = new HashMap<String, String>();
				ascanAtts.put("progress", Integer.toString(progress));
				ascanData.addItem(new ApiResponseSet<>("ascan", ascanAtts));
				//((ApiResponseList)result).addItem(ascanData);
				resultMap.put("active-scan", ascanAtts);
			}

			// Break
			ExtensionBreak extBreak = (ExtensionBreak) Control.getSingleton().getExtensionLoader().getExtension("ExtensionBreak");
			if (extBreak != null) {
				Map<String, String> breakData = new HashMap<String, String>();
				boolean isBreakingRequest = false;
				HttpMessage message = (HttpMessage)extBreak.getBreakpointManagementInterface().getMessage();


				if (message != null) {
					logger.debug("break message: " + message.toString());

					isBreakingRequest = true;
					breakData.put("request_header", message.getRequestHeader().toString());
					breakData.put("request_body", message.getRequestBody().toString());
					breakData.put("response_header", message.getResponseHeader().toString());
					breakData.put("response_body", message.getResponseBody().toString());
				}
				else {
					breakData.put("request_header", "");
					breakData.put("request_body", "");
					breakData.put("response_header", "");
					breakData.put("response_body", "");
				}

				breakData.put("isBreakingRequest", Boolean.toString(isBreakingRequest));

				resultMap.put("break", breakData);
			}

			
		} else {
			throw new ApiException(ApiException.Type.BAD_VIEW);
		}

		result = new ApiResponseSet<>(name, resultMap);
		return result;
	}

	@Override
	public ApiResponse handleApiAction(String name, JSONObject params) throws ApiException {

		switch (name) {
			case ACTION_ENABLE_TIMELINE:
				this.isTimelineEnabled = true;
				break;

			case ACTION_DISABLE_TIMELINE:
				this.isTimelineEnabled = false;
				break;

			default:
				throw new ApiException(ApiException.Type.BAD_ACTION);
		}

		return ApiResponseElement.OK;
	}

    protected String getSite(HttpMessage msg) throws URIException {
        StringBuilder site = new StringBuilder();
        if (msg.getRequestHeader().isSecure()) {
            site.append("https://");
        } else {
            site.append("http://");
        }
        site.append(msg.getRequestHeader().getURI().getHost());
        if (msg.getRequestHeader().getURI().getPort() > 0) {
            site.append(":");
            site.append(msg.getRequestHeader().getURI().getPort());
        }
        return site.toString();
    }

    protected String getFile (HttpMessage msg, String file) {
        try {
            String contents;
            ScriptWrapper sw = this.extension.getExtScript().getScript(file);
            if (sw != null) {
                contents = sw.getContents();
            } else {
                logger.warn("Failed to access script " + file + " via the script extension");
                File f = new File(this.extension.getHudParam().getBaseDirectory(), file);
                if (! f.exists()) {
                    logger.error("No such file " + f.getAbsolutePath(), new FileNotFoundException(file));
                    return null;
                }
                // Quick way to read a small text file
                contents = new String(Files.readAllBytes(f.toPath()));
            }
        
            String url = msg.getRequestHeader().getURI().toString();
            if (url.indexOf("/zapCallBackUrl") > 0) {
                // Strip off the callback path
                url = url.substring(0, url.indexOf("/zapCallBackUrl"));
            }
            contents = contents.replace("<<ZAP_HUD_FILES>>", this.hudFileUrl)
                    .replace("<<URL>>", url);

            if (url.startsWith(API.API_URL_S)) {
                // Only do this on the ZAP domain
                contents = contents.replace("<<ZAP_HUD_API>>", this.hudApiUrl)
                        .replace("<<ZAP_HUD_WS>>", getWebSocketUrl());
            }
            
            return contents;
        } catch (Exception e) {
            // Something unexpected went wrong, write the error to the log
            logger.error(e.getMessage(), e);
            return null;
        }
    }
    
    private String getWebSocketUrl() {
        if (websocketUrl == null) {
            websocketUrl = Control.getSingleton().getExtensionLoader().getExtension(ExtensionWebSocket.class).getCallbackUrl();
        }
        return websocketUrl;
    }

    protected byte[] getImage (String name) {
        // TODO cache? And support local files
        try {
            InputStream is = this.getClass().getResourceAsStream(ExtensionHUD.RESOURCE + "/" + name);
            if (is == null) {
                logger.error("No such resource: " + name);
                return null;
            }
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            IOUtils.copy(is, bos);
            return bos.toByteArray();
        } catch (Exception e) {
            // Something unexpected went wrong, write the error to the log
            logger.error(e.getMessage(), e);
            return null;
        }
    }

    
	public static String getAllowFramingResponseHeader(String responseStatus, String contentType, int contentLength, boolean canCache) {
		StringBuilder sb = new StringBuilder(250);

		sb.append("HTTP/1.1 ").append(responseStatus).append("\r\n");
		if (! canCache) {
			sb.append("Pragma: no-cache\r\n");
			sb.append("Cache-Control: no-cache\r\n");
		}
		else {
			//todo: found this necessary to cache, remove if not
			sb.append("Cache-Control: public,max-age=3000000\r\n");
		}
		sb.append("Content-Security-Policy: ").append(HudAPI.CSP_POLICY).append("\r\n");
		sb.append("Access-Control-Allow-Methods: GET,POST,OPTIONS\r\n");
		sb.append("Access-Control-Allow-Headers: ZAP-Header\r\n");
		sb.append("X-XSS-Protection: 1; mode=block\r\n");
		sb.append("X-Content-Type-Options: nosniff\r\n");
		sb.append("X-Clacks-Overhead: GNU Terry Pratchett\r\n");
		sb.append("Content-Length: ").append(contentLength).append("\r\n");
		sb.append("Content-Type: ").append(contentType).append("\r\n");

		return sb.toString();
	}
}
