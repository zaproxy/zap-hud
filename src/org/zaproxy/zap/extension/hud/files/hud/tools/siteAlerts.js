/*
 * Site Alerts Tool
 *
 * Description goes here...
 */

var SiteAlerts = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "site-alerts-all";
	var LABEL = "Site Alerts";
	var DATA = {};
		DATA.NONE = "0";
	var ICONS = {};
		ICONS.SA = "site-alerts.png";
	var ALERT_TYPE = "site-alerts"

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.NONE;
		tool.icon = ICONS.SA;
		tool.alertType = ALERT_TYPE
		tool.isSelected = false;
		tool.panel = "";
		tool.position = 0;
		tool.alerts = {};
		tool.cache = {};

		saveTool(tool);
	}

	function showAlerts(domain) {
		alertUtils.showAlerts(NAME, domain);
	}

	function updateAlertCount(domain) {
		return alertUtils.updateAlertCount(NAME, domain);
	}


	function onPanelLoad(data) {
		return alertUtils.updateAlertCount(NAME, data.domain);
	}

	function onPollData(domain, data) {
		alertUtils.onPollData(NAME, domain, data);	
	}
		
	function showOptions() {
		alertUtils.showOptions(NAME, LABEL);
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
				onPollData(message.targetDomain, message.pollData.siteAlerts);
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

				case "showAlertDetails":
					alertUtils.showAlertDetails(message.id);
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

self.tools[SiteAlerts.name] = SiteAlerts;
