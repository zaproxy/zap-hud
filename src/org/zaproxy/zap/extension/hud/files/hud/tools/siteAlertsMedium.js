/*
 * Medium Risk Site Alerts Tool
 *
 * Description goes here...
 */

var SiteAlertsMedium = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "site-alerts-medium";
	var LABEL = "Medium Risk Site Alerts";
	var DATA = {};
		DATA.NONE = "0";
	var ICONS = {};
        ICONS.PA = "site-alerts-medium.png";
    var ALERT_TYPE = "site-alerts"
    var ALERT_RISK = "medium"

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
		alertUtils.showAlerts(NAME, url, ALERT_RISK);
	}

	function updateAlertCount(url) {
		return alertUtils.updateAlertCount(NAME, url);
	}

	function onPanelLoad(data) {
		return alertUtils.updateAlertCount(NAME, data.url);
	}

	function onPollData(url, data) {
		alertUtils.onPollData(NAME, url, data, ALERT_RISK);
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

			case "pollData":
				onPollData(message.targetUrl, message.pollData.siteAlerts);
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

self.tools[SiteAlertsMedium.name] = SiteAlertsMedium;