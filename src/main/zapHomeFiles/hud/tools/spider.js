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
		DIALOG.START = I18n.t("spider_start");
		DIALOG.START_ADD_SCOPE = I18n.t("spider_start_scope");
		DIALOG.STOP = I18n.t("spider_stop");

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

		utils.writeTool(tool);
		registerForZapEvents("org.zaproxy.zap.extension.spider.SpiderEventPublisher");
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
			.then(config => utils.messageFrame2(tabId, "display", {action:"showDialog", config:config}))
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
			.then(upgradedDomain =>{
				utils.zapApiCall("/spider/action/scan/?url=" + upgradedDomain);
				spiderStarted(tabId);
			})
			.catch(utils.errorHandler);
	}
	
	function spiderStarted(tabId) {
		utils.loadTool(NAME)
			.then(tool => {
				tool.isRunning = true;
				tool.runningTabId = tabId;
				tool.data = "0%";

				utils.writeTool(tool);
				utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', context: {notTabId: tabId}, tool: {name: NAME, label: LABEL, data: DATA.START, icon: ICONS.SPIDER}, isToolDisabled: true})
				utils.messageFrame2(tabId, tool.panel, {action: 'updateData', tool: {name: NAME, label: LABEL, data: tool.data, icon: ICONS.SPIDER}});
			})
			.catch(utils.errorHandler);
	}

	function stopSpider(tabId) {
		utils.zapApiCall("/spider/action/stop");
		spiderStopped(tabId);
	}
	
	function spiderStopped(tabId) {
		utils.loadTool(NAME)
			.then(tool => {
				tool.isRunning = false;
				tool.runningTabId = '';
				tool.data = DATA.START;

				utils.writeTool(tool);
				utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, label: LABEL, data: tool.data, icon: ICONS.SPIDER}, isToolDisabled: false});
			})
			.catch(utils.errorHandler);
	}

	function checkIsRunning(tabId) {
		return new Promise(resolve => {
			utils.loadTool(NAME)
				.then(tool => {
					resolve(tool.runningTabId === tabId);
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
						utils.messageFrame2(tool.runningTabId, tool.panel, {action: 'updateData', tool: tool})
					}
				})
				.catch(utils.errorHandler);
		}
	}

	function getTool(tabId, context, port) {
		utils.loadTool(NAME)
			.then(tool => {
				if (tabId === tool.runningTabId) {
					port.postMessage({label: LABEL, data: tool.data, icon: ICONS.SPIDER});
				}
				else if (tool.isRunning) {
					port.postMessage({label: LABEL, data: DATA.START, icon: ICONS.SPIDER, isDisabled: true});
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

		utils.messageFrame2(tabId, "display", {action:"showButtonOptions", config:config})
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
					getTool(message.tabId, message.context, event.ports[0]);
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
