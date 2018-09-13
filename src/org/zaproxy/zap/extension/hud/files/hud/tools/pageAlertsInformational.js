/*
 * Informational Risk Page Alerts Tool
 *
 * Description goes here...
 */

var PageAlertsInformational = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "page-alerts-informational";
	var I18N = {
		ALERTS_PAGE_INFO_LABEL: "<<ZAP_I18N_hud.ui.alerts.page.info.tool>>",
	}
	var LABEL = I18N.ALERTS_PAGE_INFO_LABEL;
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

	function onPanelLoad(data) {
	}

	function showOptions() {
		alertUtils.showOptions(NAME, LABEL)
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
