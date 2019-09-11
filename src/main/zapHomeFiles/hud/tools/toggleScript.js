/*
 * HTML Report tool
 *
 * When selected displays the standard HTML report in a new window / tab
 */

var ToggleScript = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "toggleScript";
	var LABEL = "Toggle Script";
	var ICON = {};
		ICON.default = "report.png";
		ICON.on = "break-off.png";
		ICON.off = "break-on.png";

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.data = '';
		tool.panel = "";
		tool.position = 0;
		tool.label = LABEL;
		tool.icon = ICON.default;
		utils.writeTool(tool);
	}


	// Right click functionality
	function showOptions(tabId) {
		// Pop up a menu to select a script
		selectScript(tabId)
			.then((result) => {
				if(!result.remove) {
					var label = `Toggle ${result.selected.name}`;
					var data = result.selected.enabled ? "Enabled" : "Disabled";
					// Set icon to break-off (green light) when enabled 
					// and break-on (red light) when disabled
					var icon = result.selected.enabled ? ICON.on : ICON.off;
					updateTool(label, data, icon);
				}
				else {
					// Reset the tool before removing it, so it shows up as default in the 'Add Tools' menu
					// Load the tool so that panel and other properties don't get messed with
					utils.loadTool(NAME).then(tool => {
						// Reset data, label and icon
						tool.data = '';
						tool.label = LABEL;
						tool.icon = ICON.default;
						return tool;
					}).then(tool => {
						// Write the reset tool to storage
						utils.writeTool(tool);
					}).then(() => {
						// Remove the tool from the panel
						utils.removeToolFromPanel(tabId, NAME);	
					})
				}
			})
	}

	function updateTool(label, data, icon) {
		utils.loadTool(NAME).then(tool => {
			tool.label = label;
			tool.data = data;
			tool.icon = icon;
			update = utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', tool: {name: NAME, label: label, data: data, icon: icon}});
			write = utils.writeTool(tool);
		})
	}

	// Display Dropdown showing a list of scripts that can be manipulated
	// Scripts can be obtained from http://localhost:8080/JSON/script/view/listScripts/
	function selectScript(tabId) {
		var config = {};
		var allScripts;
		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {};

		// Return a promise containing the selected script

		// Call the listScripts API endpoint
		return apiCallWithResponse("script", "view", "listScripts")
			.catch(utils.errorHandler)
			.then(data => {
				// Filter out built-in scripts
				return data.listScripts.filter(script => (script.enabled !== undefined));
			})
			.then(scripts => {
				allScripts = scripts;
				// Get an array of the script names to pass to the messageFrame
				config.options = scripts.map(script => script.name);
				config.options.push("Remove");
				console.log(config.options);
				// Create the messageFrame displaying the scripts
				return utils.messageFrame(tabId, "display", {action:"showButtonOptions", config:config});
			})
			.then(response => {
				var result = {};
				// allScripts does not contain the Remove option, so if response.id === allScripts.length, Remove must have been selected.
				if(response.id !== allScripts.length) {
					// Because we passed messageFrame an array, response.id 
					// will be the index of the selected element
					result.selected = allScripts[response.id];
					result.remove = false;
				}
				// If the last option (Remove) is selected, unset selected
				else {
					result.remove = true;
				}
				return result;
			})
			.catch(utils.errorHandler);
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
				// Icon is left-clicked
				// As per #335: "clicking on the tool would toggle the script on and off"
				case "buttonClicked":
					console.log("Button Clicked");
					break;

				// icon is right-clicked
				// As per #335: "right clicking it would give the option to change script"
				case "buttonMenuClicked":
					console.log("Menu Clicked");
					showOptions(message.tabId);
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

self.tools[ToggleScript.name] = ToggleScript;
