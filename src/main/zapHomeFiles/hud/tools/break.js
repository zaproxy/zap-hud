/*
 * Break Tool
 *
 * Description goes here...
 */

var Break = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "break";
	var LABEL = I18n.t("break_tool");
	var DATA = {};
		DATA.OFF = I18n.t("common_off");
		DATA.ON = I18n.t("common_on");
	var ICONS = {};
		ICONS.OFF = "break-off.png";
		ICONS.ON = "break-on.png";
	var DIALOG = {};
		DIALOG.START = "Start breaking?";
		DIALOG.STOP = "Stop breaking?";

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.OFF;
		tool.icon = ICONS.OFF;
		tool.isSelected = false;
		tool.isRunning = false;
		tool.panel = "";
		tool.position = 0;

		writeTool(tool);
		registerForZapEvents("org.zaproxy.zap.extension.brk.BreakEventPublisher");
	}

	function toggleBreak() {
		loadTool(NAME)
			.then(tool => {
				if (tool.data === DATA.OFF) {
					startBreaking();
				}
				else {
					stopBreaking();
				}
			})
			.catch(errorHandler)
	}

	function showDialog(domain) {

		checkIsRunning()
			.then(isRunning => {
				var config = {};

				if(!isRunning) {
					config.text = DIALOG.START;
					config.buttons = [
						{text:"On",
						id:"on"},
						{text:"Cancel",
						id:"cancel"}
					];
				}
				else {
					config.text = DIALOG.STOP;
					config.buttons = [
						{text:"Off",
						id:"off"},
						{text:"Cancel",
						id:"cancel"}
					];
				}

				messageFrame("display", {action:"showDialog", config:config}).then(response => {

					// Handle button choice
					if (response.id === "on") {
						startBreaking();
					}
					else if (response.id === "off") {
						stopBreaking();
					}
					else {
						//cancel
					}
				});

			})
			.catch(errorHandler);
	}

	function startBreaking() {
		fetch("<<ZAP_HUD_API>>/break/action/break/?type=http-all&state=true")
			.catch(errorHandler);

		loadTool(NAME)
			.then(tool => {
				tool.isRunning = true;
				tool.data = DATA.ON;
				tool.icon = ICONS.ON;

				messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, data: DATA.ON, icon: ICONS.ON}})
				writeTool(tool);
			})
			.catch(errorHandler);
	}

	// todo: change this to 'continue' and figure out / fix stopBreaking
	function stopBreaking() {
		fetch("<<ZAP_HUD_API>>/break/action/continue")
			.catch(errorHandler);

		loadTool(NAME)
			.then(tool => {
				tool.isRunning = false;
				tool.data = DATA.OFF;
				tool.icon = ICONS.OFF;

				messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, data: DATA.OFF, icon: ICONS.OFF}})
				writeTool(tool)
			})
			.catch(errorHandler);
	}

	function step() {
		return fetch("<<ZAP_HUD_API>>/break/action/step/")
			.catch(errorHandler);
	}

	function drop() {
		return fetch("<<ZAP_HUD_API>>/break/action/drop/")
			.catch(errorHandler);
	}

	function setHttpMessage(header, body) {
		let url = "<<ZAP_HUD_API>>/break/action/setHttpMessage/";
		let params = "httpHeader=" + encodeURIComponent(header) + "&httpBody=" + encodeURIComponent(body)

		let init = {
			method: "POST",
			body: params,
			headers: {'content-type': 'application/x-www-form-urlencoded'} 
		};

		return fetch(url, init)
			.catch(errorHandler);
	}

	function checkIsRunning() {
		return new Promise(resolve => {
			loadTool(NAME)
				.then(tool => {
					resolve(tool.isRunning);
				});
		});
	}

	function showBreakDisplay(data) {
		var config = {
			request: {
				header: '',
				body: ''
			},
			response: {
				header: '',
				body: ''
			},
			isResponseDisabled: true,
			activeTab: "Request"
		};

		if ('responseBody' in data) {
			config.response.header = data.responseHeader.trim();
			config.response.body = data.responseBody;
			config.isResponseDisabled = false;
			config.activeTab = "Response";
		}
		
		config.request.method = parseRequestHeader(data.requestHeader).method;
		config.request.header = data.requestHeader.trim();
		config.request.body = data.requestBody;

		messageAllTabs("display", {action:"showBreakMessage", config:config})
			.then(response => {
				// Handle button choice
				if (response.buttonSelected === "step") {
					setHttpMessage(response.header, response.body)
						.then(() => {
							step();
							messageAllTabs('display', {action:'closeModals', config: {notTabId: response.tabId}})
						})
						.catch(errorHandler);
				}
				else if (response.buttonSelected === "continue") {
					setHttpMessage(response.header, response.body)
						.then(() => {
							stopBreaking();
							messageAllTabs('display', {action:'closeModals', config: {notTabId: response.tabId}})
						})
						.catch(errorHandler);
				}
				else if (response.buttonSelected === "drop") {
					drop();
					messageAllTabs('display', {action:'closeModals', config: {notTabId: response.tabId}})
				}
				else {
					//cancel
				}
			})
			.catch(errorHandler);
	}

	function showOptions(tabId) {
		var config = {};

		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {remove: I18n.t("common_remove"), filter: "Add Filter"};

		messageFrame2(tabId, "display", {action:"showButtonOptions", config:config})
			.then(response => {
				// Handle button choice
				if (response.id == "remove") {
					removeToolFromPanel(tabId, NAME);
				}
			})
			.catch(errorHandler);
	}

	self.addEventListener("activate", event => {
		initializeStorage();
	});

	self.addEventListener("message", event => {
		var message = event.data;

		// Broadcasts
		switch(message.action) {
			case "initializeTools":
				initializeStorage();
				break;

			default:
				break;
		}

		// Directed
		if (message.tool === NAME) {
			switch(message.action) {
				case "buttonClicked":
					toggleBreak();
					break;

				case "buttonMenuClicked":
					showOptions(message.tabId);
					break;

				default:
					break;
			}
		}
	});

	self.addEventListener("org.zaproxy.zap.extension.brk.BreakEventPublisher", event => {
		if (event.detail['event.type'] === 'break.active' && event.detail['messageType'] === 'HTTP') {
			showBreakDisplay(event.detail);
		}
	});

	return {
		name: NAME,
		initialize: initializeStorage
	};
})();

self.tools[Break.name] = Break;
