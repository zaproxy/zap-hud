/*
 * Show / Enable Tool
 *
 * Description goes here...
 */

var ShowEnable = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "showEnable";
	var LABEL = I18n.t("show_tool");
	var DATA = {};
	var ICONS = {};
		ICONS.OFF = "show-off.png";
		ICONS.ON = "show-on.png";

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = 0;
		tool.icon = ICONS.OFF;
		tool.isSelected = false;
		tool.isRunning = false;
		tool.panel = "";
		tool.position = 0;
		tool.count = 0;

		saveTool(tool);
	}


	function checkIsRunning() {
		return new Promise(resolve => {
			loadTool(NAME)
				.then(tool => {
					resolve(tool.isRunning);
				});
		});
	}

	function switchState() {
		checkIsRunning()
			.then(isRunning => {
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
			.then(tool => {
				tool.isRunning = true;
				tool.icon = ICONS.ON;

				saveTool(tool);
			})
			.catch(errorHandler);
	}

	function switchOff() {
		messageFrame("management", {action:"showEnable.off"});

		loadTool(NAME)
			.then(tool => {
				tool.isRunning = false;
				tool.icon = ICONS.OFF;

				saveTool(tool);
			})
			.catch(errorHandler);
	}
	
	function setCount(count) {
		loadTool(NAME)
			.then(tool => {
				tool.data = count;
				saveTool(tool);
			})
			.catch(errorHandler);
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

	self.addEventListener("targetload", event => {
			checkIsRunning()
				.then(isRunning => {
					if (isRunning) {
						switchOn();
					}
					else {
						switchOff();
					}
					// Ask for the count of hidden fields
					messageFrame("management", {action:"showEnable.count"});
				})
				.catch(errorHandler);
	});

	self.addEventListener("message", event => {
		var message = event.data;

		// Broadcasts
		switch(message.action) {
			case "initializeTools":
				initializeStorage();
				break;

			case "showEnable.count":
				// Check its an int - its been supplied by the target domain so in theory could have been tampered with
				if (message.count === parseInt(message.count, 10)) {
					setCount(message.count);
				}
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
					showOptions(message.tabId);
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
