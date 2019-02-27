/*
 * Scope Tool
 *
 * Description goes here...
 */

var Scope = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "scope";
	var LABEL = I18n.t("scope_tool");
	var DATA = {};
		DATA.IN = I18n.t("common_in");
		DATA.OUT = I18n.t("common_out");
	var ICONS = {};
		ICONS.IN = "target.png";
		ICONS.OUT = "target-grey.png";
	var DIALOG = {};
		DIALOG.IN = I18n.t("scope_remove");
		DIALOG.OUT = I18n.t("scope_add");
		DIALOG.REQUIRED = I18n.t("scope_required");
	var HUD_CONTEXT = I18n.t("scope_hud_context");

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.OUT;
		tool.icon = ICONS.OUT;
		tool.isSelected = false;
		tool.hudContext = false;	// Set when we've added the HUD Context
		tool.panel = "";
		tool.position = 0;
		tool.urls = [];
		utils.writeTool(tool);
	}

	function showDialog(tabId, domain) {
		checkDomainInScope(domain)
			.then(isInScope => {
				var config = {};

				if(!isInScope) {
					config.title = LABEL;
					config.text = DIALOG.OUT;
					config.buttons = [
						{text:I18n.t("common_add"),
						id:"add"},
						{text:I18n.t("common_cancel"),
						id:"cancel"}
					];
				}
				else {
					config.text = DIALOG.IN;
					config.buttons = [
						{text:I18n.t("common_remove"),
						id:"remove"},
						{text:I18n.t("common_cancel"),
						id:"cancel"}
					];
				}

				utils.messageFrame(tabId, "display", {action:"showDialog", config:config})
					.then(response => {

						// Handle button choice
						if (response.id === "add") {
							addToScope(tabId, domain);
						}
						else if (response.id === "remove") {
							removeFromScope(tabId, domain);
						}
					});

			})
			.catch(utils.errorHandler);
	}

	function checkDomainInScope(domain) {
		return new Promise(resolve => {
			utils.loadTool(NAME)
				.then(tool => {
					let isInScope = tool.urls.includes(domain);
					resolve(isInScope);
				});
		});
	}

	function getUrlsInScope() {
		return utils.loadTool(NAME)
			.then(tool => {
				return tool.urls;
			})
	}

	function addToScope(tabId, domain) {
		return utils.loadTool(NAME)
			.then(tool => {
				if (! tool.hudContext) {
					// This can fail if the HUD context has already been added
					apiCall("context", "action", "newContext", { contextName: HUD_CONTEXT });
					tool.hudContext = true;
				}

				tool.urls.push(domain);

				utils.getUpgradedDomain(domain)
					.then(upgradedDomain => {
						return apiCallWithResponse("context", "action", "includeInContext", { contextName: HUD_CONTEXT, regex:  upgradedDomain + ".*" });
					})
					.catch(error => {
						utils.zapApiErrorDialog(tabId, error);
						throw error;
					})
					.then(response => {
						utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', context: {domain: domain}, tool: {name: NAME, data: DATA.IN, icon: ICONS.IN, label: LABEL}})
						return utils.writeTool(tool);
					})
					.catch(utils.errorHandler)
            })
			.catch(utils.errorHandler);
	}

	function removeFromScope(tabId, domain) {
		utils.getUpgradedDomain(domain)
			.then(upgradedDomain => {
				return apiCallWithResponse("context", "action", "excludeFromContext", { contextName: HUD_CONTEXT, regex:  upgradedDomain + ".*" });
			})
			.catch(error => {
				utils.zapApiErrorDialog(tabId, error);
				throw error;
			})
			.then(response => {
				// remove from list and save
				utils.loadTool(NAME)
					.then(tool => {
						tool.urls.splice(tool.urls.indexOf(domain), 1);

						utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', context: {domain: domain, url: ''}, tool: {name: NAME, data: DATA.OUT, icon: ICONS.OUT, label: LABEL}})

						utils.writeTool(tool);
					})
					.catch(utils.errorHandler);
			})
			.catch(utils.errorHandler)

	}

	function showOptions(tabId) {
		var config = {};

		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {remove: I18n.t("common_remove")};

		utils.messageFrame(tabId, "display", {action:"showButtonOptions", config:config})
			.then(response => {
				// Handle button choice
				if (response.id == "remove") {
					utils.removeToolFromPanel(tabId, NAME);
				}
			})
			.catch(utils.errorHandler);
	}

	function getTool(context, port) {
		checkDomainInScope(context.domain)
			.then(isInScope  => {
				if (isInScope) {
					port.postMessage({label: LABEL, data: DATA.IN, icon: ICONS.IN});
				}
				else {
					port.postMessage({label: LABEL, data: DATA.OUT, icon: ICONS.OUT});
				}
			})
			.catch(utils.errorHandler)
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
					showDialog(message.tabId, message.domain);
					break;

				case "buttonMenuClicked":
					showOptions(message.tabId);
					break;

				case 'getTool':
					getTool(message.context, event.ports[0]);
					break;

				default:
					break;
			}
		}
	});

	return {
		name: NAME,
		initialize: initializeStorage,
		addToScope: addToScope,
		isInScope: checkDomainInScope,
		getUrlsInScope: getUrlsInScope
	};
})();

self.tools[Scope.name] = Scope;
