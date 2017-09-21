/*
 * Attack mode Tool
 *
 * Allows the user to switch attack mode on and off
 */

var Attack = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "attack";
	var LABEL = "Attack Mode";
	var DATA = {};
		DATA.ON = "On";
		DATA.OFF = "Off";
	var ICONS = {};
		ICONS.ON = "flame.png";
		ICONS.OFF = "flame-grey.png";
	var DIALOG = {};
		DIALOG.ON = "Turn off Attack Mode?";
		DIALOG.OFF = "Turn on Attack Mode? This will cause ZAP to automatically attack all pages in scope.";

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.OFF;
		tool.icon = ICONS.OFF;
		tool.isSelected = false;
		tool.panel = "";
		tool.position = 0;
		tool.isAttackMode = false;

		saveTool(tool);
	}

	function showDialog(domain) {

		checkIsRunning().then(function(isAttackMode) {
			var config = {};

			if(!isAttackMode) {
				config.text = DIALOG.OFF;
				config.buttons = [
					{text:"Turn on",
					 id:"turnon"},
					{text:"Cancel",
					 id:"cancel"}
				];
			}
			else {
				config.text = DIALOG.ON;
				config.buttons = [
					{text:"Turn off",
					 id:"turnoff"},
					{text:"Cancel",
					 id:"cancel"}
				];
			}

			messageFrame("mainDisplay", {action:"showDialog", config:config}).then(function(response) {

				// Handle button choice
				if (response.id === "turnon") {
					turnOnAttackMode();
				}
				else if (response.id === "turnoff") {
					turnOffAttackMode();
				}
				else {
					//cancel
				}
			});

		}).catch(function(error) {
			console.log(Error(error));
		});
	}

	function turnOnAttackMode(domain) {
		fetch("<<ZAP_HUD_API>>JSON/core/action/setMode/?mode=attack").then(function(response) {
			response.json().then(function(json) {
				//todo: handle response if needed
				//console.log(json)
			});
		});

		loadTool(NAME).then(function(tool) {
			tool.isRunning = true;
			tool.icon = ICONS.ON;
			tool.data = DATA.ON;

			saveTool(tool);
		});
	}

	function turnOffAttackMode() {
		fetch("<<ZAP_HUD_API>>JSON/core/action/setMode/?mode=standard");

		loadTool(NAME).then(function(tool) {
			tool.isRunning = false;
			tool.icon = ICONS.OFF;
			tool.data = DATA.OFF;

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

self.tools[Attack.name] = Attack;
