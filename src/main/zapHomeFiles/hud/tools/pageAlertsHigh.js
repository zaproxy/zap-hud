/*
 * High Risk Page Alerts Tool
 *
 * Description goes here...
 */

const PageAlertsHigh = (function () {
	// Constants
	const NAME = 'page-alerts-high';
	const LABEL = I18n.t('alerts_page_high_tool');
	const DIALOG = I18n.t('alerts_page_title');
	const DATA = {};
	DATA.NONE = '0';
	const ICONS = {};
	ICONS.PA = 'page-alerts-high.png';
	const ALERT_TYPE = 'page-alerts';
	const ALERT_RISK = 'High';
	const ALERT_RISK_LABEL = I18n.t('alerts_risk_high');

	function initializeStorage() {
		const tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.NONE;
		tool.icon = ICONS.PA;
		tool.alertType = ALERT_TYPE;
		tool.alertRisk = ALERT_RISK;
		tool.isSelected = false;
		tool.panel = '';
		tool.position = 0;
		tool.alerts = {};
		tool.cache = {};

		utils.writeTool(tool);
	}

	function showAlerts(tabId, url) {
		alertUtils.showPageAlerts(tabId, DIALOG, url, ALERT_RISK_LABEL);
	}

	function showOptions(tabId) {
		alertUtils.showOptions(tabId, NAME, LABEL);
	}

	self.addEventListener('activate', event => {
		initializeStorage();
	});

	self.addEventListener('commonAlerts.pageAlerts', event => {
		return alertUtils.setPageAlerts(NAME, event.detail.target, event.detail.pageAlerts[ALERT_RISK]);
	});

	self.addEventListener('org.zaproxy.zap.extension.alert.AlertEventPublisher', event => {
		if (event.detail['event.type'] === 'alert.added' && event.detail.riskString === ALERT_RISK) {
			utils.loadTool(NAME)
				.then(tool => {
					if (tool.isSelected) {
						return alertUtils.updatePageAlertCount(NAME, event.detail);
					}
				})
				.catch(utils.errorHandler);
		}
	});

	self.addEventListener('message', event => {
		const message = event.data;

		// Broadcasts
		switch (message.action) {
			case 'initializeTools':
				initializeStorage();
				break;

			default:
				break;
		}

		// Directed
		if (message.tool === NAME) {
			switch (message.action) {
				case 'buttonClicked':
					showAlerts(message.tabId, message.url);
					break;

				case 'buttonMenuClicked':
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
