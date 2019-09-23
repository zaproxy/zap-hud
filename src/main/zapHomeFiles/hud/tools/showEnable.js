/*
 * Show / Enable Tool
 *
 * Description goes here...
 */

const ShowEnable = (function () {
	// Constants
	// todo: could probably switch this to a config file?
	const NAME = 'showEnable';
	const LABEL = I18n.t('show_tool');
	const ICONS = {};
	ICONS.OFF = 'show-off.png';
	ICONS.ON = 'show-on.png';

	// Todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		const tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = 0;
		tool.icon = ICONS.OFF;
		tool.isSelected = false;
		tool.isRunning = false;
		tool.panel = '';
		tool.position = 0;
		tool.count = 0;

		utils.writeTool(tool);
	}

	function checkIsRunning() {
		return new Promise(resolve => {
			utils.loadTool(NAME)
				.then(tool => {
					resolve(tool.isRunning);
				});
		});
	}

	function switchState() {
		checkIsRunning()
			.then(isRunning => {
				if (!isRunning) {
					switchOn();
				} else {
					switchOff();
				}
			})
			.catch(utils.errorHandler);
	}

	function switchOn() {
		utils.messageAllTabs('management', {action: 'showEnable.on'});

		utils.loadTool(NAME)
			.then(tool => {
				tool.isRunning = true;
				tool.icon = ICONS.ON;

				utils.writeTool(tool);
				utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, icon: ICONS.ON}});
			})
			.catch(utils.errorHandler);
	}

	function switchOff() {
		utils.messageAllTabs('management', {action: 'showEnable.off'});

		utils.loadTool(NAME)
			.then(tool => {
				tool.isRunning = false;
				tool.icon = ICONS.OFF;

				utils.writeTool(tool);
				utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, icon: ICONS.OFF}});
			})
			.catch(utils.errorHandler);
	}

	function setCount(tabId, count) {
		utils.loadTool(NAME)
			.then(tool => {
				tool.data = count;

				utils.writeTool(tool);
				utils.messageFrame(tabId, tool.panel, {action: 'updateData', tool: {name: NAME, data: count}});
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
				if (response.id == 'remove') {
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
		utils.loadTool(NAME)
			.then(tool => {
				if (tool.isRunning) {
					port.postMessage({label: LABEL, data: 0, icon: ICONS.ON});
					utils.messageFrame(tabId, 'management', {action: 'showEnable.on'});
				} else {
					port.postMessage({label: LABEL, data: 0, icon: ICONS.OFF});
				}

				utils.messageFrame(tabId, 'management', {action: 'showEnable.count'});
			})
			.catch(utils.errorHandler);
	}

	self.addEventListener('message', event => {
		const message = event.data;

		// Broadcasts
		switch (message.action) {
			case 'initializeTools':
				initializeStorage();
				break;

			case 'showEnable.count':
				// The message from the target domain will have been validated in management.js
				setCount(message.tabId, message.count);
				break;

			default:
				break;
		}

		// Directed
		if (message.tool === NAME) {
			switch (message.action) {
				case 'buttonClicked':
					switchState();
					break;

				case 'buttonMenuClicked':
					showOptions(message.tabId);
					break;

				case 'getTool':
					getTool(message.tabId, event.ports[0]);

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

self.tools[ShowEnable.name] = ShowEnable;
