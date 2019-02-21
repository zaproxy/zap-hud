/*
 * Active Scan Tool
 *
 * Description goes here...
 */

var ActiveScan = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "active-scan";
	var LABEL = I18n.t("ascan_tool");
	var DATA = {};
		DATA.START = I18n.t("common_start");
		DATA.STOP = I18n.t("common_stop");
	var ICONS = {};
		ICONS.OFF = "flame-grey.png";
		ICONS.ON = "flame.png";
	var DIALOG = {};
		DIALOG.START = I18n.t("ascan_start");
		DIALOG.START_ADD_SCOPE = I18n.t("ascan_start_scope");
		DIALOG.STOP = I18n.t("ascan_stop");
	var ACTIVE_SCAN_EVENT = "org.zaproxy.zap.extension.ascan.ActiveScanEventPublisher"; 

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.START;
		tool.icon = ICONS.OFF;
		tool.isSelected = false;
		tool.panel = "";
		tool.position = 0;
		tool.isRunning = false;
		tool.runningTabId = '';
		tool.scanid = -1;

		utils.writeTool(tool);
	}

	function showDialog(tabId, domain) {

		Promise.all([checkIsRunning(tabId), self.tools.scope.isInScope(domain)])
			.then(results => {
				var isRunning = results[0];
				var isInScope = results[1];

				var config = {};
				config.buttons = [{text: I18n.t("common_cancel"), id: "cancel"}];

				if(!isRunning) {
					if (!isInScope) {
						config.text = DIALOG.START_ADD_SCOPE;
						config.buttons.unshift({text: I18n.t("common_start"), id: "start-add-to-scope"});
					}
					else {
						config.text = DIALOG.START;
						config.buttons.unshift({text: I18n.t("common_start"), id: "start"});
					}
				}
				else {
					config.text = DIALOG.STOP;
					config.buttons.unshift({text: I18n.t("common_stop"), id: "stop"});
				}

				return config;
			})
			.then(config => utils.messageFrame(tabId, "display", {action:"showDialog", config:config}))
			.then(response => {
				// Handle button choice
				if (response.id === "start") {
					startActiveScanDomain(tabId, domain);
				}
				else if (response.id === "start-add-to-scope") {
					self.tools.scope.addToScope(tabId, domain)
						.then(
							startActiveScanDomain(tabId, domain)
						)
						.catch(utils.errorHandler);
				}
				else if (response.id === "stop") {
					stopActiveScan();
				}
			})
			.catch(utils.errorHandler);
	}

	function startActiveScanDomain(tabId, domain) {
		utils.getUpgradedDomain(domain)
			.then(upgradedDomain => {
				startActiveScan(tabId, upgradedDomain, "true", "GET", "");
			})
			.catch(utils.errorHandler);
	}
	
	function startActiveScan(tabId, uri, recurse, method, body) {
		apiCallWithResponse("ascan", "action", "scan", { url: uri, recurse: recurse, method: method, body: body })
			.catch(error => {
				utils.zapApiErrorDialog(tabId, error);
				throw error;
			})
			.then(data => {
				utils.loadTool(NAME)
					.then(tool => {
						tool.isRunning = true;
						tool.runningTabId = tabId;
						tool.icon = ICONS.ON;
						tool.data = "0%";
						tool.scanid = data.scan;

						utils.writeTool(tool);
						utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', context: {notTabId: tabId}, tool: {name: NAME, label: LABEL, data: DATA.START, icon: ICONS.OFF}, isToolDisabled: true})
						utils.messageFrame(tabId, tool.panel, {action: 'updateData', tool: {name: NAME, label: LABEL, data: tool.data, icon: ICONS.ON}});
					})
					.catch(utils.errorHandler)
			})
			.catch(utils.errorHandler);
	}

	function stopActiveScan() {
		utils.loadTool(NAME)
			.then(tool => {
				return apiCallWithResponse("ascan", "action", "stop", { scanId: tool.scanId })
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
				tool.icon = ICONS.OFF;
				tool.data = DATA.START;
				tool.scanid = -1;

				utils.writeTool(tool);
				utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, label: LABEL, data: DATA.START, icon: ICONS.OFF}, isToolDisabled: false})
			})
			.catch(utils.errorHandler);
	}

	// if tabId included, then it will check if active scan is running on that tab
	// if not tabId is included it will check if active scan is running on any tab
	function checkIsRunning(tabId) {
		return new Promise(resolve => {
			utils.loadTool(NAME).then(tool => {
				if (tabId !== undefined) {
					resolve(tool.runningTabId === tabId);
				}
				else {
					resolve(tool.isRunning);
				}
			});
		});
	}

	function updateProgress(progress) {
		if (progress !== "-1") {
			utils.loadTool(NAME)
				.then(tool => {
					if (tool.isRunning) {
						tool.data = progress;

						utils.writeTool(tool);
						utils.messageFrame(tool.runningTabId, tool.panel, {action: 'updateData', tool: tool})
					}
				})
				.catch(utils.errorHandler);
		}
	}

	function showOptions(tabId) {
		var config = {};

		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {remove: I18n.t("common_remove")};

		utils.messageFrame(tabId, "display", {action:"showButtonOptions", config:config})
			.then(response => {
				// Handle button choice
				if (response.id == "remove") {
					utils.removeToolFromPanel(tabId, NAME);
				}
				else {
					//cancel
				}
			})
			.catch(utils.errorHandler);
	}
	
	function getTool(tabId, context, port) {
		utils.loadTool(NAME)
			.then(tool => {
				if (tabId === tool.runningTabId) {
					port.postMessage({label: LABEL, data: tool.data, icon: ICONS.ON});
				}
				else if (tool.isRunning) {
					port.postMessage({label: LABEL, data: DATA.START, icon: ICONS.OFF, isDisabled: true});
				}
				else {
					port.postMessage({label: LABEL, data: DATA.START, icon: ICONS.OFF});
				}
			})
			.catch(utils.errorHandler)
	}

	self.addEventListener("activate", event => {
		initializeStorage();
		registerForZapEvents(ACTIVE_SCAN_EVENT);
	});

	self.addEventListener("message", event => {
		var message = event.data;

		// Broadcasts
		switch(message.action) {
			case "initializeTools":
				initializeStorage();
				break;

			default:
				break;
		}

		// Directed
		if (message.tool === NAME) {
			switch(message.action) {
				case "buttonClicked":
					showDialog(message.tabId, message.domain);
					break;

				case "buttonMenuClicked":
					showOptions(message.tabId);
					break;

				case "getTool":
					getTool(message.tabId, message.context, event.ports[0]);
					break;

				case "ascanRequest":
					utils.log (LOG_DEBUG, 'activeScan message eventListener', 'Received ascanRequest', message);
					startActiveScan(message.tabId, message.uri, "false", message.method, message.body);
					break;

				default:
					break;
			}
		}
	});

	self.addEventListener("org.zaproxy.zap.extension.ascan.ActiveScanEventPublisher", event => {
		var eventType = event.detail['event.type'];
		utils.log (LOG_DEBUG, 'ActiveScanEventPublisher eventListener', 'Received ' + eventType + ' event');
		checkIsRunning()
			.then(isRunning => {
				if (isRunning) {
					if (eventType === 'scan.started') {
						updateProgress("0%");
					} else if (eventType === 'scan.progress') {
						updateProgress(event.detail['scanProgress'] + '%');
					} else  if (eventType === 'scan.stopped' || eventType === 'scan.completed') {
						activeScanStopped();
					}
				}
			})
			.catch(utils.errorHandler);
	});

	return {
		name: NAME,
		initialize: initializeStorage,
		isRunning: checkIsRunning,
	};
})();

self.tools[ActiveScan.name] = ActiveScan;
