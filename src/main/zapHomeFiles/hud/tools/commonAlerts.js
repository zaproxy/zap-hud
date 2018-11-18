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
	var ICONS = {};
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
		tool.cache = {};
		sharedData.alerts = {};
		// upgradedDomains is used to keep a set of domains that ZAP has upgraded from http to https
		//sharedData.upgradedDomains = new Set();

		saveTool(tool);
		registerForZapEvents("org.zaproxy.zap.extension.alert.AlertEventPublisher");
		registerForZapEvents("org.zaproxy.zap.extension.hud.HudEventPublisher");
	}

	function showGrowlerAlert(alert) {
		return messageFrame("growlerAlerts", {action: "showGrowlerAlert", alert: alert});
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
					alertUtils.showAlertDetails(message.id);
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

				if (sharedData.alerts[targetDomain] === undefined) {
					// This is the first time we have seen this domain so
					// fetch all of the current alerts from ZAP
					getUpgradedDomain(targetDomain)
						.then(upgradedDomain => {
							return fetch("<<ZAP_HUD_API>>/alert/view/alertsByRisk/?url=" + upgradedDomain + "&recurse=true")
						})
						.then(response => {
							return response.json()
						})
						.then(json => {
							sharedData.alerts[targetDomain] = alertUtils.flattenAllAlerts(json);
							tool.alerts = sharedData.alerts;
							return saveTool(tool);
						})
						.then(() => {
							// Raise the events after the data is saved
							const processRisk = (risk) => {
								let raisedEventName = 'commonAlerts.' + risk;
								let raisedEventDetails = {
									count: Object.keys(sharedData.alerts[targetDomain][risk]).length,
								};
								log (LOG_DEBUG, 'AlertEventPublisher eventListener', 'dispatchEvent ' + raisedEventName, raisedEventDetails);
								var event = new CustomEvent(raisedEventName, {detail: raisedEventDetails});
								self.dispatchEvent(event);
							}
							RISKS.forEach(processRisk);
						})
						.catch(errorHandler);
				}

				// Fetch all of the alerts on this page
				fetch("<<ZAP_HUD_API>>/alert/view/alertsByRisk/?url=" + target + "&recurse=false")
				.then(response => {
					response.json().
						then(json => {
							let pageAlerts = alertUtils.flattenAllAlerts(json);
							let raisedEventDetails = {target: origTarget, pageAlerts : pageAlerts};
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
					//upgradedDomains.remove(event.detail.domain);
					delete upgradedDomains[event.detail.domain];
				} 

				return localforage.setItem('upgradedDomains', upgradedDomains)
			})
			.catch(errorHandler)
	});

	self.addEventListener("org.zaproxy.zap.extension.alert.AlertEventPublisher", event => {
		if (event.detail['event.type'] === 'alert.added') {
			if (parseDomainFromUrl(event.detail.uri) === targetDomain) {
				let save = false;
				if (sharedData.alerts[targetDomain] === undefined) {
					sharedData.alerts[targetDomain] = {};
					sharedData.alerts[targetDomain].Low = {};
					sharedData.alerts[targetDomain].Medium = {};
					sharedData.alerts[targetDomain].High = {};
					sharedData.alerts[targetDomain].Informational = {};
					save = true;
				}
				risk = event.detail['riskString'];
				name = event.detail['name'];
				if (sharedData.alerts[targetDomain][risk][name] === undefined) {
					sharedData.alerts[targetDomain][risk][name] = {};
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
							tool.alerts = sharedData.alerts;
							return saveTool(tool);
						}).then(() => {
							// Raise the event after the data is saved
							let raisedEventName = 'commonAlerts.' + risk;
							// This is the number of the relevant type of risk :)
							let raisedEventDetails = {count : Object.keys(sharedData.alerts[targetDomain][risk]).length};
							log (LOG_DEBUG, 'AlertEventPublisher eventListener', 'dispatchEvent ' + raisedEventName, raisedEventDetails);
							var ev = new CustomEvent(raisedEventName, {detail: raisedEventDetails});
							self.dispatchEvent(ev);
						})
						.catch(errorHandler);
				}
			} else {
				log (LOG_TRACE, 'AlertEventPublisher eventListener', 'Ignoring alert.added event', event.detail['alertId']);
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
