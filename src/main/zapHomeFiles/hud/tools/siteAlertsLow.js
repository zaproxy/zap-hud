/*
 * Low Risk Site Alerts Tool
 *
 * Description goes here...
 */

var SiteAlertsLow = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "site-alerts-low";
	var LABEL = I18n.t("alerts_site_low_tool");
	var DATA = {};
		DATA.NONE = "0";
	var ICONS = {};
        ICONS.PA = "site-alerts-low.png";
    var ALERT_TYPE = "site-alerts"
    var ALERT_RISK = "Low"

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
		alertUtils.showSiteAlerts(LABEL, domain, ALERT_RISK);
	}

	function showOptions(tabId) {
		alertUtils.showOptions(tabId, NAME, LABEL)
	}

	self.addEventListener("activate", event => {
		initializeStorage();
	});

	self.addEventListener("commonAlerts.Low", event => loadTool(NAME)
        .then(tool => {
            tool.data = event.detail.count;
            return saveTool(tool);
        })
        .catch(errorHandler));

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
					showAlerts(message.domain);
					break;

				case "buttonMenuClicked":
					showOptions(message.tabId);
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

self.tools[SiteAlertsLow.name] = SiteAlertsLow;
