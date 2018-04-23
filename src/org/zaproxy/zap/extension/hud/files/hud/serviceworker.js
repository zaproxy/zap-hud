importScripts("<<ZAP_HUD_FILES>>?name=libraries/localforage.min.js"); 
importScripts("<<ZAP_HUD_FILES>>?name=utils.js");
importScripts("<<ZAP_HUD_FILES>>?name=tools/alertUtils.js");

var CACHE_NAME = "hud-cache-1.0";
var BUTTON_LIST_HTML = '<div class="buttons-list">';
var PARAM_ORIENATATION = "orientation";
var PARAM_URL = "url";
var ORIENTATION = /ORIENTATION/g;

var isDebugging = true;

var webSocket;

var urlsToCache = [
	"<<ZAP_HUD_FILES>>?name=libraries/localforage.min.js",
	"<<ZAP_HUD_FILES>>?name=utils.js",
	"<<ZAP_HUD_FILES>>?name=panel.html",
	"<<ZAP_HUD_FILES>>?name=panel.css",
	"<<ZAP_HUD_FILES>>?name=panel.js",
	"<<ZAP_HUD_FILES>>?name=display.css",
	"<<ZAP_HUD_FILES>>?name=display.html",
	"<<ZAP_HUD_FILES>>?name=display.js",
	"<<ZAP_HUD_FILES>>?name=management.css",
	"<<ZAP_HUD_FILES>>?name=management.html",
	"<<ZAP_HUD_FILES>>?name=management.js",
	"<<ZAP_HUD_FILES>>?name=timelinePane.css",
	"<<ZAP_HUD_FILES>>?name=timelinePane.html",
	"<<ZAP_HUD_FILES>>?name=timelinePane.js",
	"<<ZAP_HUD_FILES>>?name=growlerAlerts.html",
	"<<ZAP_HUD_FILES>>?name=growlerAlerts.js",
];

var toolScripts = [
	"<<ZAP_HUD_FILES>>?name=tools/scope.js",
	"<<ZAP_HUD_FILES>>?name=tools/spider.js",
	"<<ZAP_HUD_FILES>>?name=tools/timeline.js",
	"<<ZAP_HUD_FILES>>?name=tools/activeScan.js",
	"<<ZAP_HUD_FILES>>?name=tools/pageAlerts.js",
	"<<ZAP_HUD_FILES>>?name=tools/pageAlertsHigh.js",
	"<<ZAP_HUD_FILES>>?name=tools/pageAlertsMedium.js",
	"<<ZAP_HUD_FILES>>?name=tools/pageAlertsLow.js",
	"<<ZAP_HUD_FILES>>?name=tools/pageAlertsInformational.js",
	"<<ZAP_HUD_FILES>>?name=tools/siteAlerts.js",
	"<<ZAP_HUD_FILES>>?name=tools/siteAlertsHigh.js",
	"<<ZAP_HUD_FILES>>?name=tools/siteAlertsMedium.js",
	"<<ZAP_HUD_FILES>>?name=tools/siteAlertsLow.js",
	"<<ZAP_HUD_FILES>>?name=tools/siteAlertsInformational.js",
	"<<ZAP_HUD_FILES>>?name=tools/break.js",
	"<<ZAP_HUD_FILES>>?name=tools/attack.js"
];

self.tools = {};

// Load Tool Scripts
localforage.setItem("tools", [])
	.then(function() {
		toolScripts.forEach(function(script) {
			importScripts(script); 
		});
	})
	.then(function(){
		var ts = [];
		for (var tool in self.tools) {
			ts.push(self.tools[tool].name);
		}
		return registerTools(ts); 

	})
	.catch(errorHandler);

/* Listeners */
self.addEventListener("install", function(event) {
	console.log("installing...");

	// Cache Files
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(function(cache) {
				console.log("caching urls...");
				return cache.addAll(urlsToCache);
			})
			.catch(errorHandler)
	);
}); 

self.addEventListener("activate", function(event) {
	// Check Storage & Initiate
	event.waitUntil(
		isStorageConfigured()
			.then(function(isConfigured) {

				if (!isConfigured || isDebugging) {
					return configureStorage();
				}
			})
			.then(function() {
				// set the default tools after configuring storage
				setDefaultTools();
			})
			.catch(errorHandler)
	);
});

self.addEventListener("fetch", function(event) {
	// Check Cache
	event.respondWith(
		caches.match(event.request)
			.then(function(response) {  
				var reqUrl = event.request.url;

				if (reqUrl.indexOf("zapCallBackUrl/images") > 0) {
					// Need to rewrite jquery image URLs
					var name = "<<ZAP_HUD_FILES>>?image=" + reqUrl.substring(reqUrl.lastIndexOf("/")+1);
					return caches.match(name).then(function(response) {
						if (!response) {
							console.log("Could not find jquery image: " + name);
						}
						return response;
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
			}).catch(errorHandler)
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

self.addEventListener('error', errorHandler);

/* Set up WebSockets */

webSocket = new WebSocket("<<ZAP_HUD_WS>>");

webSocket.onopen = function (event) {
	// Basic test
	webSocket.send("{ \"component\" : \"core\", \"type\" : \"view\", \"name\" : \"version\" }"); 
	// Register for alert events
	webSocket.send("{\"component\" : \"event\", \"type\" : \"register\", \"name\" : \"org.zaproxy.zap.extension.alert.AlertEventPublisher\"}");
	// Tools should register for alerts via the registerForWebSockerEvents function - see the break tool
};

webSocket.onmessage = function (event) {
	console.log("ServiceWorker received event: " + event.data);
	// Rebroadcast for the tools to pick up
	jevent = JSON.parse(event.data);
	if ('event.publisher' in jevent) {
		console.log("EventPublisher : " + jevent['event.publisher'])
		var ev = new CustomEvent(jevent['event.publisher'], {detail: jevent});
		self.dispatchEvent(ev);
	}
}

function registerForZapEvents(publisher) {
	webSocket.send("{\"component\" : \"event\", \"type\" : \"register\", \"name\" : \"" + publisher + "\"}");
}

/*
 * Saves the clientId of a window which is used to send postMessages.
 */
function saveFrameId(event) {
	clients.matchAll().then(function(clients) {
		clients.forEach(function(item) {
			let client = item;
			let clientId = event.clientId;

			// handles firefox bug with adding brackets to the event clientID
			if (clientId.indexOf('{') >= 0) {
				clientId = clientId.substring(1, clientId.length - 1);
			}

			if (client.id === clientId) {

				if (client.url.endsWith("left")) {
					loadFrame("leftPanel")
						.then(function(panel) {
							panel.clientId = client.id;
						
							return saveFrame(panel);
						})
						.catch(errorHandler);
				}
				else if (client.url.endsWith("right")) {
					loadFrame("rightPanel")
						.then(function(panel) {
							panel.clientId = client.id;
						
							return saveFrame(panel);
						})
						.catch(errorHandler);
				}
				else if (client.url.endsWith("display.html")) {
					loadFrame("display")
						.then(function(panel) {
							panel.clientId = client.id;
						
							return saveFrame(panel);
						})
						.catch(errorHandler);
				}
				else if (client.url.endsWith("management.html")) {
					loadFrame("management")
						.then(function(frame) {
							frame.clientId = client.id;

							return saveFrame(frame);
						})
						.catch(errorHandler);
				}
				else if (client.url.endsWith("timelinePane.html")) {
					loadFrame("timelinePane")
						.then(function(frame) {
							frame.clientId = client.id;

							return saveFrame(frame);
						})
						.catch(errorHandler);
				}
				else if (client.url.endsWith("growlerAlerts.html")) {
					loadFrame("growlerAlerts")
						.then(function(frame) {
							frame.clientId = client.id;

							return saveFrame(frame);
						})
						.catch(errorHandler);
				}
			}
		});
    });
}

function onTargetLoad() {
	// anything to do when target loads goes here
}
 
function showAddToolDialog(panelKey) {
	var config = {};

	loadAllTools()
		.then(function(tools) {

			// filter out unselected tools
			tools = tools.filter(tool => !tool.isSelected);
	
			// reformat for displaying in list
			tools = tools.map(function (tool) {
				return {'label': tool.label, 'image': '<<ZAP_HUD_FILES>>?image=' + tool.icon, 'toolname': tool.name};
			});

			return tools;
		})
		.then(function(tools) {
			// add tools to the config
			config.tools = tools;

			// display tools to select
			return messageFrame("display", {action: "showAddToolList", config: config})
		})
		.then(function(response) {
			addToolToPanel(response.toolname, panelKey);
		})
		.catch(errorHandler);
}

function showHudSettings() {
	var config = {};
	config.settings = {
		initialize: "Reset Configurations to Default",
	};

	messageFrame("display", {action: "showHudSettings", config: config})
		.then(function(response) {
			if (response.id === "initialize") {
				resetToDefault();
			}
		})
		.catch(errorHandler);
}

function resetToDefault() {
	configureStorage()
		.then(setDefaultTools)
		.then(loadAllTools)
		.then(function(tools) {
			// run onTargetLoad for any tools in the panel
			var promises = [];

			for (var tool in tools) {
				promises.push(self.tools[tools[tool].name].initialize());
			}

			return Promise.all(promises)
		})
		.then(messageFrame("management", {action: "refreshTarget"}))
		.catch(errorHandler);
}
