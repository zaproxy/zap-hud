/*
 * Spider Tool
 *
 * Description goes here...
 */

var Spider = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "spider";
	var LABEL = "Spider";
	var DATA = {};
		DATA.START = "Start";
		DATA.STOP = "Stop";
	var ICONS = {};
		ICONS.SPIDER = "spider.png";
	var DIALOG = {};
		DIALOG.START = "Start spidering this site?";
		DIALOG.START_ADD_SCOPE = "This site is not in scope.\nIn order to spider the site you must add it to the scope.\nAdd the site to the scope and start spidering it?";
		DIALOG.STOP = "The spider is currently running. Would you like to stop it?";

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
	}

	function showDialog(domain) {

		Promise.all([checkIsRunning(), self.tools.scope.isInScope(domain)])
			.then(function(results) {
				var isRunning = results[0];
				var isInScope = results[1];

				var config = {};
				config.buttons = [{text: "Cancel", id: "cancel"}];

				if(!isRunning) {
					if (!isInScope) {
						config.text = DIALOG.START_ADD_SCOPE;
						config.buttons.unshift({text: "Start", id: "start-add-to-scope"});
					}
					else {
						config.text = DIALOG.START;
						config.buttons.unshift({text: "Start", id: "start"});
					}
				}
				else {
					config.text = DIALOG.STOP;
					config.buttons.unshift({text: "Stop", id: "stop"});
				}

				return config;
			})
			.then(function(config) {
				return messageFrame("display", {action:"showDialog", config:config});
			})
			.then(function(response) {
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
		fetch("<<ZAP_HUD_API>>/spider/action/scan/?url=" + domain + "/");

		loadTool(NAME)
			.then(function(tool) {
				tool.isRunning = true;
				tool.data = "0";

				saveTool(tool);
			})
			.catch(errorHandler);

		messageFrame("management", {action: "increaseDataPollRate"});
	}

	function stopSpider() {
		fetch("<<ZAP_HUD_API>>/spider/action/stop");

		loadTool(NAME)
			.then(function(tool) {
				tool.isRunning = false;
				tool.data = DATA.START;

				saveTool(tool);
			})
			.catch(errorHandler);

		messageFrame("management", {action: "decreaseDataPollRate"});
	}

	function checkIsRunning() {
		return new Promise(function(resolve) {
			loadTool(NAME)
				.then(function(tool) {
					resolve(tool.isRunning);
				});
		});
	}

	function onPollData(data) {
		// do something witht the data
		if (data.progress == "100") {
			stopSpider();
		}
		else if (data.progress !== "-1") {
			loadTool(NAME)
				.then(function(tool) {
					tool.data = data.progress;

					saveTool(tool);
				})
				.catch(errorHandler);
		}
	}

	function showOptions() {
		var config = {};

		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {remove: "Remove"};

		messageFrame("display", {action:"showButtonOptions", config:config})
			.then(function(response) {
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

	self.addEventListener("activate", function(event) {
		initializeStorage();
	});

	self.addEventListener("message", function(event) {
		var message = event.data;

		// Broadcasts
		switch(message.action) {
			case "initializeTools":
				initializeStorage();
				break;

			case "pollData":
				onPollData(message.pollData.spider);
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

	return {
		name: NAME,
		initialize: initializeStorage
	};
})();

self.tools[Spider.name] = Spider;
