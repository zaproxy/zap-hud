// Injected strings
var ZAP_HUD_FILES = '<<ZAP_HUD_FILES>>';
var toolScripts = [
	'<<ZAP_HUD_TOOLS>>'
];
// The configured tools
var CONFIG_TOOLS_LEFT = '<<ZAP_HUD_CONFIG_TOOLS_LEFT>>';
var CONFIG_TOOLS_RIGHT = '<<ZAP_HUD_CONFIG_TOOLS_RIGHT>>';

importScripts(ZAP_HUD_FILES + "?name=libraries/localforage.min.js"); 
importScripts(ZAP_HUD_FILES + "?name=libraries/vue.js"); 
importScripts(ZAP_HUD_FILES + "?name=libraries/vue-i18n.js"); 
importScripts(ZAP_HUD_FILES + "?name=i18n.js");
importScripts(ZAP_HUD_FILES + "?name=utils.js");
importScripts(ZAP_HUD_FILES + "?name=tools/utils/alertUtils.js");

var CACHE_NAME = "hud-cache-1.0";
var targetUrl = "";
var webSocket;
var webSocketCallbacks = {};
var webSocketCallbackId = 0;

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

initWebSockets();

function initWebSockets() {
	/* Set up WebSockets */
	let ZAP_HUD_WS = '<<ZAP_HUD_WS>>';
	webSocket = new WebSocket(ZAP_HUD_WS);

	webSocket.onopen = function (event) {
		// Wont be able to log until ther websocket is set up
		utils.log(LOG_INFO, 'serviceworker.initWebSockets', 'Initialized');
		// Basic test
		webSocket.send('{ "component" : "core", "type" : "view", "name" : "version" }'); 

		apiCallWithResponse("hud", "view", "upgradedDomains")
		.then(response => {
			let upgradedDomains = {};

			for (const domain of response.upgradedDomains) {
				upgradedDomains[domain] = true;
			}
			return localforage.setItem('upgradedDomains', upgradedDomains);
		})
		.catch(utils.errorHandler);
	};

	webSocket.onmessage = function (event) {
		// Rebroadcast for the tools to pick up
		let jevent = JSON.parse(event.data);

		if ('event.publisher' in jevent) {
			utils.log(LOG_DEBUG, 'serviceworker.webSocket.onmessage', jevent['event.publisher']);
			var ev = new CustomEvent(jevent['event.publisher'], {detail: jevent});
			self.dispatchEvent(ev);
		} else if ('id' in jevent && 'response' in jevent) {
			let pFunctions = webSocketCallbacks[jevent['id']];
			let response = jevent['response'];
			if ('code' in response && 'message' in response) {
				// These always indicate a failure
				let error = new Error(I18n.t("error_with_message", [response['message']]));
				error.response = response;

				pFunctions.reject(error);
			} else {
				pFunctions.resolve(response);
			}
			delete webSocketCallbacks[jevent['id']];
		}
	};

	webSocket.onerror = function (event) {
		utils.log(LOG_ERROR, 'websocket', '', event);
	};
};

const onInstall = event => {
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
					return utils.initializeHUD(CONFIG_TOOLS_LEFT, CONFIG_TOOLS_RIGHT);
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
			apiCall("hud", "view", "heartbeat");
			break;

		case "zapApiCall":
			if (event.ports.length > 0) {
				apiCallWithResponse(message.component, message.type, message.name, message.params)
				.then (response => {
					event.ports[0].postMessage(response);
				})
				.catch(error => {
					event.ports[0].postMessage(error.response);
				});
			} else {
				apiCall(message.component, message.type, message.name, message.params);
			}
			break;
			
		default:
			utils.log(LOG_DEBUG, 'serviceworker.onMessage', 'Unexpected action: ' + message.action, message);
			break;
	}
};

const logHandler = event => {
	apiCall("hud", "action", "log", { record: event.detail.record });
};

const backupHandler = event => {
	backup(event.detail.key, event.detail.value);
};

function backup(key, value) {
	apiCall("hud", "action", "setUiOption", { key: key, value: value });
}

self.addEventListener("install", onInstall); 
self.addEventListener("activate", onActivate);
self.addEventListener("fetch", onFetch);
self.addEventListener("message", onMessage);
self.addEventListener('error', utils.errorHandler);
self.addEventListener('hud.log', logHandler);
self.addEventListener('hud.backup', backupHandler);

function registerForZapEvents(publisher) {
	apiCall("event", "register", publisher);
};

function apiCall(component, type, name, params) {
	if (!webSocket) {
		// Can't use utils.log here as that could then put us in a loop
		console.log("serviceworker.apiCall no WebSocket " + component + " " + type + " " + name);
		return;
	}
	if (! params) {
		params = {};
	}
	let call = { component : component, type: type, name: name, params: params }; 
	webSocket.send(JSON.stringify(call));
};

function apiCallWithResponse(component, type, name, params) {
	if (!webSocket) {
		console.log("serviceworker.apiCallWithResponse no WebSocket " + component + " " + type + " " + name);
		return;
	}
	if (! params) {
		params = {};
	}
	let call = { component : component, type: type, name: name, params: params }; 
	let pFunctions = {};
	let p = new Promise(function(resolve, reject) { 
		pFunctions.resolve = resolve; 
		pFunctions.reject = reject; 
	});
	let callId = webSocketCallbackId++;
	call['id'] = callId;
	webSocketCallbacks[callId] = pFunctions;
	webSocket.send(JSON.stringify(call));
	return p;
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
		tutorial: I18n.t("settings_tutorial"),
		changelog: I18n.t("settings_changelog"),
	};

	utils.messageFrame(tabId, "display", {action: "showHudSettings", config: config})
		.then(response => {
			if (response.id === "initialize") {
				resetToDefault();
			} else if (response.id === "tutorial") {
				utils.messageAllTabs("management", {action: "showTutorial"});
			} else if (response.id === "changelog") {
				apiCallWithResponse("hud", "other", "changesInHtml")
				.then(response => {
					var config = {};
					config.buttons = [{text: I18n.t("common_cancel"), id: "cancel"}];
					config.title = I18n.t("changelog_title");
					// Open links in a new window to prevent framing issues
					config.text = response.response.replace(/href=/g, "target=\"_blank\" href=").replace(/\\n/g, "");
					utils.messageFrame(tabId, "display", {action:"showDialog", config:config});
				})
			}
		})
		.catch(utils.errorHandler);
};

function resetToDefault() {
	utils.loadAllTools()
		.then(tools => {
			var promises = [];
			// Clearing these values means they will go back to the default when next read
			promises.push(backup('leftPanel', ''));
			promises.push(backup('rightPanel', ''));

			for (var tool in tools) {
				self.tools[tools[tool].name].initialize();
			}

			return Promise.all(promises);
		})
		.then(() => {
			var promises = [];
			promises.push(apiCallWithResponse("hud", "view", "getUiOption",  { key: 'leftPanel' }));
			promises.push(apiCallWithResponse("hud", "view", "getUiOption",  { key: 'rightPanel' }));
			return Promise.all(promises);
		})
		.then(responses => {
			return utils.initializeHUD(responses[0].leftPanel, responses[1].rightPanel);
		})
		.then(utils.messageAllTabs("management", {action: "refreshTarget"}))
		.catch(utils.errorHandler);
};
