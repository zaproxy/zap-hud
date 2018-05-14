/*
 * Page Alerts Tool
 *
 * Description goes here...
 */

var PageAlerts = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "page-alerts-all";
	var LABEL = "Page Alerts";
	var DATA = {};
		DATA.NONE = "0";
	var ICONS = {};
		ICONS.PA = "page-alerts.png";
	var ALERT_TYPE = "page-alerts"

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.NONE;
		tool.icon = ICONS.PA;
		tool.alertType = ALERT_TYPE;
		tool.isSelected = false;
		tool.panel = "";
		tool.position = 0;
		tool.alerts = {};
		tool.cache = {};

		saveTool(tool);
	}

	function showAlerts(url) {
		alertUtils.showAlerts(NAME, url);
	}

	function updateAlertCount(url) {
		return alertUtils.updateAlertCount(NAME, url);
	}


	function onPanelLoad(data) {
		return alertUtils.updateAlertCount(NAME, data.url);
	}

	function showOptions() {
		alertUtils.showOptions(NAME, LABEL)
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
					showAlerts(message.url);
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

self.tools[PageAlerts.name] = PageAlerts;
