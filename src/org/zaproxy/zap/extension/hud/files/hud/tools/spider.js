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
		tool.isRunning = false;

		saveTool(tool);
	}

	function showDialog(domain) {

		checkIsRunning().then(function(isSpidering) {
			var config = {};

			if(!isSpidering) {
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
					startSpider(domain);
				}
				else if (response.id === "stop") {
					stopSpider(domain);
				}
				else {
					//cancel
				}
			});

		}).catch(function(error) {
			console.log(Error(error));
		});
	}

	function startSpider(domain) {
		fetch("<<ZAP_HUD_API>>JSON/spider/action/scan/?url=" + domain + "/&apikey=<<ZAP_HUD_API_KEY>>").then(function(response) {
			response.json().then(function(json) {
				//todo: handle response if needed
				//console.log(json)
			});
		});

		loadTool(NAME).then(function(tool) {
			tool.isRunning = true;
			tool.data = "0";

			saveTool(tool);
		});

		messageFrame("management", {action: "increasePollRate"});
	}

	function stopSpider() {
		fetch("<<ZAP_HUD_API>>JSON/spider/action/stop?apikey=<<ZAP_HUD_API_KEY>>");

		loadTool(NAME).then(function(tool) {
			tool.isRunning = false;
			tool.data = DATA.START;

			saveTool(tool);
		});

		messageFrame("management", {action: "decreasePollRate"});
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
			stopSpider();
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