var alertUtils = (function() {
	
	function showAlerts(title, target, alertRisk) {
		loadTool("common-alerts")
			.then(function(tool) {
				var config = {};

				config.alerts = tool.alerts[target];
				config.title = title;

				// by default show ALL alert
				var action = "showAllAlerts";
				if (alertRisk) {
					alertRisk = alertRisk[0].toUpperCase() + alertRisk.substring(1);

					// submit just the alerts for this risk level, change the title, and change the display action
					config.alerts = config.alerts[alertRisk];
					action = "showAlerts";
				}

				messageFrame("display", {action: action, config:config}).then(function(response) {
					// Handle button choice
					if (response.alertId) {
						showAlertDetails(response.alertId);
					}
				});
			})
		.catch(errorHandler);
	}

	function showPageAlerts(title, target, alertRisk) {
		loadTool("common-alerts")
			.then(function(tool) {
				var config = {};

				let targetDomain = parseDomainFromUrl(target);
				config.alerts = {};
				config.alerts[alertRisk] = {};
				for (var alertName in tool.alerts[targetDomain][alertRisk]) {
					if (target in tool.alerts[targetDomain][alertRisk][alertName]) {
						config.alerts[alertRisk][alertName] = {};
						config.alerts[alertRisk][alertName][target] = tool.alerts[targetDomain][alertRisk][alertName][target];
					}
				}

				config.title = title;

				// by default show ALL alert
				var action = "showAllAlerts";
				if (alertRisk) {
					// submit just the alerts for this risk level, change the title, and change the display action
					config.alerts = config.alerts[alertRisk];
					action = "showAlerts";
				}

				messageFrame("display", {action: action, config:config}).then(function(response) {
					// Handle button choice
					if (response.alertId) {
						showAlertDetails(response.alertId);
					}
				});
			})
		.catch(errorHandler);
	}

	function showAlertDetails(id) {
		log (LOG_DEBUG, 'showAlertDetails', '' + id);
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
					.catch(errorHandler);
			})
			.catch(errorHandler);
	}

	function updatePageAlertCount(toolname, target, alertRisk) {
		loadTool("common-alerts")
			.then(function(tool) {
				let targetDomain = parseDomainFromUrl(target);
				let count = 0;
				for (var alert in tool.alerts[parseDomainFromUrl(targetDomain)][alertRisk]) {
					if (target in tool.alerts[parseDomainFromUrl(targetDomain)][alertRisk][alert]) {
						count += 1;
					}
				}
				return updateAlertCount(toolname, count);
			})
		.catch(errorHandler);
	}
	
	function updateAlertCount(toolname, count) {
		loadTool(toolname)
			.then(function(tool) {
				tool.data = count;
				return saveTool(tool);
			})
			.catch(errorHandler);
	}

	function showGrowlerAlert(alert) {
		return messageFrame("growlerAlerts", {action: "showGrowlerAlert", alert: alert});
	}

	function showOptions(toolname, toolLabel) {
		var config = {};

		config.tool = toolname;
		config.toolLabel = toolLabel;
		config.options = {opt1: "Option 1", opt2: "Option 2", remove: "Remove"};

		messageFrame("display", {action:"showButtonOptions", config:config})
			.then(function(response) {
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
			})
			.catch(errorHandler);
	}

	return {
		updatePageAlertCount: updatePageAlertCount,
		showAlerts: showAlerts,
		showPageAlerts: showPageAlerts,
		showAlertDetails: showAlertDetails,
		showOptions: showOptions,
		updateAlertCount: updateAlertCount
	};
})();
