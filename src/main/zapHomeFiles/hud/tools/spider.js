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

		saveTool(tool);
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
			.then(config => messageFrame2(tabId, "display", {action:"showDialog", config:config}))
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
			.catch(errorHandler);
	}

	function startSpider(tabId, domain) {
		fetch("<<ZAP_HUD_API>>/spider/action/scan/?url=" + domainWrapper(domain));
		spiderStarted(tabId);
	}
	
	function spiderStarted(tabId) {
		loadTool(NAME)
			.then(tool => {
				tool.isRunning = true;
				tool.runningTabId = tabId;
				tool.data = "0%";

				writeTool(tool);
				messageAllTabs(tool.panel, {action: 'broadcastUpdate', context: {notTabId: tabId}, tool: {name: NAME, label: LABEL, data: DATA.START, icon: ICONS.SPIDER}, isToolDisabled: true})
				messageFrame2(tabId, tool.panel, {action: 'updateData', tool: {name: NAME, label: LABEL, data: tool.data, icon: ICONS.SPIDER}});
			})
			.catch(errorHandler);
	}

	function stopSpider(tabId) {
		fetch("<<ZAP_HUD_API>>/spider/action/stop");
		spiderStopped(tabId);
	}
	
	function spiderStopped(tabId) {
		loadTool(NAME)
			.then(tool => {
				tool.isRunning = false;
				tool.runningTabId = '';
				tool.data = DATA.START;

				writeTool(tool);
				messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, label: LABEL, data: tool.data, icon: ICONS.SPIDER}, isToolDisabled: false});
			})
			.catch(errorHandler);
	}

	function checkIsRunning(tabId) {
		return new Promise(resolve => {
			loadTool(NAME)
				.then(tool => {
					resolve(tool.runningTabId === tabId);
				});
		});
	}

	function updateProgress(progress) {
		if (progress !== "-1") {
			loadTool(NAME)
				.then(tool => {
					if (tool.isRunning) {
						tool.data = progress;

						writeTool(tool);
						messageFrame2(tool.runningTabId, tool.panel, {action: 'updateData', tool: tool})
					}
				})
				.catch(errorHandler);
		}
	}

	function getTool(tabId, context, port) {
		loadTool(NAME)
			.then(tool => {
				if (tabId === tool.runningTabId) {
					port.postMessage({label: LABEL, data: tool.data, icon: ICONS.SPIDER});
				}
				else {
					port.postMessage({label: LABEL, data: DATA.START, icon: ICONS.SPIDER});
				}
			})
			.catch(errorHandler)
	}

	function showOptions(tabId) {
		var config = {};

		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {remove: I18n.t("common_remove")};

		messageFrame2(tabId, "display", {action:"showButtonOptions", config:config})
			.then(response => {
				// Handle button choice
				if (response.id == "remove") {
					removeToolFromPanel(tabId, NAME);
				}
				else {
					//cancel
				}
			})
			.catch(errorHandler);
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
		log (LOG_DEBUG, 'SpiderEventPublisher eventListener', 'Received ' + eventType + ' event');
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
