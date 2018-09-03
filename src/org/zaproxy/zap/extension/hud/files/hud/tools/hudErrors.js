/*
 * Show HUD Errors
 *
 * Shows any errors that have been logged by the HUD, which helps when developing.
 */

var HudErrors = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "hudErrors";
	var LABEL = "HUD Errors";
	var DATA = {};
	var ICONS = {};
		ICONS.NONE = "bug-grey.png";
		ICONS.SOME = "bug-red.png";

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = 0;
		tool.records = [];
		tool.icon = ICONS.NONE;
		tool.panel = "";
		tool.position = 0;
		tool.count = 0;

		saveTool(tool);
	}

	function showDialog() {
		loadTool(NAME)
			.then(tool => {
				var config = {};

				config.title = LABEL;
				config.text = tool.records.join('\n');
				config.buttons = [
					{text:"Clear", id:"clear"}
				];

				messageFrame("display", {action:"showDialog", config:config})
					.then(response => {

						// Handle button choice
						if (response.id === "clear") {
							tool.data = 0;
							tool.records = [];
							tool.icon = ICONS.NONE;
							saveTool(tool);
						}
						else {
							//cancel
						}
					});
			})
			.catch(errorHandler);
	}


	function showOptions() {
		var config = {};

		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {remove: "Remove"};

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
					showDialog();
					break;

				case "buttonMenuClicked":
					showOptions();
					break;

				default:
					break;
			}
		}
	});

	self.addEventListener("hud.error", event => loadTool(NAME)
		.then(tool => {
			tool.data = tool.data + 1;
			tool.icon = ICONS.SOME;
			tool.records.push(event.detail.record);
			return saveTool(tool);
		})
		.catch(errorHandler));

	return {
		name: NAME,
		initialize: initializeStorage
	};
})();

self.tools[HudErrors.name] = HudErrors;
