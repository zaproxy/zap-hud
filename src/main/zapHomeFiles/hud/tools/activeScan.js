/*
 * Active Scan Tool
 *
 * Description goes here...
 */

const ActiveScan = (function () {
	// Constants
	const NAME = 'active-scan';
	const LABEL = I18n.t('ascan_tool');
	const DATA = {};
	DATA.START = I18n.t('common_start');
	DATA.STOP = I18n.t('common_stop');
	const ICONS = {};
	ICONS.OFF = 'flame-grey.png';
	ICONS.ON = 'flame.png';
	const DIALOG = {};
	DIALOG.START_1 = I18n.t('ascan_start_1');
	DIALOG.START_2 = I18n.t('ascan_start_2');
	DIALOG.START_ADD_SCOPE_1 = I18n.t('ascan_start_scope_1');
	DIALOG.START_ADD_SCOPE_2 = I18n.t('ascan_start_scope_2');
	DIALOG.START_ADD_SCOPE_3 = I18n.t('ascan_start_scope_3');
	DIALOG.STOP_1 = I18n.t('ascan_stop_1');
	DIALOG.STOP_2 = I18n.t('ascan_stop_2');
	const ACTIVE_SCAN_EVENT = 'org.zaproxy.zap.extension.ascan.ActiveScanEventPublisher';

	function initializeStorage() {
		const tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.START;
		tool.icon = ICONS.OFF;
		tool.isSelected = false;
		tool.panel = '';
		tool.position = 0;
		tool.isRunning = false;
		tool.runningTabId = '';
		tool.runningScope = [];
		tool.scanid = -1;

		utils.writeTool(tool);
	}

	function showDialog(tabId, domain) {
		Promise.all([checkIsRunning(), self.tools.scope.isInScope(domain), utils.loadTool(NAME)])
			.then(results => {
				const isRunning = results[0];
				const isInScope = results[1];
				const tool = results[2];

				const config = {};
				config.buttons = [{text: I18n.t('common_cancel'), id: 'cancel'}];

				if (!isRunning) {
					if (!isInScope) {
						config.text = DIALOG.START_ADD_SCOPE_1 + domain + DIALOG.START_ADD_SCOPE_2 + domain + DIALOG.START_ADD_SCOPE_3;
						config.buttons.unshift({text: I18n.t('common_start'), id: 'start-add-to-scope'});
					} else {
						config.text = DIALOG.START_1 + domain + DIALOG.START_2;
						config.buttons.unshift({text: I18n.t('common_start'), id: 'start'});
					}
				} else {
					config.text = DIALOG.STOP_1 + tool.runningScope[0] + DIALOG.STOP_2;
					config.buttons.unshift({text: I18n.t('common_stop'), id: 'stop'});
				}

				return config;
			})
			.then(config => utils.messageFrame(tabId, 'display', {action: 'showDialog', config}))
			.then(response => {
				// Handle button choice
				if (response.id === 'start') {
					startActiveScanDomain(tabId, domain);
				} else if (response.id === 'start-add-to-scope') {
					self.tools.scope.addToScope(tabId, domain)
						.then(
							startActiveScanDomain(tabId, domain)
						)
						.catch(utils.errorHandler);
				} else if (response.id === 'stop') {
					stopActiveScan(tabId);
				}
			})
			.catch(utils.errorHandler);
	}

	function startActiveScanDomain(tabId, domain) {
		utils.getUpgradedDomain(domain)
			.then(upgradedDomain => {
				startActiveScan(tabId, upgradedDomain, 'true', 'GET', '');
			})
			.catch(utils.errorHandler);
	}

	function startActiveScan(tabId, uri, recurse, method, body) {
		apiCallWithResponse('ascan', 'action', 'scan', {url: uri, recurse, method, body})
			.catch(error => {
				utils.zapApiErrorDialog(tabId, error);
				throw error;
			})
			.then(data => {
				utils.loadTool(NAME)
					.then(tool => {
						tool.isRunning = true;
						tool.runningTabId = tabId;
						tool.runningScope = [uri];
						tool.icon = ICONS.ON;
						tool.data = '0%';
						tool.scanid = data.scan;

						utils.writeTool(tool);
						utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, label: LABEL, data: tool.data, icon: ICONS.ON}});
					})
					.catch(utils.errorHandler);
			})
			.catch(utils.errorHandler);
	}

	function stopActiveScan(tabId) {
		utils.loadTool(NAME)
			.then(tool => {
				return apiCallWithResponse('ascan', 'action', 'stop', {scanId: tool.scanId});
			})
			.catch(error => {
				utils.zapApiErrorDialog(tabId, error);
				throw error;
			})
			.then(activeScanStopped)
			.catch(utils.errorHandler);
	}

	function activeScanStopped() {
		utils.loadTool(NAME)
			.then(tool => {
				tool.isRunning = false;
				tool.runningTabId = '';
				tool.runningScope = [];
				tool.icon = ICONS.OFF;
				tool.data = DATA.START;
				tool.scanid = -1;

				utils.writeTool(tool);
				utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, label: LABEL, data: DATA.START, icon: ICONS.OFF}});
			})
			.catch(utils.errorHandler);
	}

	// If tabId included, then it will check if active scan is running on that tab
	// if not tabId is included it will check if active scan is running on any tab
	function checkIsRunning(tabId) {
		return new Promise(resolve => {
			utils.loadTool(NAME).then(tool => {
				if (tabId !== undefined) {
					resolve(tool.runningTabId === tabId);
				} else {
					resolve(tool.isRunning);
				}
			});
		});
	}

	function updateProgress(progress) {
		if (progress !== '-1') {
			utils.loadTool(NAME)
				.then(tool => {
					if (tool.isRunning) {
						tool.data = progress;

						utils.writeTool(tool);
						utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool});
					}
				})
				.catch(utils.errorHandler);
		}
	}

	function showOptions(tabId) {
		const config = {};

		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {remove: I18n.t('common_remove')};

		utils.messageFrame(tabId, 'display', {action: 'showButtonOptions', config})
			.then(response => {
				// Handle button choice
				if (response.id === 'remove') {
					utils.removeToolFromPanel(tabId, NAME);
				} else {
					// Cancel
				}
			})
			.catch(utils.errorHandler);
	}

	function getTool(context, port) {
		Promise.all([utils.loadTool(NAME)])
			.then(results => {
				const tool = results[0];

				if (tool.isRunning) {
					port.postMessage({label: LABEL, data: tool.data, icon: ICONS.ON});
				} else {
					port.postMessage({label: LABEL, data: DATA.START, icon: ICONS.OFF});
				}
			})
			.catch(utils.errorHandler);
	}

	self.addEventListener('activate', event => {
		initializeStorage();
		registerForZapEvents(ACTIVE_SCAN_EVENT);
	});

	self.addEventListener('message', event => {
		const message = event.data;

		// Broadcasts
		switch (message.action) {
			case 'initializeTools':
				initializeStorage();
				break;

			default:
				break;
		}

		// Directed
		if (message.tool === NAME) {
			switch (message.action) {
				case 'buttonClicked':
					showDialog(message.tabId, message.domain);
					break;

				case 'buttonMenuClicked':
					showOptions(message.tabId);
					break;

				case 'getTool':
					getTool(message.context, event.ports[0]);
					break;

				case 'ascanRequest':
					utils.log(LOG_DEBUG, 'activeScan message eventListener', 'Received ascanRequest', message);
					startActiveScan(message.tabId, message.uri, 'false', message.method, message.body);
					break;

				default:
					break;
			}
		}
	});

	self.addEventListener('org.zaproxy.zap.extension.ascan.ActiveScanEventPublisher', event => {
		const eventType = event.detail['event.type'];
		utils.log(LOG_DEBUG, 'ActiveScanEventPublisher eventListener', 'Received ' + eventType + ' event');
		checkIsRunning()
			.then(isRunning => {
				if (isRunning) {
					if (eventType === 'scan.started') {
						updateProgress('0%');
					} else if (eventType === 'scan.progress') {
						updateProgress(event.detail.scanProgress + '%');
					} else if (eventType === 'scan.stopped' || eventType === 'scan.completed') {
						activeScanStopped();
					}
				}
			})
			.catch(utils.errorHandler);
	});

	return {
		name: NAME,
		initialize: initializeStorage,
		isRunning: checkIsRunning
	};
})();

self.tools[ActiveScan.name] = ActiveScan;
