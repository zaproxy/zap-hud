/*
 * Show HUD Errors
 *
 * Shows any errors that have been logged by the HUD, which helps when developing.
 */

var HudErrors = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "hudErrors";
	var LABEL = I18n.t("hud_errors_tool");
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
		tool.isSelected = false;
		tool.position = 0;
		tool.count = 0;

		utils.saveTool(tool);
	}

	function showDialog(tabId) {
		utils.loadTool(NAME)
			.then(tool => {
				var config = {};

				config.title = LABEL;
				config.text = tool.records.join('<br>');
				config.buttons = [
					{text:I18n.t("common_clear"), id:"clear"}
				];

				utils.messageFrame2(tabId, "display", {action:"showDialog", config:config})
					.then(response => {

						// Handle button choice
						if (response.id === "clear") {
							tool.data = 0;
							tool.records = [];
							tool.icon = ICONS.NONE;
							utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, data: tool.data, icon: ICONS.NONE, label: tool.label}});
							utils.saveTool(tool);
						}
						else {
							//cancel
						}
					});
			})
			.catch(utils.errorHandler);
	}

	function getTool(context, port) {
		utils.loadTool(NAME)
			.then(tool => {
				port.postMessage({label: tool.label, data: tool.data, icon: tool.icon});
			})
			.catch(utils.errorHandler);
	}

	function showOptions(tabId) {
		var config = {};

		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {remove: I18n.t("common_remove")};

		utils.messageFrame2(tabId, "display", {action:"showButtonOptions", config:config})
			.then(response => {
				// Handle button choice
				if (response.id == "remove") {
					utils.removeToolFromPanel(tabId, NAME);
				}
				else {
					//cancel
				}
			})
			.catch(utils.errorHandler);
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
					showDialog(message.tabId);
					break;

				case "buttonMenuClicked":
					showOptions(message.tabId);
					break;

				case "getTool":
					getTool(message.context, event.ports[0])
					break;

				default:
					break;
			}
		}
	});

	// this cannot keep up with rate of errors. high volume errors will be missed
	// this can be fixed if ff fixes their service worker implementation bug
	self.addEventListener("hud.error", event => utils.loadTool(NAME)
		.then(tool => {
			tool.data = tool.data + 1;
			tool.icon = ICONS.SOME;
			tool.records.push(event.detail.record);

			return Promise.all([utils.writeTool(tool), localforage.getItem(IS_SERVICEWORKER_REFRESHED)]);
		}).then(params => {
			let tool = params[0];
			let isServiceWorkerRefreshed = params[1];

			// we need to check if the serviceworker has taken control over the panels first
			// if not this will cause a NoClientError in the messageAllTab function which will send another
			// hud.error event and start a noisy loop
			if (isServiceWorkerRefreshed && tool.isSelected) {
				utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, data: tool.data, icon: ICONS.SOME, label: tool.label}});
			}
		})
		.catch(utils.errorHandler));

	return {
		name: NAME,
		initialize: initializeStorage
	};
})();

self.tools[HudErrors.name] = HudErrors;
