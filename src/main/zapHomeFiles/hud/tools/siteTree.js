/*
 * SiteTree Tool
 *
 * Description goes here...
 */

var SiteTree = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "site-tree";
	var LABEL = I18n.t("sites_tool");
	var DATA = {};
		DATA.SITES = I18n.t("sites_status");
	var ICONS = {};
		ICONS.WORLD = "world.png";

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.SITES;
		tool.icon = ICONS.WORLD;
		tool.isSelected = false;
		tool.panel = "";
		tool.position = 0;
		tool.urls = [];

		saveTool(tool);
	}

	function showSiteTree(tabId) {
		messageFrame2(tabId, "display", {action:"showSiteTree"})
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
					removeToolFromPanel(tabId, NAME);
				}
				else {
					//cancel
				}
			})
			.catch(errorHandler);
	}

	function getTool(port) {
		loadTool(NAME)
			.then(tool => {
				port.postMessage({label: LABEL, data: DATA.SITES, icon: ICONS.WORLD});
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
					showSiteTree(message.tabId);
					break;

				case "buttonMenuClicked":
					showOptions(message.tabId);
					break;

				case "getTool":
					getTool(event.ports[0]);
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

self.tools[SiteTree.name] = SiteTree;
