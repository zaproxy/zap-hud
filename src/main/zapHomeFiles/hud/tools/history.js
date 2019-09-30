/*
 * History Tool
 *
 * Description goes here...
 */

const History = (function () {
	// Constants
	// todo: could probably switch this to a config file?
	const NAME = 'history';
	const LABEL = I18n.t('history_tool');
	const ICONS = {};
	ICONS.CLOCK = 'clock.png';
	const tool = {};

	// Todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = 0;
		tool.icon = ICONS.CLOCK;
		tool.isSelected = false;
		tool.isHidden = true;
		tool.panel = '';
		tool.position = 0;
		tool.messages = [];

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
				if (response.id === 'remove') {
					utils.removeToolFromPanel(tabId, NAME);
				}
			})
			.catch(utils.errorHandler);
	}

	function getMessageDetails(id) {
		return apiCallWithResponse('core', 'view', 'message', {id})
			.then(json => json.message)
			.catch(utils.errorHandler);
	}

	function showHttpMessageDetails(tabId, data) {
		if (!data) {
			throw new Error('Could not load HTTP message details');
		}

		const parsedReqData = utils.parseRequestHeader(data.requestHeader);

		Promise.all([self.tools['active-scan'].isRunning(), self.tools.scope.isInScope(utils.parseDomainFromUrl(parsedReqData.uri))])
			.then(results => {
				const isAscanRunning = results[0];
				const isInScope = results[1];

				const config = {
					request: {
						method: parsedReqData.method,
						uri: parsedReqData.uri,
						header: data.requestHeader.trim(),
						body: data.requestBody
					},
					response: {
						header: data.responseHeader.trim(),
						body: data.responseBody
					},
					isResponseDisabled: false,
					isAscanDisabled: !isInScope || isAscanRunning,
					activeTab: 'Request'
				};

				if ('activeTab' in data) {
					config.activeTab = data.activeTab;
				}

				return utils.messageFrame(tabId, 'display', {action: 'showHistoryMessage', config})
					.then(data => {
						// Handle button choice
						if (data.buttonSelected === 'replay') {
							sendRequest(data.header, data.body)
								.then(json => {
									const data = json.sendRequest[0];
									data.activeTab = 'Response';
									return showHttpMessageDetails(tabId, data);
								})
								.catch(utils.errorHandler);
						}
					})
					.catch(utils.errorHandler);
			})
			.catch(utils.errorHandler);
	}

	function sendRequest(header, body) {
		let req = header;

		if (body) {
			req = req + '\r\n\r\n' + body;
		}

		return apiCallWithResponse('core', 'action', 'sendRequest', {request: req})
			.catch(utils.errorHandler);
	}

	self.addEventListener('org.parosproxy.paros.extension.history.ProxyListenerLogEventPublisher', event => {
		const eventType = event.detail['event.type'];
		utils.log(LOG_DEBUG, 'HistoryEventPublisher eventListener', 'Received ' + eventType + ' event');

		const message = {};

		const date = new Date(Number(event.detail.timeSentInMs));
		const dateStr = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '.' + date.getMilliseconds();

		message.timeInMs = event.detail.timeSentInMs;
		message.time = dateStr;
		message.method = event.detail.method;
		message.url = event.detail.uri;
		message.code = event.detail.statusCode;
		message.id = event.detail.historyReferenceId;

		utils.messageAllTabs('drawer', {action: 'updateMessages', messages: [message]})
			.catch(utils.errorHandler);

		tool.messages.push(message);
		utils.writeTool(tool);
	});

	self.addEventListener('activate', event => {
		initializeStorage();
		registerForZapEvents('org.parosproxy.paros.extension.history.ProxyListenerLogEventPublisher');
	});

	function trimMessages(lastPageUnloadTime) {
		utils.loadTool(NAME)
			.then(tool => {
				tool.messages = tool.messages.filter(message => message.timeInMs > lastPageUnloadTime);
				utils.writeTool(tool);
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

			case 'unload':
				trimMessages(message.time);
				break;

			default:
				break;
		}

		// Directed
		if (message.tool === NAME) {
			switch (message.action) {
				case 'buttonMenuCicked':
					showOptions(message.tabId);
					break;

				case 'showHttpMessageDetails':
					getMessageDetails(message.id)
						.then(data => {
							return showHttpMessageDetails(message.tabId, data);
						})
						.catch(utils.errorHandler);
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

self.tools[History.name] = History;
