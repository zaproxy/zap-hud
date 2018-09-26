/*
 * SiteTree Tool
 *
 * Description goes here...
 */

var SiteTree = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "site-tree";
	var I18N = {
		SITES_LABEL: "<<ZAP_I18N_hud.ui.sites.tool>>",
		SITES_STATUS: "<<ZAP_I18N_hud.ui.sites.status>>",
	}
	var LABEL = I18N.SITES_LABEL;
	var DATA = {};
		DATA.SITES = I18N.SITES_STATUS;
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

	function showSiteTree() {
		messageFrame("display", {action:"showSiteTree"})
			.catch(errorHandler);
	}

	function onPanelLoad(data) {
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
					showSiteTree();
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

self.tools[SiteTree.name] = SiteTree;
