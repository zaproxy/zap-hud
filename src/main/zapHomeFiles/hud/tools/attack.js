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
		tool.isRunning = false;
		tool.attackingDomain = '';

		saveTool(tool);
	}

	function showDialog(tabId, domain) {

		checkIsRunning(domain)
			.then(isRunning => {
				var config = {};

				if(!isRunning) {
					config.text = DIALOG.OFF;
					config.buttons = [
						{text:I18n.t("common_turn_on"),
						id:"turnon"},
						{text:I18n.t("common_cancel"),
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

				messageFrame2(tabId, "display", {action:"showDialog", config:config})
					.then(response => {
						// Handle button choice
						if (response.id === "turnon") {
							turnOnAttackMode(domain);
						}
						else if (response.id === "turnoff") {
							turnOffAttackMode(domain);
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
					tool.attackingDomain = domain;
					tool.icon = ICONS.ON;
					tool.data = DATA.ON;

					writeTool(tool);
					messageAllTabs(tool.panel, {action: 'broadcastUpdate', context: {notDomain: domain}, tool: {name: NAME, label: LABEL, data: DATA.OFF, icon: ICONS.OFF}, isToolDisabled: true})
					messageAllTabs(tool.panel, {action: 'broadcastUpdate', context: {domain: domain}, tool: {name: NAME, label: LABEL, data: DATA.ON, icon: ICONS.ON}});
				})
				.catch(errorHandler);
	}

	function turnOffAttackMode() {
		fetch("<<ZAP_HUD_API>>/core/action/setMode/?mode=standard");

		loadTool(NAME)
			.then(tool => {
				tool.isRunning = false;
				tool.attackingDomain = '';
				tool.icon = ICONS.OFF;
				tool.data = DATA.OFF;

				writeTool(tool);
				messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, label: LABEL, data: DATA.OFF, icon: ICONS.OFF}, isToolDisabled: false})
			})
			.catch(errorHandler);
	}

	function checkIsRunning(domain) {
		return new Promise(resolve => {
			loadTool(NAME)
				.then(tool => {
					resolve(tool.attackingDomain === domain);
				});
		});
	}

	function getTool(tabId, context, port) {
		loadTool(NAME)
			.then(tool => {
				if (context.domain === tool.attackingDomain) {
					port.postMessage({label: LABEL, data: DATA.ON, icon: ICONS.ON});
				}
				else if (tool.isRunning) {
					port.postMessage({label: LABEL, data: DATA.OFF, icon: ICONS.OFF, isDisabled: true});
				} else {
					port.postMessage({label: LABEL, data: DATA.OFF, icon: ICONS.OFF});
				}
			})
			.catch(errorHandler)
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
					removeToolFromPanel(tabId, NAME);
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
					showDialog(message.tabId, message.domain);
					break;

				case "buttonMenuClicked":
					showOptions(message.tabId);
					break;

				case "getTool":
					getTool(message.tabId, message.context, event.ports[0]);
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
