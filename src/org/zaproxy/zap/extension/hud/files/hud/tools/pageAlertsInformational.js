/*
 * Informational Risk Page Alerts Tool
 *
 * Description goes here...
 */

var PageAlertsInformational = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "page-alerts-informational";
	var LABEL = "Informational Risk Page Alerts";
	var DATA = {};
		DATA.NONE = "0";
	var ICONS = {};
        ICONS.PA = "page-alerts-informational.png";
    var ALERT_TYPE = "page-alerts"
    var ALERT_RISK = "Informational"

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.NONE;
        tool.icon = ICONS.PA;
        tool.alertType = ALERT_TYPE;
        tool.alertRisk = ALERT_RISK;
		tool.isSelected = false;
		tool.panel = "";
		tool.position = 0;
		tool.alerts = {};
		tool.cache = {};

		saveTool(tool);
	}

	function showAlerts(url) {
		alertUtils.showPageAlerts(LABEL, url, ALERT_RISK);
	}

	function updateAlertCount(url) {
		return alertUtils.updateAlertCount(NAME, url);
	}

	function onPanelLoad(data) {
	}

	function showOptions() {
		alertUtils.showOptions(NAME, LABEL)
	}

	self.addEventListener("activate", function(event) {
		initializeStorage();
	});

	self.addEventListener("commonAlerts." + ALERT_RISK, function(event) {
		return alertUtils.updatePageAlertCount(NAME, targetUrl, ALERT_RISK);
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

self.tools[PageAlertsInformational.name] = PageAlertsInformational;
