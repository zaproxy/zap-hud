var INFORMATIONAL_FLAG = "<img src='<<ZAP_HUD_FILES>>?image=flag-blue.png' >&nbsp";
var LOW_FLAG = "<img src='<<ZAP_HUD_FILES>>?image=flag-yellow.png' >&nbsp";
var MEDIUM_FLAG = "<img src='<<ZAP_HUD_FILES>>?image=flag-orange.png' >&nbsp";
var HIGH_FLAG = "<img src='<<ZAP_HUD_FILES>>?image=flag-red.png' >&nbsp";
var DELAY_MS = 3000;
var QUEUE_SIZE = 5;
var MAX_LINE_LENGTH = 45;

var alertQueue = [];

document.addEventListener("DOMContentLoaded", () => {
	if (typeof alertify != "undefined") {
		alertify.maxLogItems(QUEUE_SIZE);
		alertify.logPosition("bottom right");
	} 
	else {
		errorHandler('Problem loading Alertify. Alertify is undefined.')
	}
});

navigator.serviceWorker.addEventListener("message", event => {
	var message = event.data;
	
	switch(message.action) {
		case "showGrowlerAlert":
			enqueueGrowlerAlert(message.alert, event.ports[0]);
			break;

		default:
			break;
	}
});

/*
 * Adds a growler alert to the queue, and manages when the alert should be displayed.
 */
function enqueueGrowlerAlert(alert, port) {
	port.postMessage({action: "alertsReceived"});

	if (alertQueue.length < QUEUE_SIZE) {
		alertQueue.push({'received': Date.now(), 'scheduled': 0});

		showGrowlerAlert(alert);
	}
	else {
		let ahead = alertQueue[alertQueue.length - QUEUE_SIZE];
		let schedule = ahead.received + ahead.scheduled + DELAY_MS - Date.now();
		
		alertQueue.push({'received': Date.now(), 'scheduled': schedule});

		setTimeout(() => {
			showGrowlerAlert(alert);
		}, schedule);
	}
}

/*
 * Displays a single growler alert for DELAY_MS milliseconds.
 */
function showGrowlerAlert(alert) {
	let lines = Math.floor(alert.name.length/MAX_LINE_LENGTH); 

	expandFrame(lines);

	var content = getRiskFlag(alert.riskString) + alert.name + getHiddenId(alert.alertId); 

	alertify
		.delay(DELAY_MS)
		.closeLogOnClick(true)
		.log(content, event => {
			var alertId = event.target.querySelector("#alertId").value;

			navigator.serviceWorker.controller.postMessage({tool: "common-alerts", action: "showAlertDetails", "id": alertId});
		});

	setTimeout(() => {
		shrinkFrame(lines);
		alertQueue.shift();
	}, DELAY_MS + 250);
}

function expandFrame(lines) {	
	parent.postMessage({action: "heightenGrowlerFrame", lines: lines}, document.referrer);
}

function shrinkFrame(lines) {	
	parent.postMessage({action: "shortenGrowlerFrame", lines: lines}, document.referrer);
}

function getRiskFlag(risk) {
	switch(risk) {
		case "Informational":
			return INFORMATIONAL_FLAG;

		case "Low":
			return LOW_FLAG;

		case "Medium":
			return MEDIUM_FLAG;

		case "High":
			return HIGH_FLAG;

		default:
			return "";
	}
}

function getHiddenId(alertId) {
	return "<input id='alertId' type='hidden' name='alertId' value=" + alertId + ">"
}
