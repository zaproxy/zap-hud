var alertUtils = (function() {
	
	function showSiteAlerts(tabId, title, target, alertRisk) {
		// Note that theres no need to load any tool data here
		var config = {};

		config.title = title;
		config.risk = alertRisk;
		
		utils.getUpgradedDomain(target)
			.then(upgradedDomain => {
				return apiCallWithResponse("alert", "view", "alertsByRisk", { url: upgradedDomain, recurse: 'true' })
			})
			.then(json => {
				config.alerts = flattenAllAlerts(json);
				
				utils.messageFrame(tabId, "display", {action: "showAllAlerts", config:config}).then(response => {
					// Handle button choice
					if (response.alertId) {
						let backFunction = function() {showSiteAlerts(tabId, title, target, alertRisk)};
						showAlertDetails(tabId, response.alertId, backFunction);
					}
				})
				.catch(utils.errorHandler)
			})
			.catch(utils.errorHandler);
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

		let targetDomain = utils.parseDomainFromUrl(target);

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
				
				return apiCallWithResponse("alert", "view", "alertsByRisk", { url: target, recurse: 'false' })
			})
			.then(json => {
				config.alerts = flattenAllAlerts(json);
				
				return utils.messageFrame(tabId, "display", {action: "showAllAlerts", config:config})
			})
			.then(response => {
				// Handle button choice
				if (response.alertId) {
					let backFunction = function() {showPageAlerts(tabId, title, target, alertRisk)};
					return showAlertDetails(tabId, response.alertId, backFunction);
				}
			})
			.catch(utils.errorHandler);
		}

	function showAlertDetails(tabId, id, backFunction) {
		utils.log (LOG_DEBUG, 'showAlertDetails', '' + id);

		apiCallWithResponse("core", "view", "alert", { id: id })
			.then(json => {

				var config = {};
				config.title = json.alert.alert;
				config.details = json.alert;

				utils.messageFrame(tabId, "display", {action: "showAlertDetails", config: config})
					.then(response => {
						if (response.back) {
							backFunction();
						}
					})
					.catch(utils.errorHandler);
			})
			.catch(utils.errorHandler);
	}

	function updatePageAlertCount(toolname, alertEvent) {
		let alertUrl = alertEvent.uri;
		if (alertUrl.startsWith("http://")) {
			// It will have been upgraded to https in the HUD
			alertUrl = alertUrl.replace("http://", "https://");
		}

		utils.loadTool(toolname)
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
						utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', context: {url: alertUrl}, tool: {name: toolname, data: tool.data}})
					}
					return utils.writeTool(tool);	
				}
			})
		.catch(utils.errorHandler);
	}

	function setPageAlerts(toolname, url, alerts) {
		utils.loadTool(toolname)
			.then(tool => {
				tool.alerts = alerts;
				tool.data = Object.keys(alerts).length;
				
				if (tool.isSelected) {
					utils.messageAllTabs(tool.panel, {action: 'broadcastUpdate', context: {url: url}, tool: {name: toolname, data: tool.data}})
				}
				return utils.writeTool(tool);
			})
			.catch(utils.errorHandler);
	}
	
	function showOptions(tabId, toolname, toolLabel) {
		var config = {};

		config.tool = toolname;
		config.toolLabel = toolLabel;
		config.options = {remove: I18n.t("common_remove")};

		utils.messageFrame(tabId, "display", {action:"showButtonOptions", config:config})
			.then(response => {
				// Handle button choice
				if (response.id == "remove") {
					utils.removeToolFromPanel(tabId, toolname);
				}
				else {
					//cancel
				}
			})
			.catch(utils.errorHandler);
	}

	return {
		updatePageAlertCount: updatePageAlertCount,
		showSiteAlerts: showSiteAlerts,
		showPageAlerts: showPageAlerts,
		showAlertDetails: showAlertDetails,
		showOptions: showOptions,
		flattenAllAlerts: flattenAllAlerts,
		setPageAlerts: setPageAlerts
	};
})();
