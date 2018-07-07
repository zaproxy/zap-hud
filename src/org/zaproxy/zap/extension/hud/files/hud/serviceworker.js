importScripts("<<ZAP_HUD_FILES>>?name=libraries/localforage.min.js"); 
importScripts("<<ZAP_HUD_FILES>>?name=utils.js");
importScripts("<<ZAP_HUD_FILES>>?name=tools/alertUtils.js");

var CACHE_NAME = "hud-cache-1.0";

var targetDomain = "";
var targetUrl = "";

var isDebugging = true;
var sharedData = {};

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
	"<<ZAP_HUD_FILES>>?name=growlerAlerts.js"
];

var toolScripts = [
<<ZAP_HUD_TOOLS>>
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
	log(LOG_INFO, 'serviceworker.install', 'Installing...');

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

				if (response) {
					// save the frame id as a destination for postmesssaging later
					if (event.request.url.endsWith(".js")) {
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
			
		case 'targetload':

			targetDomain = parseDomainFromUrl(message.targetUrl);
			targetUrl = message.targetUrl;

			let e = new CustomEvent('targetload', {detail: {url: message.targetUrl}});
			self.dispatchEvent(e);	
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
	webSocket.send('{ "component" : "core", "type" : "view", "name" : "version" }'); 
	// Tools should register for alerts via the registerForWebSockerEvents function - see the break tool
};

webSocket.onmessage = function (event) {
	// Rebroadcast for the tools to pick up
	let jevent = JSON.parse(event.data);
	if ('event.publisher' in jevent) {
		log(LOG_DEBUG, 'serviceworker.webSocket.onmessage', jevent['event.publisher']);
		var ev = new CustomEvent(jevent['event.publisher'], {detail: jevent});
		self.dispatchEvent(ev);
	}
}

function registerForZapEvents(publisher) {
	webSocket.send('{"component" : "event", "type" : "register", "name" : "' + publisher + '"}');
}

/*
 * Saves the clientId of a window which is used to send postMessages.
 */
function saveFrameId(event) {

	let frameNames = {
		"management.html": "management",
		"panel.html": "Panel",
		"display.html": "display",
		"growlerAlerts.html": "growlerAlerts",
		"drawer.html": "drawer"
	};

	clients.get(event.clientId)
		.then(function(client) {
			let params = new URL(client.url).searchParams;

			let key = frameNames[params.get('name')];

			if (key === "Panel") {
				key = params.get('orientation') + key;
			}

			loadFrame(key)
				.then(function(frame) {
					frame.clientId = client.id;

					return saveFrame(frame);
				})
				.catch(errorHandler);
		})
		.catch(errorHandler);
}

function showAddToolDialog(panelKey) {
	var config = {};

	loadAllTools()
		.then(function(tools) {

			// filter out unselected tools
			tools = tools.filter(tool => !tool.isSelected);
			// filter out hidden tools
			tools = tools.filter(tool => !tool.isHidden);
	
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
			var promises = [];

			for (var tool in tools) {
				promises.push(self.tools[tools[tool].name].initialize());
			}

			return Promise.all(promises)
		})
		.then(messageFrame("management", {action: "refreshTarget"}))
		.catch(errorHandler);
}