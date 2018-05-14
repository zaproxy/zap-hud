/*
 * High Risk Site Alerts Tool
 *
 * Description goes here...
 */

var SiteAlertsHigh = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "site-alerts-high";
	var LABEL = "High Risk Site Alerts";
	var DATA = {};
		DATA.NONE = "0";
	var ICONS = {};
        ICONS.PA = "site-alerts-high.png";
    var ALERT_TYPE = "site-alerts"
    var ALERT_RISK = "high"

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

	function showAlerts(domain) {
		alertUtils.showAlerts(LABEL, domain, ALERT_RISK);
	}

	function onPanelLoad(data) {
		//return alertUtils.updateAlertCount(NAME, data.domain);
	}

	function showOptions() {
		alertUtils.showOptions(NAME, LABEL)
	}

	self.addEventListener("activate", function(event) {
		initializeStorage();
	});

	self.addEventListener("commonAlerts.High", function(event) {
		return loadTool(NAME)
			.then(function(tool) {
				tool.data = event.detail.count;
				return saveTool(tool);
			})
			.catch(errorHandler);
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
					showAlerts(message.domain);
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

self.tools[SiteAlertsHigh.name] = SiteAlertsHigh;
