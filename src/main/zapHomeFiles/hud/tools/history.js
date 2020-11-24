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

		const parsedRequestData = utils.parseRequestHeader(data.requestHeader);

		Promise.all([self.tools['active-scan'].isRunning(), self.tools.scope.isInScope(utils.parseDomainFromUrl(parsedRequestData.uri))])
			.then(results => {
				const isAscanRunning = results[0];
				const isInScope = results[1];

				const config = {
					request: {
						method: parsedRequestData.method,
						uri: parsedRequestData.uri,
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
		let request = header;

		if (body) {
			request = request + '\r\n\r\n' + body;
		}

		return apiCallWithResponse('core', 'action', 'sendRequest', {request})
			.catch(utils.errorHandler);
	}

	self.addEventListener('org.parosproxy.paros.extension.history.ProxyListenerLogEventPublisher', event => {
		const eventType = event.detail['event.type'];
		utils.log(LOG_DEBUG, 'HistoryEventPublisher eventListener', 'Received ' + eventType + ' event');

		const message = {};

		const date = new Date(Number(event.detail.timeSentInMs));
		const dateString = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '.' + date.getMilliseconds();

		message.timeInMs = event.detail.timeSentInMs;
		message.time = dateString;
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
