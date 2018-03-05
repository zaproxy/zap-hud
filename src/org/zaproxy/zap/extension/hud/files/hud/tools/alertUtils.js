var alertUtils = (function() {

	function showAlerts(toolname, target, alertRisk) {
		var config = {};

		loadTool(toolname)
			.then(function(tool) {
				config.alerts = tool.alerts[target];
				// build the string for the title
				config.title = tool.alertType[0].toUpperCase() + tool.alertType.substring(1, tool.alertType.indexOf('-')) + " Alerts"

				// by default show ALL alert
				var action = "showAllAlerts";
				if (alertRisk) {
					// TODO: capitalize the alert risk in the tools so that this just works
					// capitalize the alert risk level 
					alertRisk = alertRisk[0].toUpperCase() + alertRisk.substring(1);

					// submit just the alerts for this risk level, change the title, and change the display action
					config.alerts = config.alerts[alertRisk];
					config.title = alertRisk + " " + config.title
					action = "showAlerts";
				}

				messageFrame("display", {action: action, config:config}).then(function(response) {
					// Handle button choice
					if (response.alertId) {
						showAlertDetails(response.alertId);
					}
				});
			})
			.catch(function(err) {
				console.log(Error(err));
			});
	}

	function showAlertDetails(id) {
		console.log("id: " + id.toString())
		// get the alert details given the id
		fetch("<<ZAP_HUD_API>>/core/view/alert/?id=" + id)
			.then(function(response) {

				response.json().
					then(function(json) {

						var config = {};
						config.title = json.alert.alert;
						config.details = json.alert;

						messageFrame("display", {action: "showAlertDetails", config: config});
					})
					.catch(function(err) {
						console.log(err);
					});
			})
			.catch(function(err) {
				console.log(err);
			});
	}

	function updateAlertCount(toolname, target) {

		return loadTool(toolname)
			.then(function(tool) {

				var count = 0;
				var targetAlerts = tool.alerts[target];

				if (targetAlerts) {

					for (var risk in tool.alerts[target]) {
						var riskAlerts = targetAlerts[risk] || {};

						count += Object.keys(riskAlerts).length;
					}
				}

				tool.data = count.toString();
				
				return saveTool(tool);
			});
	}

	function onPollData(toolname, target, data, alertRisk) {

		loadTool(toolname)
			.then(function(tool) {
				// if target not initialized
				if (tool.alerts[target] === undefined) {
					tool.alerts[target] = {};
					tool.alerts[target].Low = {};
					tool.alerts[target].Medium = {};
					tool.alerts[target].High = {};
					tool.alerts[target].Informational = {};
				}

				// filter out unrelated alerts for the risk-specific tools
				if (alertRisk) {
					data = data.filter(function(alert) {
						return alert.risk.toLowerCase() === alertRisk;
					})
				}

				data.forEach(function(alert) {
					// not in cache
					if (tool.cache[alert.id] === undefined) {
						// add to cache
						tool.cache[alert.id] = alert;

						// first time seeing alert
						if (tool.alerts[target][alert.risk][alert.alert] === undefined) {
							tool.alerts[target][alert.risk][alert.alert] = [];

							if (toolname === "site-alerts-all") {
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

		messageFrame("display", {action:"showButtonOptions", config:config}).then(function(response) {
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
