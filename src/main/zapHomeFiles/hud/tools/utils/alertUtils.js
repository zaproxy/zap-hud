var alertUtils = (function() {
	
	function showSiteAlerts(tabId, title, target, alertRisk) {
		// Note that theres no need to load any tool data here
		var config = {};

		config.title = title;
		config.risk = alertRisk;
		
		getUpgradedDomain(target)
			.then(upgradedDomain => {
				return zapApiCall("/alert/view/alertsByRisk/?url=" + upgradedDomain + "&recurse=true")
			})
			.then(response => {
				return response.json()
			})
			.then(json => {
				config.alerts = flattenAllAlerts(json);
				
				messageFrame2(tabId, "display", {action: "showAllAlerts", config:config}).then(response => {
					// Handle button choice
					if (response.alertId) {
						let backFunction = function() {showSiteAlerts(tabId, title, target, alertRisk)};
						showAlertDetails(tabId, response.alertId, backFunction);
					}
				})
				.catch(errorHandler)
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

	function showPageAlerts(tabId, title, target, alertRisk) {
		// Note that theres no need to load any tool data here
		var config = {};

		config.title = title;
		config.risk = alertRisk;

		let targetDomain = parseDomainFromUrl(target);

		localforage.getItem('upgradedDomains')
			.then(upgradedDomains => {
				if (targetDomain in upgradedDomains) {
					// Its been upgraded to https by ZAP, but the alerts wont have been
					target = target.replace("https://", "http://");
				}

				if (target.indexOf("?") > 0) {
					// Remove any url params
					target = target.substring(0, target.indexOf("?"));
				}
				
				return zapApiCall("/alert/view/alertsByRisk/?url=" + target + "&recurse=false")
			})
			.then(response => {
				return response.json()
			})
			.then(json => {
				config.alerts = flattenAllAlerts(json);
				
				return messageFrame2(tabId, "display", {action: "showAllAlerts", config:config})
			})
			.then(response => {
				// Handle button choice
				if (response.alertId) {
					let backFunction = function() {showPageAlerts(tabId, title, target, alertRisk)};
					return showAlertDetails(tabId, response.alertId, backFunction);
				}
			})
			.catch(errorHandler);
		}

	function showAlertDetails(tabId, id, backFunction) {
		log (LOG_DEBUG, 'showAlertDetails', '' + id);

		zapApiCall("/core/view/alert/?id=" + id)
			.then(response => {

				response.json().
					then(json => {

						var config = {};
						config.title = json.alert.alert;
						config.details = json.alert;

						messageFrame2(tabId, "display", {action: "showAlertDetails", config: config})
							.then(response => {
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

	function updatePageAlertCount(toolname, alertEvent) {
		let alertUrl = alertEvent.uri;
		if (alertUrl.startsWith("http://")) {
			// It will have been upgraded to https in the HUD
			alertUrl = alertUrl.replace("http://", "https://");
		}

		loadTool(toolname)
			.then(tool => {
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

					if (tool.isSelected) {
						messageAllTabs(tool.panel, {action: 'broadcastUpdate', context: {url: alertUrl}, tool: {name: toolname, data: tool.data}})
					}
					return writeTool(tool);	
				}
			})
		.catch(errorHandler);
	}

	function setPageAlerts(toolname, url, alerts) {
		loadTool(toolname)
			.then(tool => {
				tool.alerts = alerts;
				tool.data = Object.keys(alerts).length;
				
				if (tool.isSelected) {
					messageAllTabs(tool.panel, {action: 'broadcastUpdate', context: {url: url}, tool: {name: toolname, data: tool.data}})
				}
				return writeTool(tool);
			})
			.catch(errorHandler);
	}
	
	function updateAlertCount(toolname, count) {
		loadTool(toolname)
			.then(tool => {
				tool.data = count;
				return saveTool(tool);
			})
			.catch(errorHandler);
	}

	function showGrowlerAlert(alert) {
		return messageAllTabs("growlerAlerts", {action: "showGrowlerAlert", alert: alert});
	}

	function showOptions(tabId, toolname, toolLabel) {
		var config = {};

		config.tool = toolname;
		config.toolLabel = toolLabel;
		config.options = {opt1: "Option 1", opt2: "Option 2", remove: I18n.t("common_remove")};

		messageFrame2(tabId, "display", {action:"showButtonOptions", config:config})
			.then(response => {
				// Handle button choice
				if (response.id == "opt1") {
					console.log("Option 1 chosen");
				}
				else if (response.id == "opt2") {
					console.log("Option 2 chosen");
				}
				else if (response.id == "remove") {
					removeToolFromPanel(tabId, toolname);
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
