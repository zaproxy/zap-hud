/*
 * Active Scan Tool
 *
 * Description goes here...
 */

var ActiveScan = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "active-scan";
	var LABEL = "Active Scan";
	var DATA = {};
		DATA.START = "Start";
		DATA.STOP = "Stop";
	var ICONS = {};
		ICONS.OFF = "flame-grey.png";
		ICONS.ON = "flame.png";
	var DIALOG = {};
		DIALOG.START = "Start actively scanning this site?";
		DIALOG.START_ADD_SCOPE = "This site is not in scope.\nIn order to Active Scan the site you must add it to the scope.\nAdd the site to the scope and start Active Scanning it?";
		DIALOG.STOP = "The active scanner is currently running. Would you like to stop it?";

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
		tool.scanid = -1

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
				return messageFrame("mainDisplay", {action:"showDialog", config:config});
			})
			.then(function(response) {
				// Handle button choice
				if (response.id === "start") {
					startActiveScan(domain);
				}
				else if (response.id === "start-add-to-scope") {
					self.tools.scope.addToScope(domain)
						.then(
							startActiveScan(domain)
						);
				}
				else if (response.id === "stop") {
					stopActiveScan(domain);
				}
				else {
					//cancel
				}
			})
			.catch(function(error) {
				console.log(Error(error));
			});
	}

	function startActiveScan(domain) {
		fetch("<<ZAP_HUD_API>>JSON/ascan/action/scan/?url=" + domain + "/&apikey=<<ZAP_HUD_API_KEY>>").then(function(response) {
			response.json().then(function(data) {
				loadTool(NAME).then(function(tool) {
					tool.isRunning = true;
					tool.icon = ICONS.ON;
					tool.data = "0";
					tool.scanid = data.scan;
					saveTool(tool);
				});
			});
		});

		messageFrame("management", {action: "increaseDataPollRate"});
	}

	function stopActiveScan() {
		loadTool(NAME).then(function(tool) {
			fetch("<<ZAP_HUD_API>>JSON/ascan/action/stop?scanId=" + tool.scanId + "&apikey=<<ZAP_HUD_API_KEY>>");
			tool.isRunning = false;
			tool.icon = ICONS.OFF;
			tool.data = DATA.START;
			tool.scanid = -1;

			saveTool(tool);
		});

		messageFrame("management", {action: "decreaseDataPollRate"});
	}

	function checkIsRunning() {
		return new Promise(function(resolve) {
			loadTool(NAME).then(function(tool) {
				resolve(tool.isRunning);
			});
		});
	}

	function onPollData(data) {
		// do something witht the data
		if (data.progress == "100") {
			stopActiveScan();
		}
		else if (data.progress !== "-1") {
			loadTool(NAME).then(function(tool) {
			tool.data = data.progress;

			saveTool(tool);
		});
		}
	}

	function showOptions() {
		var config = {};

		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {remove: "Remove"};

		messageFrame("mainDisplay", {action:"showButtonOptions", config:config}).then(function(response) {
			// Handle button choice
			if (response.id == "remove") {
				removeToolFromPanel(NAME);
			}
			else {
				//cancel
			}
		});
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
				onPollData(message.pollData["active-scan"]);
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

self.tools[ActiveScan.name] = ActiveScan;