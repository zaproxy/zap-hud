/*
 * Scope Tool
 *
 * Description goes here...
 */

var Scope = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "scope";
	var LABEL = "Scope";
	var DATA = {};
		DATA.IN = "In";
		DATA.OUT = "Out";
	var ICONS = {};
		ICONS.IN = "target.png";
		ICONS.OUT = "target-grey.png";
	var DIALOG = {};
		DIALOG.IN = "Remove current domain from scope?";
		DIALOG.OUT = "Add current domain to scope?";
		DIALOG.REQUIRED = "This tool requires the current site be added to the scope, via the Scope tool.";

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.OUT;
		tool.icon = ICONS.OUT;
		tool.isSelected = false;
		tool.panel = "";
		tool.position = 0;
		tool.urls = [];

		saveTool(tool);
	}

	function showDialog(domain) {

		checkDomainInScope(domain).then(function(isInScope) {
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

			messageFrame("display", {action:"showDialog", config:config}).then(function(response) {

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

		}).catch(function(error) {
			console.log(Error(error));
		});
	}

	function checkDomainInScope(domain) {
		return new Promise(function(resolve) {
			loadTool(NAME).then(function(tool) {
				var isInScope = tool.urls.includes(domain);
				resolve(isInScope);
			});
		});
	}

	function addToScope(domain) {
		return fetch("<<ZAP_HUD_API>>/context/action/includeInContext/?contextName=Default%20Context&regex=" + domain + "/.*").then(function() {
			// add to list and save
			return loadTool(NAME).then(function(tool) {
				tool.urls.push(domain);
				tool.data = DATA.IN;
				tool.icon = ICONS.IN;

				return saveTool(tool).then(function() {
					return true;
				});
			});
		});
	}

	function removeFromScope(domain) {
		fetch("<<ZAP_HUD_API>>/context/action/excludeFromContext/?contextName=Default%20Context&regex=" + domain + "/.*").then(function(response) {
			response.json().then(function(json) {
				//todo: handle response if needed
			});
		});

		// remove from list and save
		loadTool(NAME).then(function(tool) {
			tool.urls.splice(tool.urls.indexOf(domain), 1);
			tool.data = DATA.OUT;
			tool.icon = ICONS.OUT;

			saveTool(tool);
		});
	}

	function requireScope(targetDomain) {
		
		return new Promise(function(resolve, reject) {
			checkDomainInScope(targetDomain).then(function(isInScope) {

				if (!isInScope) {
					return showScopeRequiredDialog(targetDomain);
				}
				return true;
			}).then(function(addedToScope) {
				if (addedToScope) {
					resolve();
				}
				else {
					reject();
				}
			});
		});
	}

	function onPanelLoad(data) {
		return checkDomainInScope(data.domain).then(function(isInScope) {
			if (isInScope) {
				loadTool(NAME).then(function(tool) {
					tool.data = DATA.IN;
					tool.icon = ICONS.IN;

					saveTool(tool);
				});
			}
			else {
				loadTool(NAME).then(function(tool) {
					tool.data = DATA.OUT;
					tool.icon = ICONS.OUT;

					saveTool(tool);
				});
			}
		});
	}

	function showOptions() {
		var config = {};

		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {remove: "Remove"};

		messageFrame("display", {action:"showButtonOptions", config:config}).then(function(response) {
			// Handle button choice
			if (response.id == "remove") {
				removeToolFromPanel(NAME);
			}
			else {
				//cancel
			}
		});
	}

	self.addEventListener("activate", function(event) {
		initializeStorage();
	});

	self.addEventListener("message", function(event) {
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
		onPanelLoad: onPanelLoad,
		initialize: initializeStorage,
		addToScope: addToScope,
		isInScope: checkDomainInScope
	};
})();

self.tools[Scope.name] = Scope;
