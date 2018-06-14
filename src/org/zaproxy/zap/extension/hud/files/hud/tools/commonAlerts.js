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
				if (sharedData.alerts[targetDomain] === undefined) {
					sharedData.alerts[targetDomain] = {};
					sharedData.alerts[targetDomain].Low = {};
					sharedData.alerts[targetDomain].Medium = {};
					sharedData.alerts[targetDomain].High = {};
					sharedData.alerts[targetDomain].Informational = {};
				}
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
				loadTool(NAME)
					.then(function(tool) {
						// backup to localstorage in case the serviceworker dies
						tool.alerts = sharedData.alerts;
						return saveTool(tool);
					}).then(function() {
						// Raise the event after the data is saved
						let raisedEventName = 'commonAlerts.' + risk;
						// This is the number of the relevant type of risk :)
						let raisedEventDetails = {count : Object.keys(sharedData.alerts[targetDomain][risk]).length};
						log (LOG_DEBUG, 'AlertEventPublisher eventListener', 'dispatchEvent ' + raisedEventName, raisedEventDetails);
						var ev = new CustomEvent(raisedEventName, {detail: raisedEventDetails});
						self.dispatchEvent(ev);
					})
					.catch(errorHandler);
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
