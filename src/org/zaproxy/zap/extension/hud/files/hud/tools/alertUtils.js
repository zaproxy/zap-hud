var alertUtils = (function() {

	function showAlerts(toolname, target) {
		var config = {};

		loadTool(toolname).then(function(tool) {
			config.alerts = tool.alerts[target];

			messageFrame("mainDisplay", {action:"showAlerts", config:config}).then(function(response) {
				// Handle button choice
				if ("id" in response) {
					showAlertDetails(response.id);
				}
				else {
					//cancel
				}
			});
		});
	}

	function showAlertDetails(id) {
		fetch("<<ZAP_HUD_API>>/core/view/alert/?id=" + id)
			.then(function(response) {

				response.json().then(function(json) {

					var config = {};
					config.details = json.alert;

					messageFrame("mainDisplay", {action: "showAlertDetails", config: config});
				});
			});
	}

	function updateAlertCount(toolname, target) {
		return loadTool(toolname)
			.then(function(tool) {
				if (tool.alerts[target]) {
					var count = 0;
					for (var key in tool.alerts[target]) {
						count += Object.keys(tool.alerts[target][key]).length;
					}
					tool.data = count.toString();
				}
				else {
					tool.data = "0";
				}
				
				return saveTool(tool);
			});
	}

	function onPollData(toolname, target, data, isGrowlerShown) {
		loadTool(toolname)
			.then(function(tool) {
				data.forEach(function(alert) {
					// not in cache
					if (tool.cache[alert.id] === undefined) {
						// add to cache
						tool.cache[alert.id] = alert;

						// if target not initialized
						if (tool.alerts[target] === undefined) {
							tool.alerts[target] = {};
							tool.alerts[target].Low = {};
							tool.alerts[target].Medium = {};
							tool.alerts[target].High = {};
							tool.alerts[target].Informational = {};
						}

						// add to alerts for the page
						if (tool.alerts[target][alert.risk][alert.alert] === undefined) {
							tool.alerts[target][alert.risk][alert.alert] = [];

							if (isGrowlerShown) {
								// send growler alert (fine with it being async, can change later if its an issue)
								showGrowlerAlert(alert);
							}
						}
						tool.alerts[target][alert.risk][alert.alert].push(alert);
					}
				});

				return saveTool(tool);
			})
			.then(function() {
				return updateAlertCount(toolname, target);
			})
			.catch(function(err) {
				console.log(Error(err));
			});
	}

	function showGrowlerAlert(alert) {
		return messageFrame("growlerAlerts", {action: "showGrowlerAlert", alert: alert});
	}

	function showOptions(toolname, toolLabel) {
		var config = {};

		config.tool = toolname;
		config.toolLabel = toolLabel;
		config.options = {opt1: "Option 1", opt2: "Option 2", remove: "Remove"};

		messageFrame("mainDisplay", {action:"showButtonOptions", config:config}).then(function(response) {
			// Handle button choice
			if (response.id == "opt1") {
				console.log("Option 1 chosen");
			}
			else if (response.id == "opt2") {
				console.log("Option 2 chosen");
			}
			else if (response.id == "remove") {
				removeToolFromPanel(toolname);
			}
			else {
				//cancel
			}
		});
	}

	return {
		showAlerts: showAlerts,
		showAlertDetails: showAlertDetails,
		updateAlertCount: updateAlertCount,
		onPollData: onPollData,
		showOptions: showOptions
	};
})();
