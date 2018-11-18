/*
 * High Risk Page Alerts Tool
 *
 * Description goes here...
 */

var PageAlertsHigh = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "page-alerts-high";
	var LABEL = I18n.t("alerts_page_high_tool");
	var DATA = {};
		DATA.NONE = "0";
	var ICONS = {};
        ICONS.PA = "page-alerts-high.png";
    var ALERT_TYPE = "page-alerts";
    var ALERT_RISK = "High";

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

	function showAlerts(tabId, url) {
		alertUtils.showPageAlerts(tabId, LABEL, url, ALERT_RISK);
	}

	function showOptions(tabId) {
		alertUtils.showOptions(tabId, NAME, LABEL)
	}

	self.addEventListener("activate", event => {
		initializeStorage();
	});

	self.addEventListener("commonAlerts.pageAlerts", event => {
		if (targetUrl === event.detail.target) {
			return alertUtils.setPageAlerts(NAME, event.detail.pageAlerts[ALERT_RISK]);
		}
	});

	self.addEventListener("org.zaproxy.zap.extension.alert.AlertEventPublisher", event => {
		if (event.detail['event.type'] === 'alert.added') {
			return alertUtils.updatePageAlertCount(NAME, targetUrl, event.detail, ALERT_RISK);
		}
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
					showAlerts(message.tabId, message.url);
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

self.tools[PageAlertsHigh.name] = PageAlertsHigh;
