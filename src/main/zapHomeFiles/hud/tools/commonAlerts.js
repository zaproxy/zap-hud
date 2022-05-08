/*
 * Handles all of the alerts for the other alert tools
 *
 * Description goes here...
 */

const CommonAlerts = (function () {
	// Constants
	const NAME = 'common-alerts';
	const LABEL = 'Common Alerts';
	const DATA = {};
	DATA.NONE = '0';
	const alertCache = {};
	const RISKS = ['Informational', 'Low', 'Medium', 'High'];

	function initializeStorage() {
		// TODO change to try loading from localstorage
		const tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.NONE;
		tool.isHidden = true;
		tool.panel = '';
		tool.position = 0;
		tool.alerts = {};

		utils.writeTool(tool);
	}

	function showGrowlerAlert(alert) {
		return utils.messageAllTabs('growlerAlerts', {action: 'showGrowlerAlert', alert});
	}

	self.addEventListener('activate', event => {
		initializeStorage();
		registerForZapEvents('org.zaproxy.zap.extension.alert.AlertEventPublisher');
		registerForZapEvents('org.zaproxy.zap.extension.hud.HudEventPublisher');
	});

	self.addEventListener('message', event => {
		const message = event.data;

		// Broadcasts
		switch (message.action) {
			case 'initializeTools':
				initializeStorage();
				break;

			case 'commonAlerts.showAlert':
				// The message from the target domain will have been validated in management.js
				alertUtils.showAlertDetails(message.tabId, message.alertId);
				break;

			default:
				break;
		}

		// Directed
		if (message.tool === NAME) {
			switch (message.action) {
				case 'buttonClicked':
					showAlerts(message.domain);
					break;

				case 'showAlertDetails':
					alertUtils.showAlertDetails(message.tabId, message.id);
					break;

				default:
					break;
			}
		}
	});

	self.addEventListener('targetload', event => {
		const promises = [utils.loadTool(NAME), localforage.getItem('upgradedDomains')];

		Promise.all(promises)
			.then(results => {
				const tool = results[0];
				const upgradedDomains = results[1];

				let origTarget = event.detail.url;
				const zapReplaceOffset = origTarget.indexOf('zapHudReplaceReq=');
				if (zapReplaceOffset > 0) {
					// Strip off the string used for resending in the browser
					// Will be preceded by ? or &
					origTarget = origTarget.substring(0, zapReplaceOffset - 1);
				}

				let target = origTarget;

				const targetDomain = utils.parseDomainFromUrl(target);
				if (targetDomain in upgradedDomains) {
					// Its been upgraded to https by ZAP, but the alerts won't have been
					target = target.replace('https://', 'http://');
				}

				// Ruins all optimizations. will fix in a refactor. only keeping round for explanation.
				// if (alertCache[targetDomain] === undefined) {

				// This is the first time we have seen this domain so
				// fetch all of the current alerts from ZAP
				utils.getUpgradedDomain(targetDomain)
					.then(upgradedDomain => {
						return apiCallWithResponse('alert', 'view', 'alertsByRisk', {url: upgradedDomain, recurse: 'true'});
					})
					.then(json => {
						alertCache[targetDomain] = alertUtils.flattenAllAlerts(json);
						tool.alerts = alertCache;
						return utils.writeTool(tool);
					})
					.then(() => {
						// Raise the events after the data is saved
						const processRisk = risk => {
							const raisedEventName = 'commonAlerts.' + risk;
							const raisedEventDetails = {
								count: Object.keys(alertCache[targetDomain][risk]).length,
								url: target,
								risk,
								domain: targetDomain
							};

							utils.log(LOG_DEBUG, 'AlertEventPublisher eventListener', 'dispatchEvent ' + raisedEventName, raisedEventDetails);
							const event = new CustomEvent(raisedEventName, {detail: raisedEventDetails});
							self.dispatchEvent(event);
						};

						RISKS.forEach(risk => processRisk(risk));
					})
					.catch(utils.errorHandler);

				// Fetch all of the alerts on this page
				apiCallWithResponse('alert', 'view', 'alertsByRisk', {url: target, recurse: 'false'})
					.then(json => {
						const pageAlerts = alertUtils.flattenAllAlerts(json);
						const raisedEventDetails = {domain: targetDomain, url: event.detail.uri, target: origTarget, pageAlerts};
						const ev = new CustomEvent('commonAlerts.pageAlerts', {detail: raisedEventDetails});
						self.dispatchEvent(ev);

						// Highlight any alerts related to form params
						for (const risk in RISKS) {
							if (Object.prototype.hasOwnProperty.call(RISKS, risk)) {
								const alertRisk = RISKS[risk];
								for (const alertName in pageAlerts[alertRisk]) {
									if (Object.prototype.hasOwnProperty.call(pageAlerts[alertRisk], alertName)) {
										const reportedParameters = new Set();
										for (let i = 0; i < pageAlerts[alertRisk][alertName].length; i++) {
											const alert = pageAlerts[alertRisk][alertName][i];
											if (alert.param.length > 0 && !reportedParameters.has(alert.param)) {
												reportedParameters.add(alert.param);
												utils.messageFrame(event.detail.tabId, 'management', {
													action: 'commonAlerts.alert',
													name: alert.name,
													id: alert.id,
													risk: alert.risk,
													param: alert.param});
											}
										}
									}
								}
							}
						}
					})
					.catch(utils.errorHandler);
			})
			.catch(utils.errorHandler);
	});

	self.addEventListener('org.zaproxy.zap.extension.hud.HudEventPublisher', event => {
		localforage.getItem('upgradedDomains')
			.then(upgradedDomains => {
				if (event.detail['event.type'] === 'domain.upgraded') {
					upgradedDomains[event.detail.domain] = true;
				} else if (event.detail['event.type'] === 'domain.redirected') {
					delete upgradedDomains[event.detail.domain];
				}

				return localforage.setItem('upgradedDomains', upgradedDomains);
			})
			.catch(utils.errorHandler);
	});

	self.addEventListener('org.zaproxy.zap.extension.alert.AlertEventPublisher', event => {
		if (event.detail['event.type'] === 'alert.added') {
			const targetDomain = utils.parseDomainFromUrl(event.detail.uri);
			let save = false;

			if (alertCache[targetDomain] === undefined) {
				alertCache[targetDomain] = {};
				alertCache[targetDomain].Low = {};
				alertCache[targetDomain].Medium = {};
				alertCache[targetDomain].High = {};
				alertCache[targetDomain].Informational = {};
				save = true;
			}

			const risk = event.detail.riskString;
			const name = event.detail.name;

			if (alertCache[targetDomain][risk][name] === undefined) {
				alertCache[targetDomain][risk][name] = {};
				// Send growler alert (fine with it being async, can change later if its an issue)
				utils.log(LOG_DEBUG, 'AlertEventPublisher eventListener', 'Show growler alert', risk + ' ' + name);
				showGrowlerAlert(event.detail)
					.catch(utils.errorHandler);
				save = true;
			}

			if (save) {
				utils.loadTool(NAME)
					.then(tool => {
						// Backup to localstorage in case the serviceworker dies
						tool.alerts = alertCache;
						return utils.writeTool(tool);
					})
					.then(() => {
						// Raise the event after the data is saved
						const raisedEventName = 'commonAlerts.' + risk;
						// This is the number of the relevant type of risk :)
						const raisedEventDetails = {risk, domain: targetDomain, url: event.detail.uri, count: Object.keys(alertCache[targetDomain][risk]).length};
						utils.log(LOG_DEBUG, 'AlertEventPublisher eventListener', 'dispatchEvent ' + raisedEventName, raisedEventDetails);
						const ev = new CustomEvent(raisedEventName, {detail: raisedEventDetails});
						self.dispatchEvent(ev);
					})
					.catch(utils.errorHandler);
			}
		} else {
			utils.log(LOG_DEBUG, 'AlertEventPublisher eventListener', 'Ignoring event', event.detail['event.type']);
		}
	});

	return {
		name: NAME,
		initialize: initializeStorage
	};
})();

self.tools[CommonAlerts.name] = CommonAlerts;
