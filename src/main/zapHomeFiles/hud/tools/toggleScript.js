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
 * Toggle Script tool
 *
 * When selected, allows a user to choose a Script to toggle.
 * Togglable scripts MUST have an enabled property in order to be selected.
 * When left-clicked after a script is selected, will toggle that script to its opposite state.
 */

const ToggleScript = (function () {
	// Constants
	const NAME = 'toggleScript';
	const LABEL = I18n.t('togglescript_tool');
	const ICON = {};
	ICON.DEFAULT = 'script-add.png';
	ICON.ON = 'script-enabled.png';
	ICON.OFF = 'script-disabled.png';
	const DATA = {};
	DATA.ON = I18n.t('common_on');
	DATA.OFF = I18n.t('common_off');
	const NO_SCRIPTS_FOUND = I18n.t('togglescript_no_scripts_found');
	const SELECT = I18n.t('togglescript_select');
	const SCRIPT = I18n.t('togglescript_script');
	let selectedScript;

	function initializeStorage() {
		const tool = {};
		tool.name = NAME;
		tool.data = '';
		tool.panel = '';
		tool.position = 0;
		tool.label = LABEL;
		tool.icon = ICON.DEFAULT;
		utils.writeTool(tool);
	}

	// Select a script and update the UI accordingly
	function showOptions(tabId) {
		// Pop up a menu to select a script
		selectScript(tabId)
			.then(result => {
				if (!result.remove && result !== {}) {
					selectedScript = result.selected;
					updateUI();
				} else if (result !== {}) {
					selectedScript = null;
					// Reset the tool before removing it, so it shows up as default in the 'Add Tools' menu
					// Load the tool so that panel and other properties don't get messed with
					utils.loadTool(NAME).then(tool => {
						tool.data = '';
						tool.label = LABEL;
						tool.icon = ICON.DEFAULT;
						return tool;
					}).then(tool => {
						utils.writeTool(tool);
					}).then(() => {
						utils.removeToolFromPanel(tabId, NAME);
					});
				}
			});
	}

	function toggleScript(tabId) {
		if (selectedScript) {
			// Choose which API to execute based on enabled status
			const action = selectedScript.enabled ?
				'disable' :
				'enable';
			apiCallWithResponse('script', 'action', action, {scriptName: selectedScript.name})
				.catch(utils.errorHandler)
				.then(() => {
					selectedScript.enabled = !selectedScript.enabled;
					updateUI();
				});
		} else {
			showOptions(tabId);
		}
	}

	function updateUI() {
		const data = selectedScript.enabled ? DATA.ON : DATA.OFF;
		const icon = selectedScript.enabled ? ICON.ON : ICON.OFF;
		utils.loadTool(NAME).then(tool => {
			tool.data = data;
			tool.icon = icon;
			utils.writeTool(tool)
				.then(() => {
					utils.messageAllTabs(tool.panel, {
						action: 'broadcastUpdate',
						tool: {
							name: NAME,
							label: tool.label,
							data: tool.data,
							icon: tool.icon
						}
					});
				});
		}).catch(utils.errorHandler);
	}

	// Display Dropdown showing a list of scripts that can be manipulated
	function selectScript(tabId) {
		const config = {};
		let allScripts;
		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {};

		return Promise.all([
			apiCallWithResponse('script', 'view', 'listScripts'),
			apiCallWithResponse('script', 'view', 'listTypes')
		])
			.catch(utils.errorHandler)
			.then(([data, {listTypes}]) => {
				// Filter out built-in scripts & flatten types list
				return [
					data.listScripts.filter(script => (script.enabled !== undefined)),
					Object.fromEntries(listTypes.map(type => [type.name, type.uiName]))
				];
			})
			.then(([scripts, types]) => {
				allScripts = scripts;
				config.options = scripts.map(script => {
					const type = types[script.type];
					return `${SELECT} ${type} ${SCRIPT}: ${script.name}`;
				});
				if (config.options.length === 0) {
					config.options.push(NO_SCRIPTS_FOUND);
				}

				config.options.push('Remove');
				return utils.messageFrame(tabId, 'display', {action: 'showButtonOptions', config});
			})
			.then(response => {
				const result = {};
				// AllScripts does not contain the Remove option, so if response.id === allScripts.length, Remove must have been selected.
				if (response.id < allScripts.length) {
					result.selected = allScripts[response.id];
					result.selected.enabled = result.selected.enabled === 'true';
					result.remove = false;
				} else if (response.id !== 0) {
					// Remove will never have an ID of 0, as it will come after results or NO_RESULTS_FOUND
					result.remove = true;
				}

				return result;
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
				// Icon is left-clicked
				// As per #335: "clicking on the tool would toggle the script on and off"
				case 'buttonClicked':
					toggleScript(message.tabId);
					break;

				// Icon is right-clicked
				// As per #335: "right clicking it would give the option to change script"
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

self.tools[ToggleScript.name] = ToggleScript;
