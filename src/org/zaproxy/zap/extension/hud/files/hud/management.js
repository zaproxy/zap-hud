/*
 * Management & HUD Settings
 *
 * Description goes here...
 */

var worker;

function startServiceWorker() {
	if ("serviceWorker" in navigator) {
		
		navigator.serviceWorker.register("<<ZAP_HUD_FILES>>?name=serviceworker.js")
			.then(function(registration) {
				console.log("Service worker registration successfully in scope: " + registration.scope);
				return registration;	
			})
			.then(function(registration) {
				var wasInstall = registration.installing;
				
				navigator.serviceWorker.ready
					.then(function(serviceWorkerRegistration) {
						if (wasInstall && serviceWorkerRegistration.active) {
							// force reload after installation
							refreshTarget();
						}
						else {
							onTargetLoadMessage();
							startPollWorker();
						}
					});
			})
			.catch(function(err) {
				console.log(Error("Service worker registration failed: " + err));
			});
	}
}

function addButtonListener() {
	var button = document.getElementById("settings-button");

	// Reset HUD To Defaults
	button.addEventListener("click", function() {
		configureStorage().then(function() {
			navigator.serviceWorker.controller.postMessage({action:"showHudSettings"});
		});
	});
}

function onTargetLoadMessage() {
	navigator.serviceWorker.controller.postMessage({action:"onTargetLoad"});
}

function startPollWorker() {
	if (window.Worker) {
		worker = new Worker("<<ZAP_HUD_FILES>>?name=pollWorker.js");

		loadTool('timeline').then(function(tool) {
			worker.postMessage({targetUrl: document.referrer, targetDomain: parseDomainFromUrl(document.referrer), lastMessage: tool.lastMessage});
		});

		worker.addEventListener("message", function(event) {
			navigator.serviceWorker.controller.postMessage(event.data);
		});
	}
	else {
		alert("Web Workers not supported in this browser. HUD will not work properly");
	}
}

function refreshTarget() {
	var message = { action: "refresh" };
	parent.postMessage(message, document.referrer);
}

navigator.serviceWorker.addEventListener("message", function(event) {
	var message = event.data;
	
	switch(message.action) {
		case "refreshTarget":
			refreshTarget();
			break;

		case "increaseDataPollRate":
			worker.postMessage({dataDelay: 100});
			break;

		case "decreaseDataPollRate":
			worker.postMessage({dataDelay: 1000});
			break;

		case "showTimeline":
			parent.postMessage({action: "showTimeline"}, document.referrer);
			break;

		case "hideTimeline":
			parent.postMessage({action: "hideTimeline"}, document.referrer);
			break;

		default:
			break;
	}
});

document.addEventListener("DOMContentLoaded", function() {
	//todo: return promise from "startServiceWorker" that with a boolean
	// whether the service worker was started or not. If so run "onTargetLoadMessage"
	// and "startPollWorker"
	startServiceWorker();
	addButtonListener();

});
