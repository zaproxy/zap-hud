package org.zaproxy.zap.extension.hud;

import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;

import net.sf.json.JSONObject;

import org.apache.commons.httpclient.URI;
import org.apache.commons.httpclient.URIException;
import org.apache.log4j.Logger;
import org.parosproxy.paros.control.Control;
import org.parosproxy.paros.core.scanner.Alert;
import org.parosproxy.paros.model.Model;
import org.parosproxy.paros.model.SiteNode;
import org.parosproxy.paros.network.HttpHeader;
import org.parosproxy.paros.network.HttpMalformedHeaderException;
import org.parosproxy.paros.network.HttpMessage;
import org.zaproxy.zap.extension.alert.ExtensionAlert;
import org.zaproxy.zap.extension.api.API;
import org.zaproxy.zap.extension.api.ApiException;
import org.zaproxy.zap.extension.api.ApiImplementor;
import org.zaproxy.zap.extension.api.ApiOther;
import org.zaproxy.zap.extension.api.ApiResponse;
import org.zaproxy.zap.extension.api.ApiResponseList;
import org.zaproxy.zap.extension.api.ApiResponseSet;
import org.zaproxy.zap.extension.api.ApiResponseElement;
import org.zaproxy.zap.extension.api.ApiView;
import org.zaproxy.zap.extension.api.ApiAction;
import org.zaproxy.zap.extension.ascan.ActiveScan;
import org.zaproxy.zap.extension.ascan.ExtensionActiveScan;
import org.zaproxy.zap.extension.spider.ExtensionSpider;
import org.zaproxy.zap.extension.spider.SpiderScan;
import org.zaproxy.zap.extension.brk.ExtensionBreak;
import org.zaproxy.zap.extension.httppanel.Message;

public class HudAPI extends ApiImplementor {

	private static final String CSP_POLICY =
			"default-src 'none'; script-src 'self'; connect-src 'self'; child-src 'self'; img-src 'self' data:; "
			+ "font-src 'self' data:; style-src 'self';";

    private static final String PREFIX = "hud";
    
    private Map<String, String> siteUrls = new HashMap<String, String>();
    private ExtensionAlert extAlert = null;
    private ExtensionHUD extension;

	private static final String OTHER_FILE = "file";
	private static final String OTHER_IMAGE = "image";

	private static final String HUD_DATA = "hudData";

	private static final String ACTION_ENABLE_TIMELINE = "enableTimeline";
	private static final String ACTION_DISABLE_TIMELINE = "disableTimeline";

	private static final String PARAM_NAME = "name";
	private static final String PARAM_URL = "url";
	private static final String PARAM_ISWORKER = "isworker";

    private boolean isTimelineEnabled = false;

    private static Logger logger = Logger.getLogger(HudAPI.class);
    
    public HudAPI(ExtensionHUD extension) {
    	this.extension = extension;

    	this.addApiView(new ApiView(HUD_DATA, new String[] {PARAM_URL}));

    	this.addApiAction(new ApiAction(ACTION_ENABLE_TIMELINE));
    	this.addApiAction(new ApiAction(ACTION_DISABLE_TIMELINE));
    	
    	// TODO check its really safe to not require the key for files as we will need to inject it into them :/
    	this.addApiOthers(new ApiOther(OTHER_FILE, new String[] {PARAM_NAME}, new String[] {PARAM_URL}, false));
    	this.addApiOthers(new ApiOther(OTHER_IMAGE, new String[] {PARAM_NAME}, false));
    }

	@Override
	public String getPrefix() {
		return PREFIX;
	}
	
	public String getUrlPrefix(String site) {
		String url = this.siteUrls.get(site);
		if (url == null) {
			url = API.getInstance().getCallBackUrl(this, site.toString()); 
			this.siteUrls.put(site, url);
		}
		return url;
	}
	
	public void reset() {
		this.siteUrls.clear();
	}
	
	private ExtensionAlert getExtAlert() {
		if (extAlert == null) {
			extAlert = (ExtensionAlert) Control.getSingleton().getExtensionLoader().getExtension(ExtensionAlert.NAME);
		}
		return extAlert;
	}

	public boolean isTimelineEnabled() {
		return this.isTimelineEnabled;
	}

    @Override
	public String handleCallBack(HttpMessage msg)  throws ApiException {
    	try {
			String query = msg.getRequestHeader().getURI().getPathQuery();
			logger.debug("callback query = " + query);
			if (query != null) {
				if (query.indexOf("zapfile=") > 0) {
					String file = query.substring(query.indexOf("zapfile=") + 8);
					// This is on the target domain so dont inject the key
			    	msg.setResponseBody(extension.getFile(msg, file, false));
			    	msg.getResponseHeader().setContentLength(msg.getResponseBody().length());
			    	return msg.getResponseBody().toString();
				} else if (query.indexOf("zapimage=") > 0) {
					String file = query.substring(query.indexOf("zapimage=") + 9);
					
			    	msg.setResponseBody(extension.getImage(file));
			    	msg.getResponseHeader().setContentLength(msg.getResponseBody().length());
			    	
			    	return msg.getResponseBody().toString();
				} else if (query.indexOf("zapalerts") > 0) {
					SiteNode parent = Model.getSingleton().getSession().getSiteTree().findClosestParent(msg);
					if (parent != null) {
						// find the top level node
						while (!((SiteNode)parent.getParent()).isRoot()) {
							parent = (SiteNode)parent.getParent();
						}
						int [] alertTotals = new int[4];
						for (Alert alert : parent.getAlerts() ) {
							alertTotals[alert.getRisk()]++;
						}
						// {"result":true,"count":1}
						StringBuilder sb = new StringBuilder();
						sb.append("{\"high\":");
						sb.append(alertTotals[Alert.RISK_HIGH]);
						sb.append(",\"medium\":");
						sb.append(alertTotals[Alert.RISK_MEDIUM]);
						sb.append(",\"low\":");
						sb.append(alertTotals[Alert.RISK_LOW]);
						sb.append(",\"info\":");
						sb.append(alertTotals[Alert.RISK_INFO]);
						sb.append("}");
						String body = sb.toString();
						System.out.println("SBSB returning " + body);
				    	msg.setResponseBody(body);
				    	msg.getResponseHeader().setContentLength(msg.getResponseBody().length());
				    	msg.getResponseHeader().setHeader(HttpHeader.CONTENT_TYPE, "application/json; charset=utf-8");
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
				while (!((SiteNode)parent.getParent()).isRoot()) {
					parent = (SiteNode)parent.getParent();
				}
				@SuppressWarnings("unchecked")
				Map<String, Integer>[] alertCounts = new HashMap[4]; 
				for (Alert alert : parent.getAlerts() ) {
					Map<String, Integer> alertCount = alertCounts[alert.getRisk()];
					if (alertCount == null) {
						alertCount = new HashMap<String, Integer>();
						alertCounts[alert.getRisk()] = alertCount;
					}
					int count = 0;
					if (alertCount.containsKey(alert.getAlert())) {
						count = alertCount.get(alert.getAlert());
					}
					count++;
					alertCount.put(alert.getAlert(), count);

					// site alerts
					Map<String, String> alertAtts = new HashMap<String, String>();
					alertAtts.put("alert", alert.getAlert());
					alertAtts.put("risk", Alert.MSG_RISK[alert.getRisk()]);
					alertAtts.put("param", alert.getParam());
					alertAtts.put("id", Integer.toString(alert.getAlertId()));
					summary.add(alertAtts);
				}
				for (int i=0; i < alertCounts.length; i++) {
					// loop through info, low, medium, high
					Map<String, Integer> alertCount = alertCounts[i];
					if (alertCount != null) {
						for (Map.Entry<String, Integer>alert : alertCount.entrySet()) {
							// Loop through the alert counts for each level
							Map<String, String> alertAtts = new HashMap<String, String>();
							alertAtts.put("alert", alert.getKey());
							alertAtts.put("risk", Alert.MSG_RISK[i]);
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
				//ApiResponseList pageAlerts = new ApiResponseList("pageAlerts");
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
								alertAtts.put("alert", alert.getAlert());
								alertAtts.put("risk", Alert.MSG_RISK[alert.getRisk()]);
								alertAtts.put("param", alert.getParam());
								alertAtts.put("id", Integer.toString(alert.getAlertId()));
								//pageAlerts.addItem(new ApiResponseSet("alert", alertAtts));
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
				scopeData.addItem(new ApiResponseSet("scope", scopeAtts));
				scopeData.addItem(new ApiResponseSet("attack", scopeAtts));
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
				spiderData.addItem(new ApiResponseSet("spider", spiderAtts));
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
				ascanData.addItem(new ApiResponseSet("ascan", ascanAtts));
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

		result = new ApiResponseSet(name, resultMap);
		return result;
	}

	@Override
	public HttpMessage handleApiOther(HttpMessage msg, String name,
			JSONObject params) throws ApiException {

		if (OTHER_FILE.equals(name)) {
			
			String fileName = this.getParam(params, PARAM_NAME, "");
			// This is on the ZAP domain
			String file = extension.getFile(msg, fileName, true);
			String url = this.getParam(params, PARAM_URL, "");
			if (url.length() > 0) {
				file.replace("<<URL>>", url);
			}
			try {
				if (fileName.toLowerCase().endsWith(".css")) {
					msg.setResponseHeader(API.getDefaultResponseHeader("text/css; charset=UTF-8", 0, false));
				} else if (fileName.toLowerCase().endsWith(".js")) {
					msg.setResponseHeader(API.getDefaultResponseHeader("application/javascript; charset=UTF-8", 0, false));
				} else {
					msg.setResponseHeader(getAllowFramingResponseHeader("200 OK", "text/html; charset=UTF-8", 0, false));
				}
				
				if (!fileName.equals("inject.js")) {
					//todo: commented for mozilla 52 bug with jquery
					//msg.getResponseHeader().addHeader("Content-Security-Policy", CSP_POLICY);
				}

				if (fileName.equals("serviceworker.js")) {
					msg.setResponseHeader(API.getDefaultResponseHeader("application/javascript; charset=UTF-8", 0, false));
				}
				
				msg.setResponseBody(file);
				msg.getResponseHeader().setContentLength(msg.getResponseBody().length());
			} catch (HttpMalformedHeaderException e) {
				throw new ApiException (ApiException.Type.INTERNAL_ERROR, msg.getRequestHeader().getURI().toString());
			}

			return msg;
		} else if (OTHER_IMAGE.equals(name)) {
				
			byte[] image = extension.getImage(this.getParam(params, PARAM_NAME, ""));
			try {
				msg.setResponseHeader(API.getDefaultResponseHeader("image/png", 0, true));
				msg.setResponseBody(image);
				msg.getResponseHeader().setContentLength(msg.getResponseBody().length());
			} catch (HttpMalformedHeaderException e) {
				throw new ApiException (ApiException.Type.INTERNAL_ERROR, msg.getRequestHeader().getURI().toString());
			}
			return msg;
		} else if (this.getParam(params, PARAM_ISWORKER, "").equals("true")) {
			String fileName = this.getParam(params, PARAM_NAME, "");
			String file = extension.getFile(msg, fileName, true);

			try {
				msg.setResponseHeader(API.getDefaultResponseHeader("application/javascript; charset=UTF-8", 0, false));

				msg.setResponseBody(file);
				msg.getResponseHeader().setContentLength(msg.getResponseBody().length());
			} catch (HttpMalformedHeaderException e) {
				throw new ApiException (ApiException.Type.INTERNAL_ERROR, msg.getRequestHeader().getURI().toString());
			}

			return msg;
		} else {
			throw new ApiException(ApiException.Type.BAD_OTHER);
		}
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