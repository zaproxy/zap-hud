importScripts("<<ZAP_HUD_API>>OTHER/hud/other/file/?name=libraries/localforage.min.js"); 
importScripts("<<ZAP_HUD_API>>OTHER/hud/other/file/?name=utils.js");

var CACHE_NAME = "hud-cache-1.0";
var BUTTON_LIST_HTML = '<div class="buttons-list">';
var PARAM_ORIENATATION = "orientation";
var PARAM_URL = "url";
var ORIENTATION = /ORIENTATION/g;

var isDebugging = true;

var urlsToCache = [
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=libraries/jquery-1.12.0.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=libraries/jquery-ui.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=libraries/jquery-ui.css",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=libraries/jquery-ui.theme.css",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=libraries/localforage.min.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=utils.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=panel.html",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=panel.css",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=panel.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=main.css",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=main.html",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=main.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=management.css",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=management.html",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=management.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=timelinePane.css",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=timelinePane.html",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=timelinePane.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=growlerAlerts.html",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=growlerAlerts.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/image/?name=ui-bg_glass_75_79c9ec_1x400.png",
	"<<ZAP_HUD_API>>OTHER/hud/other/image/?name=ui-bg_inset-hard_100_fcfdfd_1x100.png",
	"<<ZAP_HUD_API>>OTHER/hud/other/image/?name=ui-icons_0078ae_256x240.png",
	"<<ZAP_HUD_API>>OTHER/hud/other/image/?name=ui-icons_056b93_256x240.png",
	"<<ZAP_HUD_API>>OTHER/hud/other/image/?name=ui-icons_e0fdff_256x240.png",
	"<<ZAP_HUD_API>>OTHER/hud/other/image/?name=ui-icons_f5e175_256x240.png",
	"<<ZAP_HUD_API>>OTHER/hud/other/image/?name=ui-bg_highlight-soft_45_0078ae_1x100.png",
	"<<ZAP_HUD_API>>OTHER/hud/other/image/?name=ui-bg_highlight-soft_75_2191c0_1x100.png",
];

var toolScripts = [
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=tools/scope.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=tools/spider.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=tools/timeline.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=tools/activeScan.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=tools/pageAlerts.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=tools/siteAlerts.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=tools/break.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=tools/attack.js"
];

self.tools = {};

// Load Tool Scripts
localforage.setItem("tools", []).then(function() {
	toolScripts.forEach(function(script) {
		importScripts(script); 
	});
}).then(function(){
	var ts = [];
	for (var tool in self.tools) {
		ts.push(self.tools[tool].name);
	}
	registerTools(ts); 

});

/* Listeners */
self.addEventListener("install", function(event) {
	console.log("installing...");

	// Cache Files
	event.waitUntil(
		caches.open(CACHE_NAME).then(function(cache) {
			console.log("caching urls...");
			return cache.addAll(urlsToCache);
		})
	);
}); 

self.addEventListener("activate", function(event) {
	// Check Storage & Initiate
	event.waitUntil(
		isStorageConfigured().then(function(isConfigured) {
			// todo: maybe chain this instead
			if (!isConfigured || isDebugging) {
				configureStorage().then(function() {
					return setDefaultTools();
				});
			}
		}).catch(function(err) {
			console.log(Error(err));
		})
	);
});

self.addEventListener("fetch", function(event) {
	// Check Cache
	event.respondWith(
		caches.match(event.request).then(function(response) {  
			var reqUrl = event.request.url;

			if (reqUrl.startsWith("<<ZAP_HUD_API>>OTHER/hud/other/file/?name=panel.html")) {
				// Modify Panel HTML
				return handlePanelHtmlFetch(reqUrl);
			}
			else if (reqUrl.startsWith("<<ZAP_HUD_API>>OTHER/hud/other/file/?name=panel.css")) {
				// Modify Panel CSS
				return handlePanelCssFetch(reqUrl);
			}
			else if (reqUrl.startsWith("<<ZAP_HUD_API>>OTHER/hud/other/file/images/")) {
				var name = reqUrl.replace("file/images/", "image/?name=");

				return caches.match(name).then(function(response) {
					if (!response) {
						console.log("Could not find jquery images: " + name);
					}
				});
			}
			else if (response) {
				// Record Client ID
				if (reqUrl.endsWith(".js")) {
					saveFrameId(event);
				}

				return response;
			}
			else {
				return fetch(event.request);
			}
		}).catch(function() {
			console.log(Error("Could not handle response from: " + event.request.url));
			return "<html><body>Error: could not find page</body></html>";
		})
	);
});

self.addEventListener("message", function(event) {
	if (!isFromTrustedOrigin(event)) {
		return;
	}

	var message = event.data;

	switch(message.action) {
		case "buttonClicked":
			if (message.buttonLabel === "add-tool") {
				showAddToolDialog(message.panelKey);
			}
			break;

		case "showHudSettings":
			showHudSettings();
			break;
			
		case "onTargetLoad":
			onTargetLoad();
			break;

		default:
			break;
	}
});

function getParamater(url, parameter) {
	var start = url.indexOf(parameter) + parameter.length + 1;
	var end = url.indexOf("&", start);
	end = end == -1 ? url.length : end;

	return url.substring(start, end);
}

/* Fetch Methods */
function handlePanelHtmlFetch(reqUrl) {
	return caches.match("<<ZAP_HUD_API>>OTHER/hud/other/file/?name=panel.html").then(function(resp) {
		var orientation = getParamater(reqUrl, PARAM_ORIENATATION);
		var url = getParamater(reqUrl, PARAM_URL);

		return buildPanelHtml(resp, orientation, url);
	});
}

function handlePanelCssFetch(reqUrl) {
	return caches.match("<<ZAP_HUD_API>>OTHER/hud/other/file/?name=panel.css").then(function(resp) {
		var orientation = getParamater(reqUrl, PARAM_ORIENATATION);
		return buildPanelCss(resp, orientation);
	});
}

function saveFrameId(event) {
	clients.matchAll().then(function(clients) {
		clients.forEach(function(item) {
			var client = item;

			if (client.id === event.clientId) {
				if (client.url.endsWith("left")) {
					loadFrame("leftPanel").then(function(panel) {
						panel.clientId = client.id;
					
						saveFrame(panel);
					});
				}
				else if (client.url.endsWith("right")) {
					loadFrame("rightPanel").then(function(panel) {
						panel.clientId = client.id;
					
						saveFrame(panel);
					});
				}
				else if (client.url.endsWith("main.html")) {
					loadFrame("mainDisplay").then(function(panel) {
						panel.clientId = client.id;
					
						saveFrame(panel);
					});
				}
				else if (client.url.endsWith("management.html")) {
					loadFrame("management").then(function(frame) {
						frame.clientId = client.id;

						saveFrame(frame);
					});
				}
				else if (client.url.endsWith("timelinePane.html")) {
					loadFrame("timelinePane").then(function(frame) {
						frame.clientId = client.id;

						saveFrame(frame);
					});
				}
				else if (client.url.endsWith("growlerAlerts.html")) {
					loadFrame("growlerAlerts").then(function(frame) {
						frame.clientId = client.id;

						saveFrame(frame);
					});
				}
			}
		});
    });
}

function buildPanelHtml(response, orientation, url) {
	var key = orientation + "Panel";
	
	return loadPanelTools(key).then(function(tools) {
		// run onTargetLoad for any tools in the panel
		var promises = [];

		for (var tool in tools) {
			if (self.tools[tools[tool].name].onPanelLoad) {
				promises.push(self.tools[tools[tool].name].onPanelLoad({domain: parseDomainFromUrl(url), url: url}));
			}
		}

		return Promise.all(promises).then(function() {
			return loadPanelTools(key).then(function(tools) {

				return response.text().then(function(text) {
					var init = buildInit(response);
					var body = text.replace(ORIENTATION, orientation);

					// Last, AddTool Button
					var addToolButton = {name:"add-tool", label:"Add", icon:"plus.png"};
					body = addButtonToBody(body, addToolButton);

					// Add Each Tool
					tools.forEach(function(tool) {
						body = addButtonToBody(body, tool);
					});

					return new Response(body, init);
				}).catch(function(error) {
					console.log(Error("Could not get text for response. " + error));
				});
			});
		});
	}).catch(function(error) {
		console.log(Error(error))
	});
}

function buildPanelCss(response, orientation) {

	return response.text().then(function(text) {
		var init = buildInit(response);
		var body = text.replace(ORIENTATION, orientation);

		return new Response(body, init);
	}).catch(function(error) {
		console.log(Error("Could not get text for response. " + error));
	});
}

function buildInit(response) {
	var init = {
		status: response.status,
		statusText: response.statusText,
		headers: {}
	};

	response.headers.forEach(function(v,k) {
		init.headers[k] = v;
	});

	return init;
}
 
//todo: home made parsing for now
function addButtonToBody(body, tool) {
	var insertAt = body.indexOf(BUTTON_LIST_HTML) + BUTTON_LIST_HTML.length;

	var newBody = body.substring(0, insertAt) + configureButtonHtml(tool) + body.substring(insertAt, body.length);

	return newBody;
}

function onTargetLoad() {
	// anything to do when target loads goes here
}
 
function showAddToolDialog(panelKey) {
	var config = {};

	messageFrame("mainDisplay", {action: "showAddToolList", config: config}).then(function(response) {

		addToolToPanel(response.id, panelKey);
	});
}

function showHudSettings() {
	var config = {};
	config.settings = {
		initialize: "Reset Configurations to Default",
	};

	messageFrame("mainDisplay", {action: "showHudSettings", config: config}).then(function(response) {
		if (response.id === "initialize") {
			resetToDefault();
		}
	});
}

function resetToDefault() {
	loadAllTools().then(function(tools) {
		// run onTargetLoad for any tools in the panel
		var promises = [];

		for (var tool in tools) {
			promises.push(self.tools[tools[tool].name].initialize());
		}

		Promise.all(promises).then(function() {
			messageFrame("management", {action: "refreshTarget"});
		});
	}).catch(function(error) {
		console.log(Error(error));
	});
}
