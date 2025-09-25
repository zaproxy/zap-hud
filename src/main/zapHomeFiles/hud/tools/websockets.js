/*
 * WebSockets Tool
 *
 * Displays websocket messages in a tab at the bottom of the screen.
 */

const WebSockets = (function () {
	// Constants
	const NAME = 'websockets';
	const LABEL = I18n.t('websockets_tool');
	const ICONS = {};
	ICONS.CLOCK = 'clock.png';	// Not actually shown anywhere, should be
	// changed if it is going to be shown
	const tool = {};

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

	function getMessageDetails(channelId, messageId) {
		return apiCallWithResponse('websocket', 'view', 'message', {channelId, messageId})
			.catch(utils.errorHandler);
	}

	function showWebSocketMessageDetails(tabId, data) {
		if (!data) {
			throw new Error('Could not load WebSocket message details');
		}

		return utils.messageFrame(tabId, 'display', {action: 'showWebSocketMessage', config: data})
			.then(data => {
			// Handle button choice
				if (data.buttonSelected === 'replay') {
					apiCall('websocket', 'action', 'sendTextMessage', {
						channelId: data.channelId, outgoing: data.outgoing, message: data.message});
				}
			})
			.catch(utils.errorHandler);
	}

	function clearMessages() {
		utils.messageAllTabs('drawer', {action: 'setWebSockets', messages: []})
			.catch(utils.errorHandler);

		tool.messages = [];
		utils.writeTool(tool);
	}

	self.addEventListener('org.zaproxy.zap.extension.websocket.WebSocketEventPublisher', event => {
		const eventType = event.detail['event.type'];

		if (eventType === 'ws.message') {
			const message = {};

			const timeString = utils.timestampToTimeString(event.detail.timeSentInMs);

			message.timeInMs = event.detail.timeSentInMs;
			message.time = timeString;
			message.direction = event.detail.direction;
			message.length = event.detail.length;
			message.messageSummary = event.detail.messageSummary;
			message.opCode = event.detail.opCode + '=' + event.detail.opCodeString;
			message.channelId = event.detail.channelId;
			message.messageId = event.detail.messageId;

			utils.messageAllTabs('drawer', {action: 'updateWebSockets', messages: [message]})
				.catch(utils.errorHandler);

			tool.messages.push(message);
			utils.writeTool(tool);
		}
	});

	self.addEventListener('activate', _event => {
		initializeStorage();
		registerForZapEvents('org.zaproxy.zap.extension.websocket.WebSocketEventPublisher');
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

			case 'clearWebSocketsMessages':
				clearMessages();
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

				case 'showWebSocketMessageDetails':
					getMessageDetails(message.channelId, message.messageId)
						.then(data => {
							return showWebSocketMessageDetails(message.tabId, data);
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

self.tools[WebSockets.name] = WebSockets;
