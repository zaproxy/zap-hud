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

document.addEventListener("DOMContentLoaded", function() {
	startServiceWorker();
	addButtonListener();
});