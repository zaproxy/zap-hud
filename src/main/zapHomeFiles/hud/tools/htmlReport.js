/*
 * HTML Report tool
 *
 * When selected displays the standard HTML report in a new window / tab
 */

const HtmlReport = (function () {
	// Constants
	// todo: could probably switch this to a config file?
	const NAME = 'htmlReport';
	const LABEL = I18n.t('html_report_tool');
	const ICON = 'report.png';

	// Todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		const tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = '';
		tool.icon = ICON;
		tool.panel = '';
		tool.position = 0;
		utils.writeTool(tool);
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
				}
			})
			.catch(utils.errorHandler);
	}

	function showHtmlReport(tabId) {
		utils.messageFrame(tabId, 'display', {action: 'showHtmlReport'})
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
					showHtmlReport(message.tabId);
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

self.tools[HtmlReport.name] = HtmlReport;
