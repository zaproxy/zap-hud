/*
 * Show / Enable Tool
 *
 * Description goes here...
 */

var ShowEnable = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "showEnable";
	var LABEL = "Show / Enable";
	var DATA = {};
		DATA.OFF = "Off";
		DATA.ON = "On";
	var ICONS = {};
		ICONS.OFF = "show-off.png";
		ICONS.ON = "show-on.png";

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


	function checkIsRunning() {
		return new Promise(function(resolve) {
			loadTool(NAME)
				.then(function(tool) {
					resolve(tool.isRunning);
				});
		});
	}

	function switchState() {
		checkIsRunning()
			.then(function(isRunning) {
				if(!isRunning) {
					switchOn();
				}
				else {
					switchOff();
				}
			})
			.catch(errorHandler);
	}

	function switchOn() {
		messageFrame("management", {action:"showEnable.on"});

		loadTool(NAME)
			.then(function(tool) {
				tool.isRunning = true;
				tool.data = DATA.ON;
				tool.icon = ICONS.ON;

				saveTool(tool);
			})
			.catch(errorHandler);
	}

	function switchOff() {
		messageFrame("management", {action:"showEnable.off"});

		loadTool(NAME)
			.then(function(tool) {
				tool.isRunning = false;
				tool.data = DATA.OFF;
				tool.icon = ICONS.OFF;

				saveTool(tool);
			})
			.catch(errorHandler);
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

	self.addEventListener("targetload", function(event) {
			checkIsRunning()
				.then(function(isRunning) {
					if (isRunning) {
						switchOn();
					}
					else {
						switchOff();
					}
				})
				.catch(errorHandler);
	});

	self.addEventListener("message", function(event) {
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
					switchState();
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

self.tools[ShowEnable.name] = ShowEnable;
