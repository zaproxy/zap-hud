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
	var HUD_CONTEXT = encodeURI(I18n.t("scope_hud_context"));

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
		writeTool(tool);
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

				messageFrame2(tabId, "display", {action:"showDialog", config:config})
					.then(response => {

						// Handle button choice
						if (response.id === "add") {
							addToScope(domain);
						}
						else if (response.id === "remove") {
							removeFromScope(domain);
						}
					});

			})
			.catch(errorHandler);
	}

	function checkDomainInScope(domain) {
		return new Promise(resolve => {
			loadTool(NAME)
				.then(tool => {
					let isInScope = tool.urls.includes(domain);
					resolve(isInScope);
				});
		});
	}

	function addToScope(domain) {
		return loadTool(NAME)
			.then(tool => {
				if (! tool.hudContext) {
					zapApiCall("/context/action/newContext/?contextName=" + HUD_CONTEXT)
					tool.hudContext = true;
				}

				tool.urls.push(domain);

				getUpgradedDomain(domain)
					.then(upgradedDomain => {
						return zapApiCall("/context/action/includeInContext/?contextName=" + HUD_CONTEXT + "&regex=" + upgradedDomain + ".*")
					})
					.then(response => {
						if (!response.ok) {
							log (LOG_ERROR, 'scope.addToScope', 'Failed to add ' + domain + ' to scope');
						}
					})
					.catch(errorHandler)

				messageAllTabs(tool.panel, {action: 'broadcastUpdate', context: {domain: domain}, tool: {name: NAME, data: DATA.IN, icon: ICONS.IN, label: LABEL}})

                return writeTool(tool);
            })
			.catch(errorHandler);
	}

	function removeFromScope(domain) {
		getUpgradedDomain(domain)
			.then(upgradedDomain => {
				return zapApiCall("/context/action/excludeFromContext/?contextName=" + HUD_CONTEXT + "&regex=" + upgradedDomain + ".*")
			})
			.then(response => {
				if (!response.ok) {
					log(LOG_ERROR, 'scope.removeFromScope', 'Failed to remove ' + domain + ' from scope');
				}
			})
			.catch(errorHandler)

		// remove from list and save
		loadTool(NAME)
			.then(tool => {
				tool.urls.splice(tool.urls.indexOf(domain), 1);

				messageAllTabs(tool.panel, {action: 'broadcastUpdate', context: {domain: domain, url: ''}, tool: {name: NAME, data: DATA.OUT, icon: ICONS.OUT, label: LABEL}})

				writeTool(tool);
			})
			.catch(errorHandler);
	}

	function requireScope(targetDomain) {
		return new Promise((resolve, reject) => {
			checkDomainInScope(targetDomain)
				.then(isInScope => {

					if (!isInScope) {
						return showScopeRequiredDialog(targetDomain);
					}
					return true;
				})
				.then(addedToScope => {
					if (addedToScope) {
						resolve();
					}
					else {
						reject();
					}
				});
		});
	}

	function showOptions(tabId) {
		var config = {};

		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {remove: I18n.t("common_remove")};

		messageFrame2(tabId, "display", {action:"showButtonOptions", config:config})
			.then(response => {
				// Handle button choice
				if (response.id == "remove") {
					removeToolFromPanel(tabId, NAME);
				}
			})
			.catch(errorHandler);
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
			.catch(errorHandler)
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
		isInScope: checkDomainInScope
	};
})();

self.tools[Scope.name] = Scope;
