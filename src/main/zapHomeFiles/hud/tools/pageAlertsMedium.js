/*
 * Zed Attack Proxy (ZAP) and its related class files.
 *
 * ZAP is an HTTP/HTTPS proxy for assessing web application security.
 *
 * Copyright $YEAR The ZAP Development Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Medium Risk Page Alerts Tool
 *
 * Description goes here...
 */

const PageAlertsMedium = (function () {
	// Constants
	// todo: could probably switch this to a config file?
	const NAME = 'page-alerts-medium';
	const LABEL = I18n.t('alerts_page_medium_tool');
	const DIALOG = I18n.t('alerts_page_title');
	const DATA = {};
	DATA.NONE = '0';
	const ICONS = {};
	ICONS.PA = 'page-alerts-medium.png';
	const ALERT_TYPE = 'page-alerts';
	const ALERT_RISK = 'Medium';
	const ALERT_RISK_LABEL = I18n.t('alerts_risk_medium');

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

self.tools[PageAlertsMedium.name] = PageAlertsMedium;
