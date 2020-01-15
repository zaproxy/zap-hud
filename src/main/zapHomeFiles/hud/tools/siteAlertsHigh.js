/*
 * High Risk Site Alerts Tool
 *
 * Description goes here...
 */

const SiteAlertsHigh = (function () {
	// Constants
	// todo: could probably switch this to a config file?
	const NAME = 'site-alerts-high';
	const LABEL = I18n.t('alerts_site_high_tool');
	const DIALOG = I18n.t('alerts_site_title');
	const DATA = {};
	DATA.NONE = '0';
	const ICONS = {};
	ICONS.PA = 'site-alerts-high.png';
	const ALERT_TYPE = 'site-alerts';
	const ALERT_RISK = 'High';
	const ALERT_RISK_LABEL = I18n.t('alerts_risk_high');

	// Todo: change this to a util function that reads in a config file (json/xml)
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

	function showAlerts(tabId, domain) {
		alertUtils.showSiteAlerts(tabId, DIALOG, domain, ALERT_RISK_LABEL);
	}

	function showOptions(tabId) {
		alertUtils.showOptions(tabId, NAME, LABEL);
	}

	self.addEventListener('activate', event => {
		initializeStorage();
	});

	self.addEventListener('commonAlerts.High', event => utils.loadTool(NAME)
		.then(tool => {
			tool.data = event.detail.count;

			if (tool.isSelected) {
				utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', context: {domain: event.detail.domain}, tool: {name: NAME, data: event.detail.count}});
			}

			return utils.writeTool(tool);
		})
		.catch(utils.errorHandler));

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
					showAlerts(message.tabId, message.domain);
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

self.tools[SiteAlertsHigh.name] = SiteAlertsHigh;
