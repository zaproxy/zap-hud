/*
 * High Risk Page Alerts Tool
 *
 * Description goes here...
 */

var PageAlertsHigh = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "page-alerts-high";
	var LABEL = "High Risk Page Alerts";
	var DATA = {};
		DATA.NONE = "0";
	var ICONS = {};
        ICONS.PA = "page-alerts-high.png";
    var ALERT_TYPE = "page-alerts"
    var ALERT_RISK = "High"

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

	self.addEventListener("targetload", function(event) {
		return alertUtils.updatePageAlertCount(NAME, event.detail.url, ALERT_RISK);
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

self.tools[PageAlertsHigh.name] = PageAlertsHigh;
