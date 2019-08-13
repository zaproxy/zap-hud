/*
 * Show Comments Tool
 *
 * Shows the number of comments on a page and allows them to be shown.
 */

var ShowComments = (function() {

	// Constants
	var NAME = "showComments";
	var LABEL = I18n.t("comments_tool");
	var ICONS = {};
		ICONS.OFF = "balloon-white.png";
		ICONS.OFF_WARN = "balloon-white-exclamation.png";
		ICONS.ON = "balloon.png";
		ICONS.ON_WARN = "balloon-yellow-exclamation.png";
	var SUSPICIOUS = ['TODO', 'FIXME', 'BUG', 'XXX', 'QUERY', 'DB', 
			'ADMIN', 'USER', 'PASSWORD', 'PWORD', 'PWD', 'SELECT'];

	// Variables - tab specific so dont need to be stored
	var loc = {};
	loc.data = 0;
	loc.isSuspicious = false;
	loc.icon = ICONS.OFF;
	loc.isRunning = false;

	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = 0;
		tool.icon = ICONS.OFF;
		tool.panel = "";
		tool.position = 0;

		utils.writeTool(tool);
	}

	function switchState(tabId) {
		if(!loc.isRunning) {
			switchOn(tabId);
		}
		else {
			switchOff(tabId);
		}
	}

	function switchOn(tabId) {
		utils.messageFrame(tabId, "management", {action:"showComments.on", suspicious: SUSPICIOUS});

		utils.loadTool(NAME)
			.then(tool => {
				loc.isRunning = true;
				if (loc.isSuspicious) {
					loc.icon = ICONS.ON_WARN;
				} else {
					loc.icon = ICONS.ON;
				}

				utils.messageFrame(tabId, tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, icon: loc.icon}});
			})
			.catch(utils.errorHandler);
	}

	function switchOff(tabId) {
		utils.messageFrame(tabId, "management", {action:"showComments.off"});

		utils.loadTool(NAME)
			.then(tool => {
				loc.isRunning = false;
				if (loc.isSuspicious) {
					loc.icon = ICONS.OFF_WARN;
				} else {
					loc.icon = ICONS.OFF;
				}

				utils.messageFrame(tabId, tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, icon: loc.icon}});
			})
			.catch(utils.errorHandler);
	}
	
	function setState(tabId, count, isSuspicious) {
		utils.loadTool(NAME)
			.then(tool => {
				loc.data = count;
				loc.isSuspicious = isSuspicious;
				
				if (isSuspicious) {
					if (loc.isRunning) {
						loc.icon = ICONS.ON_WARN;
					} else {
						loc.icon = ICONS.OFF_WARN;
					}
				} else {
					if (loc.isRunning) {
						loc.icon = ICONS.ON;
					} else {
						loc.icon = ICONS.OFF;
					}
				}
				utils.messageFrame(tabId, tool.panel, {action: 'updateData', tool: {name: NAME, data: count, icon: loc.icon}})
			})
			.catch(utils.errorHandler);

	}

	function showOptions(tabId) {
		var config = {};

		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {remove: I18n.t("common_remove")};

		utils.messageFrame(tabId, "display", {action:"showButtonOptions", config:config})
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

	function getTool(tabId, port) {
		if (loc.isRunning) {
			port.postMessage({label: LABEL, data: loc.data, icon: (loc.isSuspicious ? ICONS.ON_WARN : ICONS.ON)})
			utils.messageFrame(tabId, "management", 
				{action: 'showComments.on', suspicious: SUSPICIOUS})
		}
		else {
			port.postMessage({label: LABEL, data: loc.data, icon: (loc.isSuspicious ? ICONS.OFF_WARN : ICONS.OFF)})
		}

		utils.messageFrame(tabId, "management", 
			{action:"showComments.count", suspicious: SUSPICIOUS});
	}

	self.addEventListener("message", event => {
		var message = event.data;

		// Broadcasts
		switch(message.action) {
			case "initializeTools":
				initializeStorage();
				break;

			case "showComments.count":
				// Check its an int - its been supplied by the target domain so in theory could have been tampered with
				if (message.count === parseInt(message.count, 10) &&
						message.suspicious === parseInt(message.suspicious, 10)) {
					setState(message.tabId, message.count, message.suspicious > 0);
				}
				break;

			default:
				break;
		}

		// Directed
		if (message.tool === NAME) {
			switch(message.action) {
				case "buttonClicked":
					switchState(message.tabId);
					break;

				case "buttonMenuClicked":
					showOptions(message.tabId);
					break;

				case "getTool":
					getTool(message.tabId, event.ports[0]);

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

self.tools[ShowComments.name] = ShowComments;
