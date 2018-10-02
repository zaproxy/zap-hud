/*
 * Attack mode Tool
 *
 * Allows the user to switch attack mode on and off
 */

var Attack = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "attack";
	var LABEL = I18n.t("attack_tool");
	var DATA = {};
		DATA.ON = I18n.t("common_on");
		DATA.OFF = I18n.t("common_off");
	var ICONS = {};
		ICONS.ON = "flame.png";
		ICONS.OFF = "flame-grey.png";
	var DIALOG = {};
		DIALOG.ON = I18n.t("attack_start");
		DIALOG.OFF = I18n.t("attack_stop");

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

		checkIsRunning()
			.then(isAttackMode => {
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

				messageFrame("display", {action:"showDialog", config:config})
					.then(response => {
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
					})
					.catch(errorHandler);

			})
			.catch(errorHandler);
	}

	function turnOnAttackMode(domain) {
			fetch("<<ZAP_HUD_API>>/core/action/setMode/?mode=attack");

			loadTool(NAME)
				.then(tool => {
					tool.isRunning = true;
					tool.icon = ICONS.ON;
					tool.data = DATA.ON;

					saveTool(tool);
				})
				.catch(errorHandler);
	}

	function turnOffAttackMode() {
		fetch("<<ZAP_HUD_API>>/core/action/setMode/?mode=standard");

		loadTool(NAME)
			.then(tool => {
				tool.isRunning = false;
				tool.icon = ICONS.OFF;
				tool.data = DATA.OFF;

				saveTool(tool);
			})
			.catch(errorHandler);
	}

	function checkIsRunning() {
		return new Promise(resolve => {
			loadTool(NAME)
				.then(tool => {
					resolve(tool.isRunning);
				});
		});
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
