/*
 * Scope Tool
 *
 * Description goes here...
 */

var Scope = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "scope";
	var I18N = {
		SCOPE_LABEL: "<<ZAP_I18N_hud.ui.scope.tool>>",
		STD_IN: "<<ZAP_I18N_hud.ui.common.in>>",
		STD_OUT: "<<ZAP_I18N_hud.ui.common.out>>",
	}
	var LABEL = I18N.SCOPE_LABEL;
	var DATA = {};
		DATA.IN = I18N.STD_IN;
		DATA.OUT = I18N.STD_OUT;
	var ICONS = {};
		ICONS.IN = "target.png";
		ICONS.OUT = "target-grey.png";
	var DIALOG = {};
		DIALOG.IN = "Remove current domain from scope?";
		DIALOG.OUT = "Add current domain to scope?";
		DIALOG.REQUIRED = "This tool requires the current site be added to the scope, via the Scope tool.";
	var HUD_CONTEXT = "HUD%20Context";

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
						{text:"Add",
						id:"add"},
						{text:"Cancel",
						id:"cancel"}
					];
				}
				else {
					config.text = DIALOG.IN;
					config.buttons = [
						{text:"Remove",
						id:"remove"},
						{text:"Cancel",
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
                    fetch("<<ZAP_HUD_API>>/context/action/newContext/?contextName=" + HUD_CONTEXT)
                }
                tool.urls.push(domain);
                tool.data = DATA.IN;
                tool.icon = ICONS.IN;
                tool.hudContext = true;

                fetch("<<ZAP_HUD_API>>/context/action/includeInContext/?contextName=" + HUD_CONTEXT + "&regex=" + domainWrapper(domain) + ".*")
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
		fetch("<<ZAP_HUD_API>>/context/action/excludeFromContext/?contextName=" + HUD_CONTEXT + "&regex=" + domainWrapper(domain) + ".*")
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
		config.options = {remove: "Remove"};

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
