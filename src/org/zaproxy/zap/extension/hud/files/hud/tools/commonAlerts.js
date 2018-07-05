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
	// The event queue it to allow us to process a series of alert events that are raised very close together,
	// eg when spidering. This means we need to load from localstorage much less frequently and gives significant
	// performance improvements
	var eventQueue = [];
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
		sharedData.upgradedDomains = new Set();

		saveTool(tool);
		registerForZapEvents("org.zaproxy.zap.extension.alert.AlertEventPublisher");
		registerForZapEvents("org.zaproxy.zap.extension.hud.HudEventPublisher");
	}

	function showGrowlerAlert(alert) {
		return messageFrame("growlerAlerts", {action: "showGrowlerAlert", alert: alert});
	}

	self.addEventListener("activate", function(event) {
		initializeStorage();
	});

	self.addEventListener("message", function(event) {
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

				case "buttonMenuClicked":
					showOptions();
					break;

				default:
					break;
			}
		}
	});

	self.addEventListener("targetload", function(event) {
		loadTool(NAME)
			.then(function(tool) {
				let target = event.detail.url;
				let targetDomain = parseDomainFromUrl(target);
				for (var risk in RISKS) {
					var alertRisk = RISKS[risk];
					for (var alert in tool.alerts[parseDomainFromUrl(targetDomain)][alertRisk]) {
						if (sharedData.upgradedDomains.has(targetDomain)) {
							// Its been upgraded to https by ZAP, but the alerts wont have been
							target = target.replace("https://", "http://");
						}
						if (target in tool.alerts[parseDomainFromUrl(targetDomain)][alertRisk][alert]) {
							var alert = tool.alerts[parseDomainFromUrl(targetDomain)][alertRisk][alert][target];
							if (alert.param.length > 0) {
								messageFrame("management", {
									action: "commonAlerts.alert",
									name: alert.name,
									alertId: alert.alertId,
									riskString: alert.riskString,
									param: alert.param});
							}
						} 
					}
				}
			})
		.catch(errorHandler);
	});

	self.addEventListener("org.zaproxy.zap.extension.hud.HudEventPublisher", function(event) {
		if (event.detail['event.type'] === 'domain.upgraded') {
			sharedData.upgradedDomains.add(event.detail.domain);
		} else if (event.detail['event.type'] === 'domain.redirected') {
			sharedData.upgradedDomains.remove(event.detail.domain);
		} 
	});

	self.addEventListener("org.zaproxy.zap.extension.alert.AlertEventPublisher", function(event) {
		if (event.detail['event.type'] === 'alert.added') {
			if (parseDomainFromUrl(event.detail.uri) === targetDomain) {
				eventQueue.push(event);
				setTimeout(processEventQueue, 200);
			}
		}
	});
	
	function processEventQueue() {
		if (eventQueue.length > 0) {
			var risks = new Set();
			loadTool(NAME)
				.then(function(tool) {
					if (eventQueue.length == 0) {
						// Another thread has already processed it
						return;
					}
					tool.alerts = sharedData.alerts;
					if (sharedData.alerts[targetDomain] === undefined) {
						sharedData.alerts[targetDomain] = {};
						sharedData.alerts[targetDomain].Low = {};
						sharedData.alerts[targetDomain].Medium = {};
						sharedData.alerts[targetDomain].High = {};
						sharedData.alerts[targetDomain].Informational = {};
					}
					var event;
					var count = 0;
					while (event = eventQueue.shift()) {
						count += 1;
						processEvent(event);
						risks.add(event.detail['riskString']);
					}
					log (LOG_TRACE, 'AlertEventPublisher processEventQueue', 'Processed ' + count + ' events');
					// backup to localstorage in case the serviceworker dies
					return saveTool(tool);
				}).then(function() {
					// Raise the events after the data is saved
					for (var risk of risks) {
						let raisedEventName = 'commonAlerts.' + risk;
						// This is the number of the relevant type of risk :)
						let raisedEventDetails = {count : Object.keys(sharedData.alerts[targetDomain][risk]).length};
						log (LOG_TRACE, 'AlertEventPublisher eventListener ', 'dispatchEvent ' + raisedEventName, raisedEventDetails);
						var ev = new CustomEvent(raisedEventName, {detail: raisedEventDetails});
						self.dispatchEvent(ev);
					}
				})
				.catch(errorHandler);
		}
	}

	function processEvent(event) {
		risk = event.detail['riskString'];
		name = event.detail['name'];
		if (sharedData.alerts[targetDomain][risk][name] === undefined) {
			sharedData.alerts[targetDomain][risk][name] = {};
			// send growler alert (fine with it being async, can change later if its an issue)
			log (LOG_DEBUG, 'AlertEventPublisher eventListener', 'Show growler alert', risk + ' ' + name);
			showGrowlerAlert(event.detail)
				.catch(errorHandler);
		}
		if ( !(event.detail.uri in sharedData.alerts[targetDomain][risk][name])) {
			sharedData.alerts[targetDomain][risk][name][event.detail.uri] = event.detail;
		}
		return event;
	}

	return {
		name: NAME,
		initialize: initializeStorage
	};
})();

self.tools[CommonAlerts.name] = CommonAlerts;
