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
		tool.isRunning = false;

		saveTool(tool);
	}

	function showDialog(domain) {

		checkIsRunning().then(function(isRunning) {
			var config = {};

			if(!isRunning) {
				config.text = DIALOG.START;
				config.buttons = [
					{text:"Start",
					 id:"start"},
					{text:"Cancel",
					 id:"cancel"}
				];
			}
			else {
				config.text = DIALOG.STOP;
				config.buttons = [
					{text:"Stop",
					 id:"stop"},
					{text:"Cancel",
					 id:"cancel"}
				];
			}

			messageFrame("mainDisplay", {action:"showDialog", config:config}).then(function(response) {
				// Handle button choice
				if (response.id === "start") {
					self.tools.scope.requireScope(domain).then(function() {
						startActiveScan(domain);
					});
				}
				else if (response.id === "stop") {
					stopActiveScan(domain);
				}
				else {
					//cancel
				}
			});

		}).catch(function(error) {
			console.log(Error(error));
		});
	}

	function startActiveScan(domain) {
		fetch("<<ZAP_HUD_API>>JSON/ascan/action/scan/?url=" + domain + "/&apikey=<<ZAP_HUD_API_KEY>>").then(function(response) {
			response.json().then(function(json) {
				//todo: handle response if needed
				//console.log(json)
			});
		});

		loadTool(NAME).then(function(tool) {
			tool.isRunning = true;
			tool.icon = ICONS.ON;
			tool.data = "0";

			saveTool(tool);
		});

		messageFrame("management", {action: "increaseDataPollRate"});
	}

	function stopActiveScan() {
		fetch("<<ZAP_HUD_API>>JSON/ascan/action/stop?apikey=<<ZAP_HUD_API_KEY>>");

		loadTool(NAME).then(function(tool) {
			tool.isRunning = false;
			tool.icon = ICONS.OFF;
			tool.data = DATA.START;

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