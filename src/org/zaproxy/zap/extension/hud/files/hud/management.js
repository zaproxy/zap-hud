/*
 * Management & HUD Settings
 *
 * Description goes here...
 */

function startServiceWorker() {
	if ("serviceWorker" in navigator) {
		
		navigator.serviceWorker.register("<<ZAP_HUD_API>>OTHER/hud/other/?name=serviceworker.js&isworker=true").then(function(registration) {
			console.log("Service worker registration successfully in scope: " + registration.scope);
			return registration;
			
		}).then(function(registration) {
			var wasInstall = registration.installing;
			
			navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {
				if (wasInstall && serviceWorkerRegistration.active) {
					// force reload after installation
					var message = {
						action: "refresh"
					};
					parent.postMessage(message, document.referrer);
				}
				else {
					onTargetLoadMessage();
					startPollWorker();
				}
			});
		}).catch(function(err) {
			console.log(Error("Service worker registration failed: " + err));
		});
	}
}

function addButtonListener() {
	var button = document.getElementById("settings-button");

	// Reset HUD To Defaults
	button.addEventListener("click", function() {
		configureStorage().then(function() {
			navigator.serviceWorker.controller.postMessage({action:"initializeTools"});
		});
	});
}

function onTargetLoadMessage() {
	navigator.serviceWorker.controller.postMessage({action:"onTargetLoad"});
}

function startPollWorker() {
	if (window.Worker) {
		var worker = new Worker("<<ZAP_HUD_API>>OTHER/hud/other/file/?name=pollWorker.js");

		worker.addEventListener("message", function(event) {
			navigator.serviceWorker.controller.postMessage(event.data);
		});
		
		worker.postMessage({targetUrl: document.referrer});
	}
	else {
		alert("Web Workers not supported in this browser. HUD will not work properly");
	}
}

document.addEventListener("DOMContentLoaded", function() {
	//todo: return promise from "startServiceWorker" that with a boolean
	// whether the service worker was started or not. If so run "onTargetLoadMessage"
	// and "startPollWorker"
	startServiceWorker();
	addButtonListener();

});