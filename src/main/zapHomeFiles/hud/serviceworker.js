// Injected strings
const ZAP_HUD_FILES = '<<ZAP_HUD_FILES>>';
const toolScripts = [
	'<<ZAP_HUD_TOOLS>>'
];
// The configured tools
const CONFIG_TOOLS_LEFT = '<<ZAP_HUD_CONFIG_TOOLS_LEFT>>';
const CONFIG_TOOLS_RIGHT = '<<ZAP_HUD_CONFIG_TOOLS_RIGHT>>';
const CONFIG_DRAWER = '<<ZAP_HUD_CONFIG_DRAWER>>';

importScripts(ZAP_HUD_FILES + '/file/libraries/localforage.min.js');
importScripts(ZAP_HUD_FILES + '/file/libraries/vue.js');
importScripts(ZAP_HUD_FILES + '/file/libraries/vue-i18n.js');
importScripts(ZAP_HUD_FILES + '/file/i18n.js');
importScripts(ZAP_HUD_FILES + '/file/utils.js');
importScripts(ZAP_HUD_FILES + '/file/tools/utils/alertUtils.js');

const CACHE_NAME = 'hud-cache-1.0';
let webSocket;
const webSocketCallbacks = {};
let webSocketCallbackId = 0;

const urlsToCache = [
	ZAP_HUD_FILES + '/file/libraries/localforage.min.js',
	ZAP_HUD_FILES + '/file/libraries/vue.js',
	ZAP_HUD_FILES + '/file/libraries/vue-i18n.js',
	ZAP_HUD_FILES + '/file/i18n.js',
	ZAP_HUD_FILES + '/file/utils.js',
	ZAP_HUD_FILES + '/file/panel.html',
	ZAP_HUD_FILES + '/file/panel.css',
	ZAP_HUD_FILES + '/file/panel.js',
	ZAP_HUD_FILES + '/file/display.css',
	ZAP_HUD_FILES + '/file/display.html',
	ZAP_HUD_FILES + '/file/display.js',
	ZAP_HUD_FILES + '/file/management.css',
	ZAP_HUD_FILES + '/file/management.html',
	ZAP_HUD_FILES + '/file/management.js',
	ZAP_HUD_FILES + '/file/growlerAlerts.html',
	ZAP_HUD_FILES + '/file/growlerAlerts.js'
];

self.tools = {};

localforage.setItem('tools', [])
	.then(() => {
		// Load tool scripts
		toolScripts.forEach(script => {
			importScripts(script);
		});
	})
	.then(() => {
		// Save tool list to indexeddb
		const ts = [];
		for (const tool in self.tools) {
			if (Object.prototype.hasOwnProperty.call(self.tools, tool)) {
				ts.push(self.tools[tool].name);
			}
		}

		return utils.registerTools(ts);
	})
	.catch(utils.errorHandler);

initWebSockets();

function initWebSockets() {
	/* Set up WebSockets */
	const ZAP_HUD_WS = '<<ZAP_HUD_WS>>';
	webSocket = new WebSocket(ZAP_HUD_WS);

	webSocket.addEventListener('open', () => {
		// Won't be able to log until ther websocket is set up
		utils.log(LOG_INFO, 'serviceworker.initWebSockets', 'Initialized');
		// Basic test
		webSocket.send('{ "component" : "core", "type" : "view", "name" : "version" }');

		apiCallWithResponse('hud', 'view', 'upgradedDomains')
			.then(response => {
				const upgradedDomains = {};

				for (const domain of response.upgradedDomains) {
					upgradedDomains[domain] = true;
				}

				return localforage.setItem('upgradedDomains', upgradedDomains);
			})
			.catch(utils.errorHandler);
	});

	webSocket.addEventListener('message', event => {
		// Rebroadcast for the tools to pick up
		const jevent = JSON.parse(event.data);

		if ('event.publisher' in jevent) {
			utils.log(LOG_DEBUG, 'serviceworker.webSocket.onmessage', jevent['event.publisher']);
			const ev = new CustomEvent(jevent['event.publisher'], {detail: jevent});
			self.dispatchEvent(ev);
		} else if ('id' in jevent && 'response' in jevent) {
			const pFunctions = webSocketCallbacks[jevent.id];
			const response = jevent.response;
			if ('code' in response && 'message' in response) {
				// These always indicate a failure
				const error = new Error(I18n.t('error_with_message', [response.message]));
				error.response = response;

				pFunctions.reject(error);
			} else {
				pFunctions.resolve(response);
			}

			delete webSocketCallbacks[jevent.id];
		}
	});

	webSocket.addEventListener('error', event => {
		utils.log(LOG_ERROR, 'websocket', '', event);
	});
}

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
					return utils.initializeHUD(CONFIG_TOOLS_LEFT, CONFIG_TOOLS_RIGHT, CONFIG_DRAWER);
				}
			})
			.catch(utils.errorHandler)
	);
};

// If we remove cache we can remove this as well
const onFetch = event => {
	event.respondWith(
		caches.match(event.request)
			.then(response => {
				if (response) {
					return response;
				}

				return fetch(event.request);
			}).catch(utils.errorHandler)
	);
};

const onMessage = event => {
	if (!utils.isFromTrustedOrigin(event)) {
		return;
	}

	const message = event.data;

	switch (message.action) {
		case 'buttonClicked': {
			if (message.buttonLabel === 'add-tool') {
				showAddToolDialog(message.tabId, message.frameId);
			}

			break;
		}

		case 'showHudSettings': {
			showHudSettings(message.tabId, message.tutorialUpdates, message.newChangelog);
			break;
		}

		case 'targetload': {
			const targetDomain = utils.parseDomainFromUrl(message.targetUrl);

			const customEvent = new CustomEvent('targetload', {detail: {tabId: message.tabId, url: message.targetUrl, domain: targetDomain}});
			self.dispatchEvent(customEvent);

			break;
		}

		case 'heartbeat': {
			apiCall('hud', 'view', 'heartbeat');
			break;
		}

		case 'zapApiCall': {
			if (event.ports.length > 0) {
				apiCallWithResponse(message.component, message.type, message.name, message.params)
					.then(response => {
						event.ports[0].postMessage(response);
					})
					.catch(error => {
						event.ports[0].postMessage(error.response);
					});
			} else {
				apiCall(message.component, message.type, message.name, message.params);
			}

			break;
		}

		default: {
			utils.log(LOG_DEBUG, 'serviceworker.onMessage', 'Unexpected action: ' + message.action, message);
			break;
		}
	}
};

const logHandler = event => {
	apiCall('hud', 'action', 'log', {record: event.detail.record});
};

const backupHandler = event => {
	backup(event.detail.key, event.detail.value);
};

function backup(key, value) {
	apiCall('hud', 'action', 'setUiOption', {key, value});
}

self.addEventListener('install', onInstall);
self.addEventListener('activate', onActivate);
self.addEventListener('fetch', onFetch);
self.addEventListener('message', onMessage);
self.addEventListener('error', utils.errorHandler);
self.addEventListener('hud.log', logHandler);
self.addEventListener('hud.backup', backupHandler);

function registerForZapEvents(publisher) {
	apiCall('event', 'register', publisher);
}

function apiCall(component, type, name, parameters) {
	if (!webSocket) {
		// Can't use utils.log here as that could then put us in a loop
		console.log('serviceworker.apiCall no WebSocket ' + component + ' ' + type + ' ' + name);
		return;
	}

	if (!parameters) {
		parameters = {};
	}

	const call = {component, type, name, params: parameters};
	webSocket.send(JSON.stringify(call));
}

function apiCallWithResponse(component, type, name, parameters) {
	if (!webSocket) {
		console.log('serviceworker.apiCallWithResponse no WebSocket ' + component + ' ' + type + ' ' + name);
		return;
	}

	if (!parameters) {
		parameters = {};
	}

	const call = {component, type, name, params: parameters};
	const pFunctions = {};
	const p = new Promise(((resolve, reject) => {
		pFunctions.resolve = resolve;
		pFunctions.reject = reject;
	}));
	const callId = webSocketCallbackId++;
	call.id = callId;
	webSocketCallbacks[callId] = pFunctions;
	webSocket.send(JSON.stringify(call));
	return p;
}

function showAddToolDialog(tabId, frameId) {
	const config = {};

	utils.loadAllTools()
		.then(tools => {
			tools = tools.filter(tool => !tool.isSelected);
			tools = tools.filter(tool => !tool.isHidden);

			tools = tools.map(tool => ({
				label: tool.label,
				image: ZAP_HUD_FILES + '/image/' + tool.icon,
				toolname: tool.name
			}));

			return tools;
		})
		.then(tools => {
			config.tools = tools;

			return utils.messageFrame(tabId, 'display', {action: 'showAddToolList', config});
		})
		.then(response => {
			utils.addToolToPanel(response.toolname, frameId);
		})
		.catch(utils.errorHandler);
}

function showHudSettings(tabId, tutorialUpdates, newChangelog) {
	const config = {};
	config.settings = {
		initialize: {label: I18n.t('settings_resets')},
		tutorial: {label: I18n.t('settings_tutorial')},
		changelog: {label: I18n.t('settings_changelog')}
	};
	if (tutorialUpdates) {
		config.settings.tutorial.endimage = 'exclamation-red.png';
	}

	if (newChangelog) {
		config.settings.changelog.endimage = 'exclamation-red.png';
	}

	utils.messageFrame(tabId, 'display', {action: 'showHudSettings', config})
		.then(response => {
			if (response.id === 'initialize') {
				resetToDefault();
			} else if (response.id === 'tutorial') {
				utils.messageAllTabs('management', {action: 'showTutorial'});
				// Clear the localforage configs - will be picked up in the drawer on the next page load
				localforage.getItem('drawer')
					.then(drawer => {
						drawer.tutorialUpdates = [];
						return localforage.setItem('drawer', drawer);
					})
					.catch(utils.errorHandler);
			} else if (response.id === 'changelog') {
				apiCallWithResponse('hud', 'other', 'changesInHtml')
					.then(response => {
						const config = {};
						config.buttons = [{text: I18n.t('common_close'), id: 'close'}];
						config.title = I18n.t('changelog_title');
						// Open links in a new window to prevent framing issues
						config.text = response.response.replace(/href=/g, 'target="_blank" href=').replace(/\\n/g, '');
						utils.messageFrame(tabId, 'display', {action: 'showDialog', config});
						// Clear the localforage configs - will be picked up in the drawer on the next page load
						localforage.getItem('drawer')
							.then(drawer => {
								drawer.newChangelog = false;
								return localforage.setItem('drawer', drawer);
							})
							.catch(utils.errorHandler);
					});
			}
		})
		.catch(utils.errorHandler);
}

function resetToDefault() {
	utils.loadAllTools()
		.then(tools => {
			const promises = [];
			// Clearing these values means they will go back to the default when next read
			promises.push(backup('leftPanel', ''));
			promises.push(backup('rightPanel', ''));

			for (const tool in tools) {
				if (Object.prototype.hasOwnProperty.call(tools, tool)) {
					self.tools[tools[tool].name].initialize();
				}
			}

			return Promise.all(promises);
		})
		.then(() => {
			const promises = [];
			promises.push(apiCallWithResponse('hud', 'view', 'getUiOption', {key: 'leftPanel'}));
			promises.push(apiCallWithResponse('hud', 'view', 'getUiOption', {key: 'rightPanel'}));
			promises.push(apiCallWithResponse('hud', 'view', 'getUiOption', {key: 'drawer'}));
			return Promise.all(promises);
		})
		.then(responses => {
			return utils.initializeHUD(
				JSON.parse(responses[0].leftPanel),
				JSON.parse(responses[1].rightPanel),
				JSON.parse(responses[2].drawer));
		})
		.then(utils.messageAllTabs('management', {action: 'refreshTarget'}))
		.catch(utils.errorHandler);
}
