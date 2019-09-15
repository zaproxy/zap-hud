/*
 * HTML Report tool
 *
 * When selected displays the standard HTML report in a new window / tab
 */

var ToggleScript = (function() {

	// Constants
	var NAME = "toggleScript";
	var LABEL = "Toggle Script";
	var ICON = {};
		ICON.default = "report.png";
		ICON.on = "light-on.png";
		ICON.off = "light-off.png";
	var SCRIPT;

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


	// Select a script and update the UI accordingly
	function showOptions(tabId) {
		// Pop up a menu to select a script
		selectScript(tabId)
			.then((result) => {
				if(!result.remove) {
					SCRIPT = result.selected;
					updateUI();
				}
				else {
					// Set the currently selected script to null
					SCRIPT = null;
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

	function toggleScript(tabId) {
		// If there is a selected script, 
		if(SCRIPT) {
			// Choose which API to execute based on enabled status
			var action = SCRIPT.enabled 
				? "disable"
				: "enable"; 
			// Update the tool's status via the API
			apiCallWithResponse("script", "action", action, {scriptName: SCRIPT.name})
				.catch(utils.errorHandler)
				.then(() => {
					// Switch enabled status in UI
					SCRIPT.enabled = !SCRIPT.enabled;
					updateUI()
				});
			
		}
		// If there is no currently selected script, select a script
		else {
			showOptions(tabId);
		}
	}

	function updateUI() {
		var data = SCRIPT.name;
		// Set icon to break-off (green light) when enabled 
		// and break-on (red light) when disabled
		var icon = SCRIPT.enabled ? ICON.on : ICON.off;
		utils.loadTool(NAME).then(tool => {
			tool.data = data;
			tool.icon = icon;
			utils.writeTool(tool)
				.then(() => {
					utils.messageAllTabs(tool.panel, {
						action: 'broadcastUpdate', 
						tool: {
							name: NAME, 
							label: tool.label, 
							data: tool.data, 
							icon: tool.icon
						}
					});
				});
			
		}).catch(utils.errorHandler);
	}

	// Display Dropdown showing a list of scripts that can be manipulated
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
					result.selected.enabled = result.selected.enabled === "true" ? true : false;
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
					toggleScript(message.tabId);
					break;

				// icon is right-clicked
				// As per #335: "right clicking it would give the option to change script"
				case "buttonMenuClicked":
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
