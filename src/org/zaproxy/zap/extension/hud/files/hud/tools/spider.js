/*
 * Spider Tool
 *
 * Description goes here...
 */

var Spider = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "spider";
	var I18N = {
		SPIDER_LABEL: "<<ZAP_I18N_hud.ui.spider.tool>>",
		SPIDER_START: "<<ZAP_I18N_hud.ui.spider.start>>",
		SPIDER_START_SCOPE: "<<ZAP_I18N_hud.ui.spider.start.scope>>",
		SPIDER_STOP: "<<ZAP_I18N_hud.ui.spider.stop>>",
		STD_CANCEL: "<<ZAP_I18N_hud.ui.common.cancel>>",
		STD_REMOVE: "<<ZAP_I18N_hud.ui.common.remove>>",
		STD_START: "<<ZAP_I18N_hud.ui.common.start>>",
		STD_STOP: "<<ZAP_I18N_hud.ui.common.stop>>",
	}
	var LABEL = I18N.SPIDER_LABEL;
	var DATA = {};
		DATA.START = I18N.STD_START;
		DATA.STOP = I18N.STD_STOP;
	var ICONS = {};
		ICONS.SPIDER = "spider.png";
	var DIALOG = {};
		DIALOG.START = I18N.SPIDER_START;
		DIALOG.START_ADD_SCOPE = I18N.SPIDER_START_SCOPE;
		DIALOG.STOP = I18N.SPIDER_STOP;

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

		saveTool(tool);
		registerForZapEvents("org.zaproxy.zap.extension.spider.SpiderEventPublisher");
	}

	function showDialog(domain) {

		Promise.all([checkIsRunning(), self.tools.scope.isInScope(domain)])
			.then(results => {
				var isRunning = results[0];
				var isInScope = results[1];

				var config = {};
				config.buttons = [{text: I18N.STD_CANCEL, id: "cancel"}];

				if(!isRunning) {
					if (!isInScope) {
						config.text = DIALOG.START_ADD_SCOPE;
						config.buttons.unshift({text: I18N.STD_START, id: "start-add-to-scope"});
					}
					else {
						config.text = DIALOG.START;
						config.buttons.unshift({text: I18N.STD_START, id: "start"});
					}
				}
				else {
					config.text = DIALOG.STOP;
					config.buttons.unshift({text: I18N.STD_STOP, id: "stop"});
				}

				return config;
			})
			.then(config => messageFrame("display", {action:"showDialog", config:config}))
			.then(response => {
				// Handle button choice
				if (response.id === "start") {
					startSpider(domain);
				}
				else if (response.id === "start-add-to-scope") {
					self.tools.scope.addToScope(domain)
						.then(
							startSpider(domain)
						);
				}
				else if (response.id === "stop") {
					stopSpider(domain);
				}
				else {
					//cancel
				}
			})
			.catch(errorHandler);
	}

	function startSpider(domain) {
		fetch("<<ZAP_HUD_API>>/spider/action/scan/?url=" + domainWrapper(domain));
		spiderStarted();
	}
	
	function spiderStarted() {
		loadTool(NAME)
			.then(tool => {
				tool.isRunning = true;
				tool.data = "0%";

				saveTool(tool);
			})
			.catch(errorHandler);
	}

	function stopSpider() {
		fetch("<<ZAP_HUD_API>>/spider/action/stop");
		spiderStopped();
	}
	
	function spiderStopped() {
		loadTool(NAME)
			.then(tool => {
				tool.isRunning = false;
				tool.data = DATA.START;

				saveTool(tool);
			})
			.catch(errorHandler);
	}

	function checkIsRunning() {
		return new Promise(resolve => {
			loadTool(NAME)
				.then(tool => {
					resolve(tool.isRunning);
				});
		});
	}

	function updateProgress(progress) {
		if (progress !== "-1") {
			loadTool(NAME)
				.then(tool => {
					tool.data = progress;

					saveTool(tool);
				})
				.catch(errorHandler);
		}
	}

	function showOptions() {
		var config = {};

		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {remove: I18N.STD_REMOVE};

		messageFrame("display", {action:"showButtonOptions", config:config})
			.then(response => {
				// Handle button choice
				if (response.id == "remove") {
					removeToolFromPanel(NAME);
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
					showDialog(message.domain);
					break;

				case "buttonMenuClicked":
					showOptions();
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
