package org.zaproxy.zap.extension.hud;

import java.util.Enumeration;
import java.util.HashMap;
import java.util.List;
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
import org.zaproxy.zap.extension.api.ApiView;
import org.zaproxy.zap.extension.ascan.ActiveScan;
import org.zaproxy.zap.extension.ascan.ExtensionActiveScan;
import org.zaproxy.zap.extension.spider.ExtensionSpider;
import org.zaproxy.zap.extension.spider.SpiderScan;

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

	private static final String PARAM_NAME = "name";
	private static final String PARAM_URL = "url";

    private static Logger logger = Logger.getLogger(HudAPI.class);
    
    public HudAPI(ExtensionHUD extension) {
    	this.extension = extension;

    	this.addApiView(new ApiView(HUD_DATA, new String[] {PARAM_URL}));
    	
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

		if (HUD_DATA.equals(name)) {
			result = new ApiResponseList(name);
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
				ApiResponseList siteSummary = new ApiResponseList("siteSummary");

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
							siteSummary.addItem(new ApiResponseSet("alert", alertAtts));
						}
					}
				}
				((ApiResponseList)result).addItem(siteSummary);
			}
			if (node != null) {
				// Loop through siblings to find nodes for the same url
				ApiResponseList pageAlerts = new ApiResponseList("pageAlerts");
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
								pageAlerts.addItem(new ApiResponseSet("alert", alertAtts));
							}
						}
					}
				}
				((ApiResponseList)result).addItem(pageAlerts);

				// Report on scope
				ApiResponseList scopeData = new ApiResponseList("scope");
				Map<String, String> scopeAtts = new HashMap<String, String>();
				scopeAtts.put("inscope", Boolean.toString(node.isIncludedInScope()));
				scopeAtts.put("attack", Boolean.toString(Control.getSingleton().getMode().equals(Control.Mode.attack)));
				scopeData.addItem(new ApiResponseSet("scope", scopeAtts));
				scopeData.addItem(new ApiResponseSet("attack", scopeAtts));
				((ApiResponseList)result).addItem(scopeData);
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
				((ApiResponseList)result).addItem(spiderData);
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
				((ApiResponseList)result).addItem(ascanData);
			}

			// TODO hacking break...
			/* Looks like it will require a load of core changes :/
			ExtensionBreak extBrk = (ExtensionBreak) Control.getSingleton().getExtensionLoader().getExtension("ExtensionBreak");
			if (extBrk != null) {
				ApiResponseList breakData = new ApiResponseList("break");
				Map<String, String> scopeAtts = new HashMap<String, String>();
				extBrk.getBreakPanel().is.breakpointHit();
				scopeAtts.put("inscope", Boolean.toString(node.isIncludedInScope()));
				scopeAtts.put("attack", Boolean.toString(Control.getSingleton().getMode().equals(Control.Mode.attack)));
				breakData.addItem(new ApiResponseSet("scope", scopeAtts));
				breakData.addItem(new ApiResponseSet("attack", scopeAtts));
				((ApiResponseList)result).addItem(breakData);
				
			}
			*/
			
		} else {
			throw new ApiException(ApiException.Type.BAD_VIEW);
		}

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
					msg.setResponseHeader(API.getDefaultResponseHeader("text/css; charset=UTF-8"));
				} else if (fileName.toLowerCase().endsWith(".js")) {
                    msg.setResponseHeader(API.getDefaultResponseHeader("application/javascript; charset=UTF-8"));
				} else {
					msg.setResponseHeader(getAllowFramingResponseHeader(
							"200 OK", "text/html; charset=UTF-8", 0, false));
				}
				if (!fileName.equals("zapHudInjectScript.js")) {
					msg.getResponseHeader().addHeader("Content-Security-Policy", CSP_POLICY);
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
				msg.setResponseHeader(API.getDefaultResponseHeader("image/png"));
				msg.setResponseBody(image);
				msg.getResponseHeader().setContentLength(msg.getResponseBody().length());
			} catch (HttpMalformedHeaderException e) {
				throw new ApiException (ApiException.Type.INTERNAL_ERROR, msg.getRequestHeader().getURI().toString());
			}
			return msg;
		} else {
			throw new ApiException(ApiException.Type.BAD_OTHER);
		}
	}

    public static String getAllowFramingResponseHeader(String responseStatus, String contentType, int contentLength, boolean canCache) {
        StringBuilder sb = new StringBuilder(250);

        sb.append("HTTP/1.1 ").append(responseStatus).append("\r\n");
        if (! canCache) {
        	sb.append("Pragma: no-cache\r\n");
        	sb.append("Cache-Control: no-cache\r\n");
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
