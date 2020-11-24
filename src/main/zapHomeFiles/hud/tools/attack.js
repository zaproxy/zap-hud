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
 * Attack mode Tool
 *
 * Allows the user to switch attack mode on and off
 */

const Attack = (function () {
	// Constants
	// todo: could probably switch this to a config file?
	const NAME = 'attack';
	const LABEL = I18n.t('attack_tool');
	const DATA = {};
	DATA.ON = I18n.t('common_on');
	DATA.OFF = I18n.t('common_off');
	const ICONS = {};
	ICONS.ON = 'crosshairs.png';
	ICONS.OFF = 'crosshairs-grey.png';
	const DIALOG = {};
	DIALOG.ON = I18n.t('attack_start');
	DIALOG.OFF = I18n.t('attack_stop');

	// Todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		const tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.OFF;
		tool.icon = ICONS.OFF;
		tool.isSelected = false;
		tool.panel = '';
		tool.position = 0;
		tool.isRunning = false;
		tool.attackingDomain = '';

		utils.writeTool(tool);
	}

	function showDialog(tabId, domain) {
		checkIsRunning(domain)
			.then(isRunning => {
				const config = {};

				if (!isRunning) {
					config.text = DIALOG.OFF;
					config.buttons = [
						{text: I18n.t('common_turn_on'),
							id: 'turnon'},
						{text: I18n.t('common_cancel'),
							id: 'cancel'}
					];
				} else {
					config.text = DIALOG.ON;
					config.buttons = [
						{text: I18n.t('common_turn_off'),
							id: 'turnoff'},
						{text: I18n.t('common_cancel'),
							id: 'cancel'}
					];
				}

				utils.messageFrame(tabId, 'display', {action: 'showDialog', config})
					.then(response => {
						// Handle button choice
						if (response.id === 'turnon') {
							turnOnAttackMode(tabId, domain);
						} else if (response.id === 'turnoff') {
							turnOffAttackMode(tabId);
						}
					})
					.catch(utils.errorHandler);
			})
			.catch(utils.errorHandler);
	}

	function turnOnAttackMode(tabId, domain) {
		apiCallWithResponse('core', 'action', 'setMode', {mode: 'attack'})
			.catch(error => {
				utils.zapApiErrorDialog(tabId, error);
				throw error;
			})
			.then(response => {
				utils.loadTool(NAME)
					.then(tool => {
						tool.isRunning = true;
						tool.attackingDomain = domain;
						tool.icon = ICONS.ON;
						tool.data = DATA.ON;

						utils.writeTool(tool);
						utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', context: {notDomain: domain}, tool: {name: NAME, label: LABEL, data: DATA.OFF, icon: ICONS.OFF}, isToolDisabled: true});
						utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', context: {domain}, tool: {name: NAME, label: LABEL, data: DATA.ON, icon: ICONS.ON}});
					})
					.catch(utils.errorHandler);
			});
	}

	function turnOffAttackMode(tabId) {
		apiCallWithResponse('core', 'action', 'setMode', {mode: 'standard'})
			.catch(error => {
				utils.zapApiErrorDialog(tabId, error);
				throw error;
			})
			.then(response => {
				utils.loadTool(NAME)
					.then(tool => {
						tool.isRunning = false;
						tool.attackingDomain = '';
						tool.icon = ICONS.OFF;
						tool.data = DATA.OFF;

						utils.writeTool(tool);
						utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, label: LABEL, data: DATA.OFF, icon: ICONS.OFF}, isToolDisabled: false});
					})
					.catch(utils.errorHandler);
			});
	}

	function checkIsRunning(domain) {
		return new Promise(resolve => {
			utils.loadTool(NAME)
				.then(tool => {
					resolve(tool.attackingDomain === domain);
				});
		});
	}

	function getTool(tabId, context, port) {
		utils.loadTool(NAME)
			.then(tool => {
				if (context.domain === tool.attackingDomain) {
					port.postMessage({label: LABEL, data: DATA.ON, icon: ICONS.ON});
				} else if (tool.isRunning) {
					port.postMessage({label: LABEL, data: DATA.OFF, icon: ICONS.OFF, isDisabled: true});
				} else {
					port.postMessage({label: LABEL, data: DATA.OFF, icon: ICONS.OFF});
				}
			})
			.catch(utils.errorHandler);
	}

	function showOptions(tabId) {
		const config = {};

		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {remove: I18n.t('common_remove')};

		utils.messageFrame(tabId, 'display', {action: 'showButtonOptions', config})
			.then(response => {
				// Handle button choice
				if (response.id === 'remove') {
					utils.removeToolFromPanel(tabId, NAME);
				} else {
					// Cancel
				}
			})
			.catch(utils.errorHandler);
	}

	self.addEventListener('activate', event => {
		initializeStorage();
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
					showDialog(message.tabId, message.domain);
					break;

				case 'buttonMenuClicked':
					showOptions(message.tabId);
					break;

				case 'getTool':
					getTool(message.tabId, message.context, event.ports[0]);
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

self.tools[Attack.name] = Attack;
