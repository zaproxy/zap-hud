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

		saveTool(tool);
	}

	function showDialog(domain) {

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

				messageFrame("display", {action:"showDialog", config:config})
					.then(response => {

						// Handle button choice
						if (response.id === "add") {
							addToScope(domain);
						}
						else if (response.id === "remove") {
							removeFromScope(domain);
						}
						else {
							//cancel
						}
					});

			})
			.catch(errorHandler);
	}

	function checkDomainInScope(domain) {
		return new Promise(resolve => {
			loadTool(NAME)
				.then(tool => {
					var isInScope = tool.urls.includes(domain);
					resolve(isInScope);
				});
		});
	}

	function addToScope(domain) {
        loadTool(NAME)
            .then(tool => {
                if (! tool.hudContext) {
                    zapApiCall("/context/action/newContext/?contextName=" + HUD_CONTEXT)
                }
                tool.urls.push(domain);
                tool.data = DATA.IN;
                tool.icon = ICONS.IN;
                tool.hudContext = true;

                zapApiCall("/context/action/includeInContext/?contextName=" + HUD_CONTEXT + "&regex=" + domainWrapper(domain) + ".*")
                .then(response => {
                    if (!response.ok) {
                        log (LOG_ERROR, 'scope.addToScope', 'Failed to add ' + domain + ' to scope');
                    }
                }).catch(errorHandler)

                return saveTool(tool);
            })
			.catch(errorHandler);
	}

	function removeFromScope(domain) {
		zapApiCall("/context/action/excludeFromContext/?contextName=" + HUD_CONTEXT + "&regex=" + domainWrapper(domain) + ".*")
        .then(response => {
            if (!response.ok) {
                log (LOG_ERROR, 'scope.removeFromScope', 'Failed to remove ' + domain + ' from scope');
            }
        }).catch(errorHandler)

		// remove from list and save
		loadTool(NAME)
			.then(tool => {
				tool.urls.splice(tool.urls.indexOf(domain), 1);
				tool.data = DATA.OUT;
				tool.icon = ICONS.OUT;

				saveTool(tool);
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

	self.addEventListener('targetload', event => checkDomainInScope(event.detail.domain)
        .then(isInScope => {
            if (isInScope) {
                loadTool(NAME)
                    .then(tool => {
                        tool.data = DATA.IN;
                        tool.icon = ICONS.IN;

                        saveTool(tool);
                    });
            }
            else {
                loadTool(NAME)
                    .then(tool => {
                        tool.data = DATA.OUT;
                        tool.icon = ICONS.OUT;

                        saveTool(tool);
                    });
            }
        })
        .catch(errorHandler));

	function showOptions() {
		var config = {};

		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {remove: I18n.t("common_remove")};

		messageFrame("display", {action:"showButtonOptions", config:config})
			.then(response => {
				// Handle button choice
				if (response.id == "remove") {
					removeToolFromPanel(NAME);
				}
				else {
					//cancel
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
					showDialog(message.domain);
					break;

				case "buttonMenuClicked":
					showOptions();
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
