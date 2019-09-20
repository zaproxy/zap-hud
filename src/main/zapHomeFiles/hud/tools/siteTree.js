/*
 * SiteTree Tool
 *
 * Description goes here...
 */

const SiteTree = (function () {
	// Constants
	// todo: could probably switch this to a config file?
	const NAME = 'site-tree';
	const LABEL = I18n.t('sites_tool');
	const DATA = {};
	DATA.SITES = I18n.t('sites_status');
	const ICONS = {};
	ICONS.WORLD = 'world.png';

	// Todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		const tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.SITES;
		tool.icon = ICONS.WORLD;
		tool.isSelected = false;
		tool.panel = '';
		tool.position = 0;
		tool.urls = [];

		utils.writeTool(tool);
	}

	function showSiteTree(tabId) {
		utils.messageFrame(tabId, 'display', {action: 'showSiteTree'})
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

	function getTool(port) {
		utils.loadTool(NAME)
			.then(tool => {
				port.postMessage({label: LABEL, data: DATA.SITES, icon: ICONS.WORLD});
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
					showSiteTree(message.tabId);
					break;

				case 'buttonMenuClicked':
					showOptions(message.tabId);
					break;

				case 'getTool':
					getTool(event.ports[0]);
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

self.tools[SiteTree.name] = SiteTree;
