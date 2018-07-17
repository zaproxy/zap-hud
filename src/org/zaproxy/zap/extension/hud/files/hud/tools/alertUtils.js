var alertUtils = (function() {
	
	function showSiteAlerts(title, target, alertRisk) {
		// Note that theres no need to load any tool data here
		var config = {};

		config.title = title;
		config.risk = alertRisk;
		
		fetch("<<ZAP_HUD_API>>/alert/view/alertsByRisk/?url=" + domainWrapper(target) + "&recurse=true")
		.then(function(response) {
			response.json().
				then(function(json) {
					config.alerts = flattenAllAlerts(json);
					
					messageFrame("display", {action: "showAllAlerts", config:config}).then(function(response) {
						// Handle button choice
						if (response.alertId) {
							let backFunction = function() {showSiteAlerts(title, target, alertRisk)};
							showAlertDetails(response.alertId, backFunction);
						}
					})
					.catch(errorHandler);
					
				})
				.catch(errorHandler);
			})
			.catch(errorHandler);
	}
	
	function flattenAllAlerts(alerts) {
		var json = {};
		json['Informational'] = flattenAlerts(alerts['alertsByRisk'][0]['Informational']);
		json['Low'] = flattenAlerts(alerts['alertsByRisk'][1]['Low']);
		json['Medium'] = flattenAlerts(alerts['alertsByRisk'][2]['Medium']);
		json['High'] = flattenAlerts(alerts['alertsByRisk'][3]['High']);
		return json;
	}
	
	function flattenAlerts(alerts) {
		var json = {};
		for(var i = 0; i < alerts.length; i++) {
    		var alert = alerts[i];
			for (var key in alert) {
				json[key] = alert[key];
			}
		}
		return json;
	}

	function showPageAlerts(title, target, alertRisk) {
		// Note that theres no need to load any tool data here
		var config = {};

		config.title = title;
		config.risk = alertRisk;

		let targetDomain = parseDomainFromUrl(target);
		if (sharedData.upgradedDomains.has(targetDomain)) {
			// Its been upgraded to https by ZAP, but the alerts wont have been
			target = target.replace("https://", "http://");
		}
		if (target.indexOf("?") > 0) {
			// Remove any url params
			target = target.substring(0, target.indexOf("?"));
		}
		
		fetch("<<ZAP_HUD_API>>/alert/view/alertsByRisk/?url=" + target + "&recurse=false")
		.then(function(response) {
			response.json().
				then(function(json) {
					config.alerts = flattenAllAlerts(json);
					
					messageFrame("display", {action: "showAllAlerts", config:config}).then(function(response) {
						// Handle button choice
						if (response.alertId) {
							let backFunction = function() {showPageAlerts(title, target, alertRisk)};
							showAlertDetails(response.alertId, backFunction);
						}
					})
					.catch(errorHandler);
					
				})
				.catch(errorHandler);
			})
			.catch(errorHandler);
	}

	function showAlertDetails(id, backFunction) { 
		log (LOG_DEBUG, 'showAlertDetails', '' + id);

		fetch("<<ZAP_HUD_API>>/core/view/alert/?id=" + id)
			.then(function(response) {

				response.json().
					then(function(json) {

						var config = {};
						config.title = json.alert.alert;
						config.details = json.alert;

						messageFrame("display", {action: "showAlertDetails", config: config})
							.then(function(response) {
								if (response.back) {
									backFunction();
								}
							})
							.catch(errorHandler);
					})
					.catch(errorHandler);
			})
			.catch(errorHandler);
	}

	function updatePageAlertCount(toolname, target, alertEvent, risk) {
		let alertUrl = alertEvent.uri;
		if (alertUrl.startsWith("http://")) {
			// It will have been upgraded to https in the HUD
			alertUrl = alertUrl.replace("http://", "https://");
		}
		if (targetUrl === alertUrl && risk === alertEvent.riskString) {
			loadTool(toolname)
				.then(function(tool) {
					let alertData = tool.alerts[alertEvent.name];
					if (!alertData) {
						// Don't need to add much, its the fact its here that matters
						tool.alerts[alertEvent.name] = [{
								"confidence": alertEvent["confidence"],
								"name": alertEvent["name"],
								"id": alertEvent["alertId"],
								"url": alertEvent["uri"]
							}];
						tool.data = Object.keys(tool.alerts).length;
						return saveTool(tool);	
					}
				})
			.catch(errorHandler);
		}
	}

	function setPageAlerts(toolname, alerts) {
		loadTool(toolname)
			.then(function(tool) {
				tool.alerts = alerts;
				tool.data = Object.keys(alerts).length;
				return saveTool(tool);
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
		showSiteAlerts: showSiteAlerts,
		showPageAlerts: showPageAlerts,
		showAlertDetails: showAlertDetails,
		showOptions: showOptions,
		updateAlertCount: updateAlertCount,
		flattenAllAlerts: flattenAllAlerts,
		setPageAlerts: setPageAlerts
	};
})();
