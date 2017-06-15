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

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.OUT;
		tool.icon = ICONS.OUT;
		tool.isSelected = false;
		tool.panel = "";
		tool.urls = [];

		saveTool(tool);
	}

	function showDialog(domain) {

		checkDomainInScope(domain).then(function(isInScope) {
			var config = {};

			if(!isInScope) {
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

			messageFrame("mainDisplay", {action:"showDialog", config:config}).then(function(response) {

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
		fetch("<<ZAP_HUD_API>>JSON/context/action/includeInContext/?contextName=Default%20Context&regex=" + domain + "/.*&apikey=<<ZAP_HUD_API_KEY>>").then(function(response) {
			response.json().then(function(json) {
				//todo: handle response if needed
			});
		});

		// add to list and save
		loadTool(NAME).then(function(tool) {
			tool.urls.push(domain);
			tool.data = DATA.IN;
			tool.icon = ICONS.IN;

			saveTool(tool);
		});
	}

	function removeFromScope(domain) {
		fetch("<<ZAP_HUD_API>>JSON/context/action/excludeFromContext/?contextName=Default%20Context&regex=" + domain + "/.*&apikey=<<ZAP_HUD_API_KEY>>").then(function(response) {
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

	// On script load
	registerTool(NAME);

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

				default:
					break;
			}
		}
	});

	return {
		name: NAME,
		onTargetLoad: onTargetLoad
	};
})();

self.tools[Scope.name] = Scope;
/*
function requireScope(targetDomain, callback) {
	withTool(name, function(tool) {
		if(tool.isInScope) {
			callback();
			return;
		}

		var text;

		if (tool.isSelected) {
			text = "This tool requires this site be added to the attack scope, via the Scope tool. Add '" + targetDomain + "' to the scope?";
		}
		else {
			text = "This tool requires this site be added to the attack scope, via the Scope tool. Add the Scope tool to the HUD and add '" + targetDomain + "' to the scope?";
		}

		buttonFunction = function() {
			if (!tool.isSelected) {
				// add scope to panel
				addToolToPanel("leftPanel", name);
			}

			// add site to scope
			addToScope(parseDomainFromUrl(targetDomain));

			callback();
		};

		// todo: return this??
		showDialog(text, "Add", buttonFunction);
	});
}
*/
