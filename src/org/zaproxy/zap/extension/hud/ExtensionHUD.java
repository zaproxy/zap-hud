/*
 * Zed Attack Proxy (ZAP) and its related class files.
 * 
 * ZAP is an HTTP/HTTPS proxy for assessing web application security.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"); 
 * you may not use this file except in compliance with the License. 
 * You may obtain a copy of the License at 
 * 
 *   http://www.apache.org/licenses/LICENSE-2.0 
 *   
 * Unless required by applicable law or agreed to in writing, software 
 * distributed under the License is distributed on an "AS IS" BASIS, 
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. 
 * See the License for the specific language governing permissions and 
 * limitations under the License. 
 */
package org.zaproxy.zap.extension.hud;

import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.file.Files;

import javax.swing.ImageIcon;

import java.util.regex.Pattern;
import java.util.regex.Matcher;
import java.util.Arrays;

import org.apache.commons.httpclient.URIException;
import org.apache.commons.io.IOUtils;
import org.apache.log4j.Logger;
import org.parosproxy.paros.Constant;
import org.parosproxy.paros.core.proxy.ProxyListener;
import org.parosproxy.paros.extension.ExtensionAdaptor;
import org.parosproxy.paros.extension.ExtensionHook;
import org.parosproxy.paros.model.Model;
import org.parosproxy.paros.network.HttpMessage;
import org.parosproxy.paros.view.View;
import org.zaproxy.zap.extension.api.API;
import org.zaproxy.zap.view.ZapToggleButton;

/*
 * An example ZAP extension which adds a top level menu item. 
 * 
 * This class is defines the extension.
 */
public class ExtensionHUD extends ExtensionAdaptor implements ProxyListener {

	// The name is public so that other extensions can access it
	public static final String NAME = "ExtensionHUD";
	
	// The i18n prefix, by default the package name - defined in one place to make it easier
	// to copy and change this example
	protected static final String PREFIX = "hud";

	private static final String RESOURCE = "/org/zaproxy/zap/extension/hud/resources";
	
	private static final ImageIcon ICON = new ImageIcon(
			ExtensionHUD.class.getResource( RESOURCE + "/radar.png"));

	protected static final String FILE_PREFIX = "hud/";
	protected static final String HUD_HTML = "injectionHtml.html";
	//protected static final String HUD_HTML = "zap-hud.html";
	//protected static final String JQUERY_JS = "jquery-1.11.2.min.js";
	//protected static final String PNOTIFY_CSS = "pnotify.custom.min.css";
	//protected static final String PNOTIFY_JS = "pnotify.custom.min.js";
	
	private HudAPI api = new HudAPI(this);

	private Logger log = Logger.getLogger(this.getClass());

	private ZapToggleButton hudButton = null;
	private boolean hudEnabled = false;
	private boolean isFirstRequest = true;

	/**
	*
	*/
	public ExtensionHUD() {
		super();
			initialize();
	}

	/**
	 * @param name
	 */
	public ExtensionHUD(String name) {
		super(name);
	}

	/**
	 * This method initializes this
	 * 
	 */
	private void initialize() {
        this.setName(NAME);
	}
	
	@Override
	public void hook(ExtensionHook extensionHook) {
		super.hook(extensionHook);
	    
		API.getInstance().registerApiImplementor(this.api);

	    if (getView() != null) {
			View.getSingleton().addMainToolbarButton(getHudButton());
	    }

	    // No reason this cant be used in daemon mode ;)
	    extensionHook.addProxyListener(this);

	}
	
    private ZapToggleButton getHudButton() {
    	if (hudButton == null) {
    		hudButton = new ZapToggleButton(ICON);
    		hudButton.setSelectedToolTipText(Constant.messages.getString("hud.toolbar.button.on.tooltip"));
    		hudButton.setToolTipText(Constant.messages.getString("hud.toolbar.button.off.tooltip"));
    		hudButton.addActionListener(new ActionListener() {
				@Override
				public void actionPerformed(ActionEvent e) {
					hudEnabled = hudButton.isSelected();
				}});
    	}
    	return hudButton;
    }


	@Override
	public String getAuthor() {
		return Constant.ZAP_TEAM;
	}

	@Override
	public String getDescription() {
		return Constant.messages.getString(PREFIX + ".desc");
	}

	@Override
	public URL getURL() {
		try {
			return new URL(Constant.ZAP_EXTENSIONS_PAGE);
		} catch (MalformedURLException e) {
			return null;
		}
	}

	@Override
	public int getArrangeableListenerOrder() {
		// TODO Auto-generated method stub
		return 0;
	}

	@Override
	public boolean onHttpRequestSend(HttpMessage msg) {
		// Do nothing
		return true;
	}
	
	private String getSite(HttpMessage msg) throws URIException {
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

	@Override
	public boolean onHttpResponseReceive(HttpMessage msg) {
		if (hudEnabled && msg.getResponseHeader().isHtml()) {
			try {
				String header = msg.getResponseBody().toString();

				//todo: confirm correct regex
				Pattern pattern = Pattern.compile("<(\\s*?)body+(>|.*?[^?]>)");
				int openBodyTag = regexEndOf(pattern, header.toLowerCase());

				String hudScript = "";
				String contents = this.getFile(msg, HUD_HTML, false);
				String[] lines = contents.split("\\r?\\n");

				if (isFirstRequest) {
					hudScript = String.join("", Arrays.copyOfRange(lines, 0, 8));

					isFirstRequest = false;
				} else {
					hudScript = lines[0] + String.join("", Arrays.copyOfRange(lines, 9, lines.length));
				}

				if (openBodyTag > -1  && hudScript != null) {
					System.out.println(msg.getRequestHeader().getURI() + 
							" orig clen " + msg.getResponseHeader().getContentLength() + 
							" body len " + msg.getResponseBody().length() + " charset " + msg.getResponseBody().getCharset());

					hudScript = hudScript
									.replace("<<FILE_PREFIX>>", api.getUrlPrefix(getSite(msg)))
									.replace("<<URL>>", msg.getRequestHeader().getURI().toString());
					
					
					StringBuilder sb = new StringBuilder();
					sb.append(header.substring(0, openBodyTag));
					sb.append(hudScript);
					sb.append(header.substring(openBodyTag));

					String newBody = sb.toString();
					msg.getResponseBody().setBody(newBody);
					msg.getResponseHeader().setContentLength(msg.getResponseBody().length());
				}
			} catch (Exception e) {
				log.error(e.getMessage(), e);
			}
		}
		return true;
	}
	
	protected String getFile (HttpMessage msg, String file, boolean incApiKey) {
		// TODO cache? Or rely on browser caching?
		try {
			File f = new File(Constant.getZapHome(), FILE_PREFIX + file);
			if (! f.exists()) {
				log.error("No such file " + f.getAbsolutePath());
				return null;
			}
			// Quick way to read a small text file
			String contents = new String(Files.readAllBytes(f.toPath()));
			contents = contents.
					replace("<<FILE_PREFIX>>", api.getUrlPrefix(getSite(msg))).
					replace("<<ZAP_HUD_API>>", API.API_URL_S);
			
			if (incApiKey) {
				//todo: this is currenty broken
				//String apiKey = Model.getSingleton().getOptionsParam().getApiParam().getKey();
				String apiKey = "1234";
				contents = contents.replace("<<ZAP_HUD_API_KEY>>", apiKey);
			}
			
			return contents;
		} catch (Exception e) {
			// Something unexpected went wrong, write the error to the log
			log.error(e.getMessage(), e);
			return null;
		}
	}

	protected byte[] getImage (String name) {
		// TODO cache? And support local files
		try {
			InputStream is = this.getClass().getResourceAsStream(RESOURCE + "/" + name);
			if (is == null) {
				log.error("No such resource: " + name);
				return null;
			}
			ByteArrayOutputStream bos = new ByteArrayOutputStream();
			IOUtils.copy(is, bos);
	    	return bos.toByteArray();
		} catch (Exception e) {
			// Something unexpected went wrong, write the error to the log
			log.error(e.getMessage(), e);
			return null;
		}
	}

    /** @return index of pattern in s or -1, if not found */
	public static int regexEndOf(Pattern pattern, String s) {
	    Matcher matcher = pattern.matcher(s);
	    return matcher.find() ? matcher.end() : -1;
	}
}