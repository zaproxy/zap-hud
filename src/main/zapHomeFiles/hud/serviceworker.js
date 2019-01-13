// Injected strings
var ZAP_HUD_FILES = '<<ZAP_HUD_FILES>>';
var ZAP_HUD_WS = '<<ZAP_HUD_WS>>';
var ZAP_HUD_FILES = '<<ZAP_HUD_FILES>>';
var toolScripts = [
	'<<ZAP_HUD_TOOLS>>'
];

importScripts(ZAP_HUD_FILES + "?name=libraries/localforage.min.js"); 
importScripts(ZAP_HUD_FILES + "?name=libraries/vue.js"); 
importScripts(ZAP_HUD_FILES + "?name=libraries/vue-i18n.js"); 
importScripts(ZAP_HUD_FILES + "?name=i18n.js");
importScripts(ZAP_HUD_FILES + "?name=utils.js");
importScripts(ZAP_HUD_FILES + "?name=tools/utils/alertUtils.js");

var CACHE_NAME = "hud-cache-1.0";
var targetUrl = "";
var webSocket;

var urlsToCache = [
	ZAP_HUD_FILES + "?name=libraries/localforage.min.js",
	ZAP_HUD_FILES + "?name=libraries/vue.js",
	ZAP_HUD_FILES + "?name=libraries/vue-i18n.js",
	ZAP_HUD_FILES + "?name=i18n.js",
	ZAP_HUD_FILES + "?name=utils.js",
	ZAP_HUD_FILES + "?name=panel.html",
	ZAP_HUD_FILES + "?name=panel.css",
	ZAP_HUD_FILES + "?name=panel.js",
	ZAP_HUD_FILES + "?name=display.css",
	ZAP_HUD_FILES + "?name=display.html",
	ZAP_HUD_FILES + "?name=display.js",
	ZAP_HUD_FILES + "?name=management.css",
	ZAP_HUD_FILES + "?name=management.html",
	ZAP_HUD_FILES + "?name=management.js",
	ZAP_HUD_FILES + "?name=growlerAlerts.html",
	ZAP_HUD_FILES + "?name=growlerAlerts.js"
];

self.tools = {};

localforage.setItem("tools", [])
	.then(() => {
		// load tool scripts
		toolScripts.forEach(script => {
			importScripts(script); 
		});
	})
	.then(() => {
		// save tool list to indexeddb
		var ts = [];
		for (var tool in self.tools) {
			ts.push(self.tools[tool].name);
		}
		return utils.registerTools(ts); 

	})
	.catch(utils.errorHandler);

const onInstall = event => {
	utils.log(LOG_INFO, 'serviceworker.install', 'Installing...');

	// Cache Files
	// not sure caching in service worker provides advantage over browser - may be able to remove
	event.waitUntil(
		caches.open(CACHE_NAME)
			.then(cache => {
				return cache.addAll(urlsToCache);
			})
			.catch(utils.errorHandler)
	);
};

const onActivate = event => {
	// Check Storage & Initiate
	event.waitUntil(
		utils.isHUDInitialized()
			.then(isInitialized => {
				if (!isInitialized) {
					return utils.initializeHUD();
				}
			})
			.catch(utils.errorHandler)
	);
};

// if we remove cache we can remove this as well
const onFetch = event => {

	event.respondWith(
		caches.match(event.request)
			.then(response => {  

				if (response) {
					return response;
				}
				else {
					return fetch(event.request);
				}
			}).catch(utils.errorHandler)
	);
};

const onMessage = event => {
	if (!utils.isFromTrustedOrigin(event)) {
		return;
	}

	var message = event.data;

	switch(message.action) {
		case "buttonClicked":
			if (message.buttonLabel === "add-tool") {
				showAddToolDialog(message.tabId, message.frameId);
			}
			break;

		case "showHudSettings":
			showHudSettings(message.tabId);
			break;

		case 'targetload':

			let targetDomain = utils.parseDomainFromUrl(message.targetUrl);

			let e = new CustomEvent('targetload', {detail: {tabId: message.tabId, url: message.targetUrl, domain: targetDomain}});
			self.dispatchEvent(e);	

			break;

		case "heartbeat":
			webSocket.send('{ "component" : "hud", "type" : "view", "name" : "heartbeat" }');
			break;

		default:
			break;
	}
};

self.addEventListener("install", onInstall); 
self.addEventListener("activate", onActivate);
self.addEventListener("fetch", onFetch);
self.addEventListener("message", onMessage);
self.addEventListener('error', utils.errorHandler);

/* Set up WebSockets */

webSocket = new WebSocket(ZAP_HUD_WS);

webSocket.onopen = function (event) {
	// Basic test
	webSocket.send('{ "component" : "core", "type" : "view", "name" : "version" }'); 
	// Tools should register for alerts via the registerForWebSockerEvents function - see the break tool
};

webSocket.onmessage = function (event) {
	// Rebroadcast for the tools to pick up
	let jevent = JSON.parse(event.data);

	if ('event.publisher' in jevent) {
		utils.log(LOG_DEBUG, 'serviceworker.webSocket.onmessage', jevent['event.publisher']);
		var ev = new CustomEvent(jevent['event.publisher'], {detail: jevent});
		self.dispatchEvent(ev);
	}
};

webSocket.onerror = function (event) {
	utils.log(LOG_ERROR, 'websocket', '', event);
};

function registerForZapEvents(publisher) {
	webSocket.send('{"component" : "event", "type" : "register", "name" : "' + publisher + '"}');
};

function showAddToolDialog(tabId, frameId) {
	var config = {};

	utils.loadAllTools()
		.then(tools => {
			tools = tools.filter(tool => !tool.isSelected);
			tools = tools.filter(tool => !tool.isHidden);
	
			tools = tools.map(tool => ({
                'label': tool.label,
                'image': ZAP_HUD_FILES + '?image=' + tool.icon,
                'toolname': tool.name
            }));

			return tools;
		})
		.then(tools => {
			config.tools = tools;

			return utils.messageFrame(tabId, "display", {action: "showAddToolList", config: config})
		})
		.then(response => {
			utils.addToolToPanel(response.toolname, frameId);
		})
		.catch(utils.errorHandler);
};

function showHudSettings(tabId) {
	var config = {};
	config.settings = {
		initialize: I18n.t("settings_resets"),
	};

	utils.messageFrame(tabId, "display", {action: "showHudSettings", config: config})
		.then(response => {
			if (response.id === "initialize") {
				resetToDefault();
			}
		})
		.catch(utils.errorHandler);
};

function resetToDefault() {
	utils.initializeHUD()
		.then(utils.loadAllTools)
		.then(tools => {
			var promises = [];

			for (var tool in tools) {
				promises.push(self.tools[tools[tool].name].initialize());
			}

			return Promise.all(promises);
		})
		.then(utils.messageAllTabs("management", {action: "refreshTarget"}))
		.catch(utils.errorHandler);
};
