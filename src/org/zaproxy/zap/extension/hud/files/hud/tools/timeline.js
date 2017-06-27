/*
 * Timeline Tool
 *
 * Description goes here...
 */

var Timeline = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "timeline";
	var LABEL = "Timeline";
	var DATA = {};
		DATA.SHOW = "Show";
		DATA.HIDE = "Hide";
	var ICONS = {};
		ICONS.CLOCK = "clock.png";

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.SHOW;
		tool.icon = ICONS.CLOCK;
		tool.isSelected = false;
		tool.panel = "";
		tool.isRunning = false;

		saveTool(tool);
	}

	function toggleTimeline() {
		checkIsRunning().then(function(isRunning) {
			if (isRunning) {
				hideTimeline();
			}
			else {
				showTimeline();
			}
		}).catch(function(error) {
			console.log(Error(error));
		});
	}

	function showTimeline() {
		messageFrame("management", {action:"showTimeline"});
		loadTool(NAME).then(function(tool) {
			tool.data = DATA.HIDE;
			tool.isRunning = true;

			saveTool(tool);
		});
	}

	function hideTimeline() {
		messageFrame("management", {action:"hideTimeline"});
		loadTool(NAME).then(function(tool) {
			tool.data = DATA.SHOW;
			tool.isRunning = false;

			saveTool(tool);
		});
	}

	function checkIsRunning() {
		return new Promise(function(resolve) {
			loadTool(NAME).then(function(tool) {
				resolve(tool.isRunning);
			});
		});
	}

	function onPanelLoad(data) {
		return checkIsRunning().then(function(isRunning) {
			if (isRunning) {
				
			}
			else {
				
			}
		});
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

			default:
				break;
		}

		// Directed
		if (message.tool === NAME) {
			switch(message.action) {
				case "buttonClicked":
					toggleTimeline();
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
		onPanelLoad: onPanelLoad,
		initialize: initializeStorage
	};
})();

self.tools[Timeline.name] = Timeline;