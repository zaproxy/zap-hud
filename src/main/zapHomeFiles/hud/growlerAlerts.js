// Injected string
const ZAP_HUD_FILES = '<<ZAP_HUD_FILES>>';

const INFORMATIONAL_FLAG = '<img src="' + ZAP_HUD_FILES + '/image/flag-blue.png" >&nbsp';
const LOW_FLAG = '<img src="' + ZAP_HUD_FILES + '/image/flag-yellow.png" >&nbsp';
const MEDIUM_FLAG = '<img src="' + ZAP_HUD_FILES + '/image/flag-orange.png" >&nbsp';
const HIGH_FLAG = '<img src="' + ZAP_HUD_FILES + '/image/flag-red.png" >&nbsp';
const DELAY_MS = 3000;
const QUEUE_SIZE = 5;
const MAX_LINE_LENGTH = 45;

const alertQueue = [];

let tabId = '';
let frameId = '';
const context = {
	url: document.referrer,
	domain: utils.parseDomainFromUrl(document.referrer)
};

document.addEventListener('DOMContentLoaded', () => {
	if (typeof alertify === 'undefined') {
		utils.errorHandler('Problem loading Alertify. Alertify is undefined.');
	}

	const parameters = new URL(document.location).searchParams;

	frameId = parameters.get('frameId');
	tabId = parameters.get('tabId');

	alertify.maxLogItems(QUEUE_SIZE);
	alertify.logPosition('bottom right');
});

navigator.serviceWorker.addEventListener('message', event => {
	const message = event.data;

	switch (message.action) {
		case 'showGrowlerAlert':
			if (utils.parseDomainFromUrl(message.alert.uri) === context.domain) {
				enqueueGrowlerAlert(message.alert, event.ports[0]);
			}

			break;

		default:
			break;
	}
});

/*
 * Adds a growler alert to the queue, and manages when the alert should be displayed.
 */
function enqueueGrowlerAlert(alert, port) {
	port.postMessage({action: 'alertsReceived'});

	if (alertQueue.length < QUEUE_SIZE) {
		alertQueue.push({received: Date.now(), scheduled: 0});

		showGrowlerAlert(alert);
	} else {
		const ahead = alertQueue[alertQueue.length - QUEUE_SIZE];
		const schedule = ahead.received + ahead.scheduled + DELAY_MS - Date.now();

		alertQueue.push({received: Date.now(), scheduled: schedule});

		setTimeout(() => {
			showGrowlerAlert(alert);
		}, schedule);
	}
}

/*
 * Displays a single growler alert for DELAY_MS milliseconds.
 */
function showGrowlerAlert(alert) {
	const lines = Math.floor(alert.name.length / MAX_LINE_LENGTH);

	expandFrame(lines);

	const content = getRiskFlag(alert.riskString) + alert.name + getHiddenId(alert.alertId);

	alertify
		.delay(DELAY_MS)
		.closeLogOnClick(true)
		.log(content, event => {
			const alertId = event.target.querySelector('#alertId').value;

			navigator.serviceWorker.controller.postMessage({tabId, frameId, tool: 'common-alerts', action: 'showAlertDetails', id: alertId});
		});

	setTimeout(() => {
		shrinkFrame(lines);
		alertQueue.shift();
	}, DELAY_MS + 250);
}

function expandFrame(lines) {
	parent.postMessage({action: 'heightenGrowlerFrame', lines}, document.referrer);
}

function shrinkFrame(lines) {
	parent.postMessage({action: 'shortenGrowlerFrame', lines}, document.referrer);
}

function getRiskFlag(risk) {
	switch (risk) {
		case 'Informational':
			return INFORMATIONAL_FLAG;

		case 'Low':
			return LOW_FLAG;

		case 'Medium':
			return MEDIUM_FLAG;

		case 'High':
			return HIGH_FLAG;

		default:
			return '';
	}
}

function getHiddenId(alertId) {
	return `<input id="alertId" type="hidden" name="alertId" value="${alertId}">`;
}
