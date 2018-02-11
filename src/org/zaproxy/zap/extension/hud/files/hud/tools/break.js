/*
 * Break Tool
 *
 * Description goes here...
 */

var Break = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "break";
	var LABEL = "Break";
	var DATA = {};
		DATA.OFF = "Off";
		DATA.ON = "On";
	var ICONS = {};
		ICONS.OFF = "break-off.png";
		ICONS.ON = "break-on.png";
	var DIALOG = {};
		DIALOG.START = "Start breaking?";
		DIALOG.STOP = "Stop breaking?";

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.OFF;
		tool.icon = ICONS.OFF;
		tool.isSelected = false;
		tool.isRunning = false;
		tool.panel = "";
		tool.position = 0;

		saveTool(tool);
	}

	function showDialog(domain) {

		checkIsRunning().then(function(isRunning) {
			var config = {};

			if(!isRunning) {
				config.text = DIALOG.START;
				config.buttons = [
					{text:"On",
					 id:"on"},
					{text:"Cancel",
					 id:"cancel"}
				];
			}
			else {
				config.text = DIALOG.STOP;
				config.buttons = [
					{text:"Off",
					 id:"off"},
					{text:"Cancel",
					 id:"cancel"}
				];
			}

			messageFrame("display", {action:"showDialog", config:config}).then(function(response) {

				// Handle button choice
				if (response.id === "on") {
					startBreaking();
				}
				else if (response.id === "off") {
					stopBreaking();
				}
				else {
					//cancel
				}
			});

		}).catch(function(error) {
			console.log(Error(error));
		});
	}

	function startBreaking() {
		fetch("<<ZAP_HUD_API>>/break/action/break/?type=http-all&state=true").then(function(response) {
			response.json().then(function(json) {
				//todo: handle response if needed
			});
		});

		loadTool(NAME).then(function(tool) {
			tool.isRunning = true;
			tool.data = DATA.ON;
			tool.icon = ICONS.ON;

			saveTool(tool);
		});
	}

	// todo: change this to 'continue' and figure out / fix stopBreaking
	function stopBreaking() {
		fetch("<<ZAP_HUD_API>>/break/action/continue").then(function(response) {
			response.json().then(function(json) {
				//todo: handle response if needed
			});
		});

		loadTool(NAME).then(function(tool) {
			tool.isRunning = false;
			tool.data = DATA.OFF;
			tool.icon = ICONS.OFF;

			saveTool(tool);
		});
	}

	function step() {
		fetch("<<ZAP_HUD_API>>/break/action/step/").then(function(response) {
			response.json().then(function(json) {
				//todo: handle response if needed
			});
		});
	}

	function setHttpMessage(method, header, body) {
		return fetch("<<ZAP_HUD_API>>/break/action/setHttpMessage/?formMethod=" + method + "&httpHeader=" + header + "&httpBody=" + body );
	}

	function checkIsRunning() {
		return new Promise(function(resolve) {
			loadTool(NAME).then(function(tool) {
				resolve(tool.isRunning);
			});
		});
	}

	function onPollData(data) {
		if (data.isBreakingRequest === "true") {
			showBreakDisplay(data);
		}
	}

	function showBreakDisplay(data) {
		var config = {};

		if (data.response_body === "") {
			config.headerText = data.request_header;
			config.bodyText = data.request_body;
		}
		else {
			config.headerText = data.response_header;
			config.bodyText = data.response_body;
		}
		config.buttons = [
			{text:"Step",
			 id:"step"},
			{text:"Continue",
			 id:"continue"}
		];

		messageFrame("display", {action:"showHttpMessage", config:config}).then(function(response) {

			// Handle button choice
			if (response.id === "step") {
				setHttpMessage(response.method, response.header, response.body).then(function() {
					step();
				});
			}
			else if (response.id === "continue") {
				setHttpMessage(response.method, response.header, response.body).then(function() {
					stopBreaking();
				});			}
			else {
				//cancel
			}
		});
	}

	function showOptions() {
		var config = {};

		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {remove: "Remove"};

		messageFrame("display", {action:"showButtonOptions", config:config}).then(function(response) {
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
				onPollData(message.pollData.break);
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

self.tools[Break.name] = Break;
