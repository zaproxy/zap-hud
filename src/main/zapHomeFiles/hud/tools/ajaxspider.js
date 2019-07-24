/*
 * AjaxSpider Tool
 *
 * Description goes here...
 */

var AjaxSpider = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "ajaxspider";
	var LABEL = I18n.t("ajax_spider_tool");
	var DATA = {};
		DATA.START = I18n.t("common_start");
		DATA.STOP = I18n.t("common_stop");
	var ICONS = {};
		ICONS.SPIDER = "spiderAjax.png";
	var DIALOG = {};
		DIALOG.START_1 = I18n.t("ajax_spider_start_1");
		DIALOG.START_2 = I18n.t("ajax_spider_start_2");
		DIALOG.START_ADD_SCOPE_1 = I18n.t("ajax_spider_start_scope_1");
		DIALOG.START_ADD_SCOPE_2 = I18n.t("ajax_spider_start_scope_2");
		DIALOG.START_ADD_SCOPE_3 = I18n.t("ajax_spider_start_scope_3");
		DIALOG.STOP_1 = I18n.t("ajax_spider_stop_1")
		DIALOG.STOP_2 = I18n.t("ajax_spider_stop_2");

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
	}

	function showDialog(tabId, domain, url) {

		Promise.all([checkIsRunning(), self.tools.scope.isInScope(domain), utils.loadTool(NAME)])
			.then(results => {
				var isRunning = results[0];
				var isInScope = results[1];
				var tool = results[2];

				var config = {};
				config.buttons = [{text: I18n.t("common_cancel"), id: "cancel"}];
				config.status = '';

				if(!isRunning) {
					config.status = 'stopped';
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
					config.status = 'running';
					config.text = DIALOG.STOP_1 + tool.runningScope[0] + DIALOG.STOP_2;
					config.buttons.unshift({text: I18n.t("common_stop"), id: "stop"});
				}

				return config;
			})
			.then(config => utils.messageFrame(tabId, "display", {action:"showAjaxDialog", config:config}))
			.then(response => {
				// Handle button choice
				if (response.id === "start") {
					return startSpider(tabId, url, response.browserId);
				}
				else if (response.id === "start-add-to-scope") {
					self.tools.scope.addToScope(tabId, domain)
						.then(() => {
							return startSpider(tabId, url, response.browserId)
						});
				}
				else if (response.id === "stop") {
					return stopSpider(tabId);
				}
			})
			.catch(utils.errorHandler);
	}

	function startSpider(tabId, url, browserId) {
		utils.getUpgradedUrl(url)
			.then(upgradedUrl => {
				apiCallWithResponse("ajaxSpider", "action", "setOptionBrowserId", { String: browserId });
				apiCallWithResponse("ajaxSpider", "action", "scan", { url: upgradedUrl }).then (response => {
					spiderStarted(tabId, upgradedUrl);
				})
				.catch(error => {
					utils.zapApiErrorDialog(tabId, error)
				});
			})
			.catch(utils.errorHandler);
	}
	
	function spiderStarted(tabId, url) {
		utils.loadTool(NAME)
			.then(tool => {
				tool.isRunning = true;
				tool.runningTabId = tabId;
				tool.runningScope = [url];
				tool.data = I18n.t("ajax_spider_running")

				utils.writeTool(tool);
				utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, label: LABEL, data: tool.data, icon: ICONS.SPIDER}})
			})
			.catch(utils.errorHandler);
	}

	function stopSpider(tabId) {
		apiCallWithResponse("ajaxSpider", "action", "stop").then (response => {
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
				tool.runningScope = [];
				tool.data = DATA.START;

				utils.writeTool(tool);
				utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, label: LABEL, data: tool.data, icon: ICONS.SPIDER}});
			})
			.catch(utils.errorHandler);
	}

	function checkIsRunning() {
		return new Promise(resolve => {
			utils.loadTool(NAME).then(tool => {
				resolve(tool.isRunning);
			});
		});
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
		registerForZapEvents("org.zaproxy.zap.extension.spiderAjax.SpiderEventPublisher");
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
					showDialog(message.tabId, message.domain, message.url);
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

	self.addEventListener("org.zaproxy.zap.extension.spiderAjax.SpiderEventPublisher", event => {
		var eventType = event.detail['event.type'];
		utils.log (LOG_DEBUG, 'SpiderEventPublisher eventListener', 'Received ' + eventType + ' event');
		if (eventType === 'scan.stopped' || eventType === 'scan.completed') {
			spiderStopped();
		}
	});

	return {
		name: NAME,
		initialize: initializeStorage
	};
})();

self.tools[AjaxSpider.name] = AjaxSpider;