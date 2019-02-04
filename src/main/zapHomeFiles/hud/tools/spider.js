/*
 * Spider Tool
 *
 * Description goes here...
 */

var Spider = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "spider";
	var LABEL = I18n.t("spider_tool");
	var DATA = {};
		DATA.START = I18n.t("common_start");
		DATA.STOP = I18n.t("common_stop");
	var ICONS = {};
		ICONS.SPIDER = "spider.png";
	var DIALOG = {};
		DIALOG.START_1 = I18n.t("spider_start_1");
		DIALOG.START_2 = I18n.t("spider_start_2");
		DIALOG.START_ADD_SCOPE_1 = I18n.t("spider_start_scope_1");
		DIALOG.START_ADD_SCOPE_2 = I18n.t("spider_start_scope_2");
		DIALOG.START_ADD_SCOPE_3 = I18n.t("spider_start_scope_3");
		DIALOG.STOP_1 = I18n.t("spider_stop_1")
		DIALOG.STOP_2 = I18n.t("spider_stop_2");

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.START;
		tool.icon = ICONS.SPIDER;
		tool.isSelected = false;
		tool.panel = "";
		tool.position = 0;
		tool.isRunning = false;
		tool.runningTabId = '';
		tool.runningScope = [];

		utils.writeTool(tool);
		registerForZapEvents("org.zaproxy.zap.extension.spider.SpiderEventPublisher");
	}

	function showDialog(tabId, domain) {

		Promise.all([checkIsRunning(), self.tools.scope.isInScope(domain), utils.loadTool(NAME)])
			.then(results => {
				var isRunning = results[0];
				var isInScope = results[1];
				var tool = results[2];

				var config = {};
				config.buttons = [{text: I18n.t("common_cancel"), id: "cancel"}];

				if(!isRunning) {
					if (!isInScope) {
						config.text = DIALOG.START_ADD_SCOPE_1 + domain + DIALOG.START_ADD_SCOPE_2 + domain + DIALOG.START_ADD_SCOPE_3;
						config.buttons.unshift({text: I18n.t("common_start"), id: "start-add-to-scope"});
					}
					else {
						config.text = DIALOG.START_1 + domain + DIALOG.START_2;
						config.buttons.unshift({text: I18n.t("common_start"), id: "start"});
					}
				}
				else {
					config.text = DIALOG.STOP_1 + tool.runningScope[0] + DIALOG.STOP_2;
					config.buttons.unshift({text: I18n.t("common_stop"), id: "stop"});
				}

				return config;
			})
			.then(config => utils.messageFrame(tabId, "display", {action:"showDialog", config:config}))
			.then(response => {
				// Handle button choice
				if (response.id === "start") {
					return startSpider(tabId, domain);
				}
				else if (response.id === "start-add-to-scope") {
					self.tools.scope.addToScope(domain)
						.then(() => {
							return startSpider(tabId, domain)
						});
				}
				else if (response.id === "stop") {
					return stopSpider(tabId);
				}
			})
			.catch(utils.errorHandler);
	}

	function startSpider(tabId, domain) {
		utils.getUpgradedDomain(domain)
			.then(upgradedDomain => {
				apiCallWithResponse("spider", "action", "scan", { url: upgradedDomain }).then (response => {
					spiderStarted(tabId);
				})
				.catch(error => {
					utils.zapApiErrorDialog(tabId, error)
				});
			})
			.catch(utils.errorHandler);
	}
	
	function spiderStarted(tabId, domain) {
		utils.loadTool(NAME)
			.then(tool => {
				tool.isRunning = true;
				tool.runningTabId = tabId;
				tool.runningScope = [domain];
				tool.data = "0%";

				utils.writeTool(tool);
				utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, label: LABEL, data: tool.data, icon: ICONS.SPIDER}})
			})
			.catch(utils.errorHandler);
	}

	function stopSpider(tabId) {
		apiCallWithResponse("spider", "action", "stop").then (response => {
			spiderStopped(tabId);
		})
		.catch(error => {
			utils.zapApiErrorDialog(tabId, error);
		});
	}
	
	function spiderStopped(tabId) {
		utils.loadTool(NAME)
			.then(tool => {
				tool.isRunning = false;
				tool.runningTabId = '';
				tool.data = DATA.START;

				utils.writeTool(tool);
				utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, label: LABEL, data: tool.data, icon: ICONS.SPIDER}});
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
						utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: tool})
					}
				})
				.catch(utils.errorHandler);
		}
	}

	function getTool(context, port) {
		Promise.all([utils.loadTool(NAME)])
			.then(results => {
				const tool = results[0];

				if (tool.isRunning) {
					port.postMessage({label: LABEL, data: tool.data, icon: ICONS.SPIDER});
				}
				else {
					port.postMessage({label: LABEL, data: DATA.START, icon: ICONS.SPIDER});
				}
			})
			.catch(utils.errorHandler)
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

	self.addEventListener("activate", event => {
		initializeStorage();
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
					getTool(message.context, event.ports[0]);
					break;

				default:
					break;
			}
		}
	});

	self.addEventListener("org.zaproxy.zap.extension.spider.SpiderEventPublisher", event => {
		var eventType = event.detail['event.type'];
		utils.log (LOG_DEBUG, 'SpiderEventPublisher eventListener', 'Received ' + eventType + ' event');
		if (eventType === 'scan.started') {
			updateProgress("0%");
		} else if (eventType === 'scan.progress') {
			updateProgress(event.detail['scanProgress'] + '%');
		} else  if (eventType === 'scan.stopped' || eventType === 'scan.completed') {
			spiderStopped();
		}
	});

	return {
		name: NAME,
		initialize: initializeStorage
	};
})();

self.tools[Spider.name] = Spider;