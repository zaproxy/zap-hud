/*
 * Low Risk Page Alerts Tool
 *
 * Description goes here...
 */

var PageAlertsLow = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "page-alerts-low";
	var LABEL = I18n.t("alerts_page_low_tool");
	var DATA = {};
		DATA.NONE = "0";
	var ICONS = {};
        ICONS.PA = "page-alerts-low.png";
    var ALERT_TYPE = "page-alerts"
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

		utils.writeTool(tool);
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
		return alertUtils.setPageAlerts(NAME, event.detail.target, event.detail.pageAlerts[ALERT_RISK]);
	});

	self.addEventListener("org.zaproxy.zap.extension.alert.AlertEventPublisher", event => {
		if (event.detail['event.type'] === 'alert.added' && event.detail.riskString === ALERT_RISK) {
			utils.loadTool(NAME)
				.then(tool => {
					if (tool.isSelected) {
						return alertUtils.updatePageAlertCount(NAME, event.detail)
					}
				})
				.catch(utils.errorHandler)
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

self.tools[PageAlertsLow.name] = PageAlertsLow;
