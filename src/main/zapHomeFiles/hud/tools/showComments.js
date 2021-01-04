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
 * Show Comments Tool
 *
 * Shows the number of comments on a page and allows them to be shown.
 */

const ShowComments = (function () {
	// Constants
	const NAME = 'showComments';
	const LABEL = I18n.t('comments_tool');
	const ICONS = {};
	ICONS.OFF = 'balloon-white.png';
	ICONS.OFF_WARN = 'balloon-white-exclamation.png';
	ICONS.ON = 'balloon.png';
	ICONS.ON_WARN = 'balloon-yellow-exclamation.png';
	const SUSPICIOUS = ['TODO',
		'FIXME',
		'BUG',
		'XXX',
		'QUERY',
		'DB',
		'ADMIN',
		'USER',
		'PASSWORD',
		'PWORD',
		'PWD',
		'SELECT'];

	// Variables - tab specific so don't need to be stored
	const loc = {};
	loc.data = 0;
	loc.isSuspicious = false;
	loc.icon = ICONS.OFF;
	loc.isRunning = false;

	function initializeStorage() {
		const tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = 0;
		tool.icon = ICONS.OFF;
		tool.panel = '';
		tool.position = 0;

		utils.writeTool(tool);
	}

	function switchState(tabId) {
		if (!loc.isRunning) {
			switchOn(tabId);
		} else {
			switchOff(tabId);
		}
	}

	function switchOn(tabId) {
		utils.messageFrame(tabId, 'management', {action: 'showComments.on', suspicious: SUSPICIOUS});

		utils.loadTool(NAME)
			.then(tool => {
				loc.isRunning = true;
				if (loc.isSuspicious) {
					loc.icon = ICONS.ON_WARN;
				} else {
					loc.icon = ICONS.ON;
				}

				utils.messageFrame(tabId, tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, icon: loc.icon}});
			})
			.catch(utils.errorHandler);
	}

	function switchOff(tabId) {
		utils.messageFrame(tabId, 'management', {action: 'showComments.off'});

		utils.loadTool(NAME)
			.then(tool => {
				loc.isRunning = false;
				if (loc.isSuspicious) {
					loc.icon = ICONS.OFF_WARN;
				} else {
					loc.icon = ICONS.OFF;
				}

				utils.messageFrame(tabId, tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, icon: loc.icon}});
			})
			.catch(utils.errorHandler);
	}

	function setState(tabId, count, isSuspicious) {
		utils.loadTool(NAME)
			.then(tool => {
				loc.data = count;
				loc.isSuspicious = isSuspicious;

				if (isSuspicious) {
					if (loc.isRunning) {
						loc.icon = ICONS.ON_WARN;
					} else {
						loc.icon = ICONS.OFF_WARN;
					}
				} else if (loc.isRunning) {
					loc.icon = ICONS.ON;
				} else {
					loc.icon = ICONS.OFF;
				}

				utils.messageFrame(tabId, tool.panel, {action: 'updateData', tool: {name: NAME, data: count, icon: loc.icon}});
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

	function getTool(tabId, port) {
		if (loc.isRunning) {
			port.postMessage({label: LABEL, data: loc.data, icon: (loc.isSuspicious ? ICONS.ON_WARN : ICONS.ON)});
			utils.messageFrame(tabId, 'management',
				{action: 'showComments.on', suspicious: SUSPICIOUS});
		} else {
			port.postMessage({label: LABEL, data: loc.data, icon: (loc.isSuspicious ? ICONS.OFF_WARN : ICONS.OFF)});
		}

		utils.messageFrame(tabId, 'management',
			{action: 'showComments.count', suspicious: SUSPICIOUS});
	}

	self.addEventListener('message', event => {
		const message = event.data;

		// Broadcasts
		switch (message.action) {
			case 'initializeTools':
				initializeStorage();
				break;

			case 'showComments.count':
				// Check its an int - its been supplied by the target domain so in theory could have been tampered with
				if (message.count === Number.parseInt(message.count, 10) &&
						message.suspicious === Number.parseInt(message.suspicious, 10)) {
					setState(message.tabId, message.count, message.suspicious > 0);
				}

				break;

			default:
				break;
		}

		// Directed
		if (message.tool === NAME) {
			switch (message.action) {
				case 'buttonClicked':
					switchState(message.tabId);
					break;

				case 'buttonMenuClicked':
					showOptions(message.tabId);
					break;

				case 'getTool':
					getTool(message.tabId, event.ports[0]);
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

self.tools[ShowComments.name] = ShowComments;
