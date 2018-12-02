/*
 * Handles all of the alerts for the other alert tools
 *
 * Description goes here...
 */

var CommonAlerts = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "common-alerts";
	var LABEL = "Common Alerts";
	var DATA = {};
		DATA.NONE = "0";
	var alertCache = {};
	var RISKS = ["Informational", "Low", "Medium", "High"];

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		// TODO change to try loading from localstorage
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.NONE;
		tool.isHidden = true;
		tool.panel = "";
		tool.position = 0;
		tool.alerts = {};

		saveTool(tool);
		registerForZapEvents("org.zaproxy.zap.extension.alert.AlertEventPublisher");
		registerForZapEvents("org.zaproxy.zap.extension.hud.HudEventPublisher");
	}

	function showGrowlerAlert(alert) {
		return messageAllTabs("growlerAlerts", {action: "showGrowlerAlert", alert: alert});
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

			case "commonAlerts.showAlert":
				// Check its an int - its been supplied by the target domain so in theory could have been tampered with
				if (message.alertId === parseInt(message.alertId, 10)) {
					alertUtils.showAlertDetails(message.alertId);
				}
				break;

			default:
				break;
		}

		// Directed
		if (message.tool === NAME) {
			switch(message.action) {
				case "buttonClicked":
					showAlerts(message.domain);
					break;

				case "showAlertDetails":
					alertUtils.showAlertDetails(message.tabId, message.id);
					break;

				default:
					break;
			}
		}
	});

	self.addEventListener("targetload", event => {
		let promises = [loadTool(NAME), localforage.getItem('upgradedDomains')];

		Promise.all(promises)
			.then(results => {
				let tool = results[0];
				let upgradedDomains = results[1];

				let origTarget = event.detail.url;
				let zapReplaceOffset = origTarget.indexOf('zapHudReplaceReq=');
				if (zapReplaceOffset > 0) {
					// Strip off the string used for resending in the browser
					// Will be preceded by ? or &
					origTarget = origTarget.substring(0, zapReplaceOffset -1);
				}
				let target = origTarget;
				
				let targetDomain = parseDomainFromUrl(target);
				if (targetDomain in upgradedDomains) {
					// Its been upgraded to https by ZAP, but the alerts wont have been
					target = target.replace("https://", "http://");
				}

				// ruins all optimizations. will fix in a refactor. only keeping round for explanation.
				//if (alertCache[targetDomain] === undefined) { 

				// This is the first time we have seen this domain so
				// fetch all of the current alerts from ZAP
				getUpgradedDomain(targetDomain)
					.then(upgradedDomain => {
						return zapApiCall("/alert/view/alertsByRisk/?url=" + upgradedDomain + "&recurse=true")
					})
					.then(response => {
						return response.json()
					})
					.then(json => {
						alertCache[targetDomain] = alertUtils.flattenAllAlerts(json);
						tool.alerts = alertCache;
						return saveTool(tool);
					})
					.then(() => {
						// Raise the events after the data is saved
						const processRisk = (risk) => {
							let raisedEventName = 'commonAlerts.' + risk;
							let raisedEventDetails = {
								count: Object.keys(alertCache[targetDomain][risk]).length,
								url: target,
								risk: risk,
								domain: targetDomain
							};

							log (LOG_DEBUG, 'AlertEventPublisher eventListener', 'dispatchEvent ' + raisedEventName, raisedEventDetails);
							var event = new CustomEvent(raisedEventName, {detail: raisedEventDetails});
							self.dispatchEvent(event);
						}
						RISKS.forEach(processRisk);
					})
					.catch(errorHandler);

				// Fetch all of the alerts on this page
				zapApiCall("/alert/view/alertsByRisk/?url=" + target + "&recurse=false")
				.then(response => {
					response.json().
						then(json => {
							let pageAlerts = alertUtils.flattenAllAlerts(json);
							let raisedEventDetails = {domain: targetDomain, url: event.detail.uri, target: origTarget, pageAlerts : pageAlerts};
							var ev = new CustomEvent("commonAlerts.pageAlerts", {detail: raisedEventDetails});
							self.dispatchEvent(ev);

							// Highlight any alerts related to form params
							for (var risk in RISKS) {
								var alertRisk = RISKS[risk];
								for (var alertName in pageAlerts[alertRisk]) {
									let reportedParams = new Set();
									for (var i = 0; i < pageAlerts[alertRisk][alertName].length; i++) {
										var alert = pageAlerts[alertRisk][alertName][i];
										if (alert.param.length > 0 && ! reportedParams.has(alert.param)) {
											reportedParams.add(alert.param);
											messageFrame("management", {
												action: "commonAlerts.alert",
												name: alert.name,
												id: alert.id,
												risk: alert.risk,
												param: alert.param});
										}
									} 
								}
							}
						})
						.catch(errorHandler);
					})
					.catch(errorHandler);
			})
		.catch(errorHandler);
	});

	self.addEventListener("org.zaproxy.zap.extension.hud.HudEventPublisher", event => {
		localforage.getItem('upgradedDomains')
			.then(upgradedDomains => {
				if (event.detail['event.type'] === 'domain.upgraded') {
					upgradedDomains[event.detail.domain] = true;
				}
				else if (event.detail['event.type'] === 'domain.redirected') {
					delete upgradedDomains[event.detail.domain];
				} 

				return localforage.setItem('upgradedDomains', upgradedDomains)
			})
			.catch(errorHandler)
	});

	self.addEventListener("org.zaproxy.zap.extension.alert.AlertEventPublisher", event => {
		if (event.detail['event.type'] === 'alert.added') {
			let targetDomain = parseDomainFromUrl(event.detail.uri)
			let save = false;

			if (alertCache[targetDomain] === undefined) {
				alertCache[targetDomain] = {};
				alertCache[targetDomain].Low = {};
				alertCache[targetDomain].Medium = {};
				alertCache[targetDomain].High = {};
				alertCache[targetDomain].Informational = {};
				save = true;
			}

			let risk = event.detail['riskString'];
			let name = event.detail['name'];

			if (alertCache[targetDomain][risk][name] === undefined) {
				alertCache[targetDomain][risk][name] = {};
				// send growler alert (fine with it being async, can change later if its an issue)
				log (LOG_DEBUG, 'AlertEventPublisher eventListener', 'Show growler alert', risk + ' ' + name);
				showGrowlerAlert(event.detail)
					.catch(errorHandler);
				save = true;
			}

			if (save) {
				loadTool(NAME)
					.then(tool => {
						// backup to localstorage in case the serviceworker dies
						tool.alerts = alertCache;
						return writeTool(tool);
						//return saveTool(tool);
					})
					.then(() => {
						// Raise the event after the data is saved
						let raisedEventName = 'commonAlerts.' + risk;
						// This is the number of the relevant type of risk :)
						let raisedEventDetails = {risk: risk, domain: targetDomain, url: event.detail.uri, count : Object.keys(alertCache[targetDomain][risk]).length};
						log (LOG_DEBUG, 'AlertEventPublisher eventListener', 'dispatchEvent ' + raisedEventName, raisedEventDetails);
						var ev = new CustomEvent(raisedEventName, {detail: raisedEventDetails});
						self.dispatchEvent(ev);
					})
					.catch(errorHandler);
			}
		} else {
			log (LOG_DEBUG, 'AlertEventPublisher eventListener', 'Ignoring event', event.detail['event.type'])
		}
	});

	return {
		name: NAME,
		initialize: initializeStorage
	};
})();

self.tools[CommonAlerts.name] = CommonAlerts;
