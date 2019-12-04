// Public variables
const IS_HUD_INITIALIZED = 'isHudInitialized';
const IS_FIRST_TIME = 'isFirstTime';
const IS_SERVICEWORKER_REFRESHED = 'isServiceWorkerRefreshed';

const LOG_OFF = 0;	// Just use for setting the level, nothing will be logged
const LOG_ERROR = 1;	// Errors that should be addressed
const LOG_WARN = 2;	// A potential problem
const LOG_INFO = 3;	// Significant but infrequent events
const LOG_DEBUG = 4;	// Relatively fine grain events which can help debug problems
const LOG_TRACE = 5;	// Very fine grain events, highest level
const LOG_STRS = ['OFF', 'ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'];

class NoClientIdError extends Error { }

const utils = (function () {
	/*
	 * Utility Functions
	 *
	 */

	// Injected strings
	const ZAP_HUD_FILES = '<<ZAP_HUD_FILES>>';
	const IS_DEV_MODE = '<<DEV_MODE>>' === 'true';

	const BUTTON_HTML = '<div class="button" id="BUTTON_NAME-button">\n<div class="button-icon" id="BUTTON_NAME-button-icon"><img src="' + ZAP_HUD_FILES + '/image/IMAGE_NAME" alt="IMAGE_NAME" height="16" width="16"></div>\n<div class="button-data" id="BUTTON_NAME-button-data">BUTTON_DATA</div>\n<div class="button-label" id="BUTTON_NAME-button-label">BUTTON_LABEL</div>\n</div>\n';
	const BUTTON_NAME = /BUTTON_NAME/g;
	const BUTTON_DATA_DIV = /<div class="button-data" id="BUTTON_NAME-button-data">BUTTON_DATA<\/div>/g;
	const BUTTON_DATA = /BUTTON_DATA/g;
	const BUTTON_LABEL = /BUTTON_LABEL/g;
	const IMAGE_NAME = /IMAGE_NAME/g;

	const LOG_LEVEL = IS_DEV_MODE ? LOG_DEBUG : LOG_INFO;
	const LOG_TO_CONSOLE = true;
	const LOG_TO_ZAP = IS_DEV_MODE;

	/*
	 * Given the text from an HTTP request header, returns a parsed object.
	 */
	function parseRequestHeader(headerText) {
		const header = {};

		header.method = headerText.substring(0, headerText.indexOf(' '));
		headerText = headerText.substring(headerText.indexOf(' ') + 1);

		header.uri = headerText.substring(0, headerText.indexOf(' '));
		headerText = headerText.substring(headerText.indexOf(' ') + 1);

		header.version = headerText.substring(0, headerText.indexOf('\r'));
		headerText = headerText.substring(headerText.indexOf('\n') + 1);

		header.fields = {};
		while (headerText !== '') {
			const field = headerText.substring(0, headerText.indexOf(':'));
			headerText = headerText.substring(headerText.indexOf(':') + 2);
			let value;

			if (headerText.indexOf('\n') < 0) {
				value = headerText;
				headerText = '';
			} else {
				value = headerText.substring(0, headerText.indexOf('\n'));
				headerText = headerText.substring(headerText.indexOf('\n') + 1);
			}

			header.fields[field] = value;
		}

		return header;
	}

	/*
	 * Given the text from an HTTP response header, returns a parsed object.
	 */
	function parseResponseHeader(headerText) {
		const header = {};

		header.version = headerText.substring(0, headerText.indexOf(' '));
		headerText = headerText.substring(headerText.indexOf(' ') + 1);

		header.status = headerText.substring(0, headerText.indexOf(' '));
		headerText = headerText.substring(headerText.indexOf(' ') + 1);

		header.reason = headerText.substring(0, headerText.indexOf(' '));
		headerText = headerText.substring(headerText.indexOf(' ') + 1);

		header.fields = {};
		while (headerText !== '') {
			const field = headerText.substring(0, headerText.indexOf(':'));
			headerText = headerText.substring(headerText.indexOf(':') + 2);

			const value = headerText.substring(0, headerText.indexOf('\n'));
			headerText = headerText.substring(headerText.indexOf('\n') + 1);

			header.fields[field] = value;
		}

		return header;
	}

	/*
	 * Checks whether a message is from the ZAP domain or is a worker.
	 */
	function isFromTrustedOrigin(message) {
		return (
			message.origin === 'https://zap' ||
			message.isTrusted
		);
	}

	/*
	 * Parses the domain from a uri string.
	 */
	function parseDomainFromUrl(url) {
		let hostname;

		if (url.indexOf('://') > -1) {
			hostname = url.split('/')[2];
		} else {
			hostname = url.split('/')[0];
		}

		// Find & remove "?" & "#"
		hostname = hostname.split('?')[0];
		hostname = hostname.split('#')[0];

		return hostname;
	}

	/*
	 * Return a parameter value from a uri string
	 */
	function getParamater(url, parameter) {
		const start = url.indexOf(parameter) + parameter.length + 1;
		let end = url.indexOf('&', start);
		end = end === -1 ? url.length : end;

		return url.substring(start, end);
	}

	/* STORAGE */

	/*
	 * Return whether the HUD has been initialized yet.
	 */
	function isHUDInitialized() {
		return localforage.getItem(IS_HUD_INITIALIZED);
	}

	/*
	 * Initialize all of the info that will be stored in indexeddb.
	 */
	function initializeHUD(leftTools, rightTools, drawer) {
		if (IS_DEV_MODE && leftTools.indexOf('hudErrors') < 0) {
			// Always add the error tool in dev mode
			leftTools.push('hudErrors');
		}

		const promises = [];

		promises.push(localforage.setItem(IS_HUD_INITIALIZED, true));
		promises.push(localforage.setItem(IS_FIRST_TIME, true));
		promises.push(localforage.setItem(IS_SERVICEWORKER_REFRESHED, false));
		promises.push(localforage.setItem('settings.isHudVisible', true));
		promises.push(localforage.setItem('drawer.isDrawerOpen', false));
		// Note: in the below, "activeTab" is to be set to href, not name
		promises.push(localforage.setItem('drawer.activeTab', '#history'));
		promises.push(localforage.setItem('drawer', drawer));

		const leftPanel = {
			key: 'leftPanel',
			orientation: 'left',
			tools: leftTools
		};

		promises.push(saveFrame(leftPanel));

		const rightPanel = {
			key: 'rightPanel',
			orientation: 'right',
			tools: rightTools
		};

		promises.push(saveFrame(rightPanel));

		return Promise.all(promises)
			.then(setDefaultTools(leftTools, rightTools))
			.catch(errorHandler);
	}

	/*
	 * Add the default tools to the panels.
	 */
	function setDefaultTools(leftTools, rightTools) {
		const promises = [];

		for (let i = 0; i < leftTools.length; i++) {
			loadTool(leftTools[i])
				.then(tool => {
					if (!tool) {
						log(LOG_ERROR, 'utils.setDefaultTools', 'Failed to load tool.', tool.name);
						return;
					}

					tool.isSelected = true;
					tool.panel = 'leftPanel';
					tool.position = i;

					return writeTool(tool);
				})
				.catch(errorHandler);
		}

		for (let i = 0; i < rightTools.length; i++) {
			loadTool(rightTools[i])
				.then(tool => {
					if (!tool) {
						log(LOG_ERROR, 'utils.setDefaultTools', 'Failed to load tool.', tool.name);
						return;
					}

					tool.isSelected = true;
					tool.panel = 'rightPanel';
					tool.position = i;

					return writeTool(tool);
				})
				.catch(errorHandler);
		}

		return Promise.all(promises);
	}

	/*
	 * Backs up the frames tools to ZAP so they are persisted, eg when browser launch is used
	 */
	function backupFrame(frame) {
		return new Promise((resolve, reject) => {
			if (self.dispatchEvent(new CustomEvent('hud.backup', {detail: {key: frame.key, value: JSON.stringify(frame.tools)}}))) {
				resolve('OK');
			} else {
				reject(new Error('Failed to backup frame'));
			}
		});
	}

	/*
	 * Loads information about a frame as a blob from indexeddb.
	 */
	function loadFrame(key) {
		return localforage.getItem(key)
			.catch(errorHandler);
	}

	/*
	 * Save information about a frame as a blob in indexeddb.
	 */
	function saveFrame(frame) {
		return localforage.setItem(frame.key, frame)
			.catch(errorHandler);
	}

	/*
	 * Add a singletoolname to the "tools" list in indexeddb.
	 */
	function registerTool(toolname) {
		return localforage.getItem('tools')
			.then(tools => {
				tools.push(toolname);

				return localforage.setItem('tools', tools);
			})
			.catch(errorHandler);
	}

	/*
	 * Add a list of toolnames to the "tools" list in indexeddb.
	 */
	function registerTools(toolnames) {
		return localforage.getItem('tools')
			.then(tools => {
				tools = tools.concat(toolnames);

				return localforage.setItem('tools', tools);
			})
			.catch(errorHandler);
	}

	/*
	 * Loads the tool blob from indexeddb using the tool's name as the key.
	 */
	function loadTool(name) {
		log(LOG_TRACE, 'utils.loadTool', name);
		return localforage.getItem(name);
	}

	/*
	 * Writes the tool blob to indexeddb using the tool's name as the key.
	 */
	function writeTool(tool) {
		log(LOG_TRACE, 'utils.writeTool', tool.name);
		return localforage.setItem(tool.name, tool);
	}

	/*
	 * Return all tools currently selected in a panel.
	 */
	function loadPanelTools(panelKey) {
		log(LOG_DEBUG, 'utils.loadPanelTools', 'Panel ' + panelKey);
		return loadFrame(panelKey)
			.then(panel => {
				const toolPromises = [];

				panel.tools.forEach(toolname => {
					const p = loadTool(toolname);
					toolPromises.push(p);
				});

				return Promise.all(toolPromises);
			})
			.catch(errorHandler);
	}

	/*
	 * Return all tools from indexeddb.
	 */
	function loadAllTools() {
		return localforage.getItem('tools')
			.then(toolnames => {
				const toolPromises = [];

				toolnames.forEach(toolname => {
					const p = loadTool(toolname);
					toolPromises.push(p);
				});

				return Promise.all(toolPromises);
			})
			.catch(errorHandler);
	}

	/*
	 * Add a tool to a specific panel using the tool and panel keys.
	 */
	function addToolToPanel(toolKey, frameId) {
		log(LOG_DEBUG, 'utils.addToolToPanel', toolKey);

		const promises = [loadTool(toolKey), loadFrame(frameId)];

		return Promise.all(promises)
			.then(results => {
				const tool = results[0];
				const panel = results[1];

				if (!tool) {
					log(LOG_ERROR, 'utils.addToolToPanel', 'Failed to load tool.', toolKey);
					return;
				}

				tool.isSelected = true;
				tool.panel = frameId;
				tool.position = panel.tools.length;

				panel.tools.push(tool.name);

				return Promise.all([writeTool(tool), saveFrame(panel)]);
			})
			.then(results => {
				const tool = results[0];
				const panel = results[1];

				messageAllTabs(frameId, {action: 'addTool', tool})
					.catch(error => {
						if (error instanceof NoClientIdError) {
							log(LOG_DEBUG, 'utils.addToolToPanel',
								'Could not add tool to frame: ' + frameId + '. Frame was not yet available to message.',
								tool);
						} else {
							errorHandler(error);
						}
					});
				backupFrame(panel);
			})
			.catch(errorHandler);
	}

	/*
	 * Remove a tool from a panel using the tool key.
	 */
	function removeToolFromPanel(tabId, toolKey) {
		return loadTool(toolKey)
			.then(tool => Promise.all([tool, loadFrame(tool.panel), loadPanelTools(tool.panel)]))
			.then(results => {
				const removedTool = results[0];
				const panel = results[1];
				const panelTools = results[2];

				const promises = [];

				// Update tool
				removedTool.isSelected = false;
				removedTool.panel = '';

				promises.push(writeTool(removedTool));
				promises.push(messageAllTabs(panel.key, {action: 'removeTool', tool: removedTool}));

				// Update panel
				panel.tools.splice(panel.tools.indexOf(removedTool.name), 1);

				promises.push(saveFrame(panel));
				promises.push(backupFrame(panel));

				// Update all panel tool positions
				panelTools.forEach(tool => {
					if (tool.position > removedTool.position) {
						tool.position -= 1;

						promises.push(writeTool(tool));
					}
				});
				return Promise.all(promises);
			})
			.catch(errorHandler);
	}

	/*
	 * Send a postMessage to an iframe window using the custom stored frame key in indexeddb.
	 */
	function messageFrame(tabId, frameId, message) {
		return clients.matchAll({includeUncontrolled: true})
			.then(clients => {
				for (let i = 0; i < clients.length; i++) {
					const client = clients[i];
					const params = new URL(client.url).searchParams;

					const tid = params.get('tabId');
					const fid = params.get('frameId');

					if (tid === tabId && fid === frameId) {
						return client;
					}
				}

				throw new NoClientIdError('Could not find a ClientId for tabId: ' + tabId + ', frameId: ' + frameId);
			})
			.then(client => {
				return new Promise(((resolve, reject) => {
					const channel = new MessageChannel();
					channel.port1.start();
					channel.port2.start();

					channel.port1.addEventListener('message', event => {
						if (event.data.error) {
							reject(event.data.error);
						} else {
							resolve(event.data);
						}
					});

					client.postMessage(message, [channel.port2]);
				}));
			})
			.catch(errorHandler);
	}

	function messageAllTabs(frameId, message) {
		return clients.matchAll({includeUncontrolled: true})
			.then(clients => {
				const frameClients = [];

				for (let i = 0; i < clients.length; i++) {
					const client = clients[i];
					const params = new URL(client.url).searchParams;

					const fid = params.get('frameId');

					if (fid === frameId) {
						frameClients.push(client);
					}
				}

				if (frameClients.length === 0) {
					log(LOG_DEBUG, 'utils.messageAllTabs', 'Could not find any clients for frameId: ' + frameId, message);
					throw new NoClientIdError('Could not find any clients for frameId: ' + frameId);
				}

				return frameClients;
			})
			.then(clients => {
				return new Promise(((resolve, reject) => {
					for (let i = 0; i < clients.length; i++) {
						const client = clients[i];

						const channel = new MessageChannel();
						channel.port1.start();
						channel.port2.start();

						channel.port1.addEventListener('message', event => {
							if (event.data.error) {
								reject(event.data.error);
							} else {
								resolve(event.data);
							}
						});

						client.postMessage(message, [channel.port2]);
					}
				}));
			})
			.catch(errorHandler);
	}

	function zapApiErrorDialog(tabId, error) {
		log(LOG_ERROR, 'zapApiErrorDialog', error.message, error.response);
		messageFrame(tabId, 'display', {action: 'showDialog', config: {title: I18n.t('api_error_title'), text: error.message}});
	}

	/*
	 * Returns the visibilityState of the specified iframe window
	 */
	function getAllClients(frameId) {
		return clients.matchAll({includeUncontrolled: true})
			.then(clients => {
				const frameClients = [];

				for (let i = 0; i < clients.length; i++) {
					const client = clients[i];
					const params = new URL(client.url).searchParams;

					const fid = params.get('frameId');

					if (fid === frameId) {
						frameClients.push(client);
					}
				}

				return frameClients;
			})
			.catch(errorHandler);
	}

	/*
	 * Returns the visibilityState of the specified iframe window
	 */
	function getWindowVisibilityState(key) {
		return loadFrame(key)
			.then(getWindowFromFrame)
			.then(window => {
				return window.visibilityState;
			});
	}

	/*
	 * Get the window object from a stored frame blob. Throws NoClientIdError if
	 * the clientId doesn't exist.
	 */
	function getWindowFromFrame(frame) {
		if (!frame) {
			throw new Error('null frame passed to getWindowFromFrame');
		}

		return clients.get(frame.clientId)
			.then(client => {
				if (client !== undefined) {
					return client;
				}

				throw new NoClientIdError('Could not find a client (window) of the service worker with id: ' + frame.clientId + ' found.');
			});
	}

	/*
	 * Send a postMessage to a window.
	 */
	function messageWindow(window, message, origin) {
		return new Promise((resolve, reject) => {
			const channel = new MessageChannel();
			channel.port1.start();
			channel.port2.start();

			channel.port1.addEventListener('message', event => {
				if (event.data.error) {
					reject(event.data.error);
				} else {
					resolve(event.data);
				}
			});

			if (origin) {
				window.postMessage(message, origin, [channel.port2]);
			} else {
				window.postMessage(message, [channel.port2]);
			}
		});
	}

	/*
	 * Sorts an array of tool objects by their position in descending order.
	 */
	function sortToolsByPosition(tools) {
		tools.sort((a, b) => b.position - a.position);
	}

	/*
	 * Uses search and replace to construct the html for a tool's button.
	 */
	function configureButtonHtml(tool) {
		let html = BUTTON_HTML;

		if (!tool.data) {
			html = html.replace(BUTTON_DATA_DIV, ' ');
		}

		html = html
			.replace(BUTTON_NAME, tool.name)
			.replace(BUTTON_LABEL, tool.label)
			.replace(BUTTON_DATA, tool.data)
			.replace(IMAGE_NAME, tool.icon);

		return html;
	}

	/*
	 * Adds the correct scheme to a domain, handling the fact the ZAP could be upgrading an http domain to https
	 * Is only available in the serviceworker and Should always be used when supplying a domain to the ZAP API.
	 */

	function getUpgradedDomain(domain) {
		return localforage.getItem('upgradedDomains')
			.then(upgradedDomains => {
				let scheme = 'https';

				if (upgradedDomains && domain in upgradedDomains) {
					scheme = 'http';
				}

				return scheme + '://' + domain + (domain.endsWith('/') ? '' : '/');
			})
			.catch(errorHandler);
	}

	/*
	 * Adds the correct scheme to a url, handling the fact the ZAP could be upgrading an http url to https
	 * Is only available in the serviceworker and Should always be used when supplying a url to the ZAP API.
	 */

	function getUpgradedUrl(url) {
		return localforage.getItem('upgradedDomains')
			.then(upgradedDomains => {
				const domain = parseDomainFromUrl(url);
				let scheme = 'https';

				if (upgradedDomains && domain in upgradedDomains) {
					scheme = 'http';
				}

				return scheme + '://' + domain + url.substring(url.indexOf(domain) + domain.length);
			})
			.catch(errorHandler);
	}

	/*
	 * Log an error in a human readable way with a stack trace.
	 */
	function errorHandler(err) {
		let message = err.toString();

		if (err.stack) {
			// Construct the stack trace
			const lines = err.stack.split('\n').slice(0, -1);
			lines.forEach(line => {
				const functionName = line.substring(0, line.indexOf('/'));
				const urlAndLineNo = line.substring(line.indexOf('http'), line.length - 1);
				const parts = urlAndLineNo.split(':');
				let url = parts[0] + ':' + parts[1];
				let lineNo = parts[2] + ':' + parts[3];

				// If port is included in the url
				if (parts.length > 4) {
					url = parts[0] + ':' + parts[1] + ':' + parts[2];
					lineNo = parts[3] + ':' + parts[4];
				}

				message += '\n\t ' + functionName + '    ' + url + ' ' + lineNo;
			});
		}

		log(LOG_ERROR, 'errorHandler', message, err);
	}

	function getZapFilePath(file) {
		return ZAP_HUD_FILES + '/file/' + file;
	}

	function getZapImagePath(file) {
		return ZAP_HUD_FILES + '/image/' + file;
	}

	function log(level, method, message, object) {
		if (level > LOG_LEVEL || (!LOG_TO_CONSOLE && !LOG_TO_ZAP)) {
			return;
		}

		let logLevel = LOG_STRS[level];

		let record = new Date().toTimeString() + ' ' + logLevel + ' ' + method + ': ' + message;
		if (object) {
			record += ': ' + JSON.stringify(object);
		}

		if (LOG_TO_CONSOLE) {
			if (logLevel === 'OFF' || logLevel === 'TRACE') {
				logLevel = 'LOG';
			}

			console[logLevel.toLowerCase()](record);
		}

		if (LOG_TO_ZAP) {
			// We don't know if we're in the service worker here, so raise an event
			self.dispatchEvent(new CustomEvent('hud.log', {detail: {record}}));
		}

		if (level === LOG_ERROR) {
			self.dispatchEvent(new CustomEvent('hud.error', {detail: {record}}));
		}
	}

	return {
		parseRequestHeader,
		parseResponseHeader,
		isFromTrustedOrigin,
		parseDomainFromUrl,
		getParamater,
		isHUDInitialized,
		initializeHUD,
		loadFrame,
		saveFrame,
		registerTool,
		registerTools,
		loadTool,
		writeTool,
		loadPanelTools,
		loadAllTools,
		addToolToPanel,
		removeToolFromPanel,
		messageFrame,
		messageAllTabs,
		getAllClients,
		getWindowVisibilityState,
		messageWindow,
		sortToolsByPosition,
		configureButtonHtml,
		getUpgradedDomain,
		getUpgradedUrl,
		errorHandler,
		getZapFilePath,
		getZapImagePath,
		zapApiErrorDialog,
		log
	};
})();
