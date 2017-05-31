/*
 * Management & HUD Settings
 *
 * Description goes here...
 */

 function startServiceWorker() {
	if ("serviceWorker" in navigator) {
		navigator.serviceWorker.register("<<ZAP_HUD_API>>OTHER/hud/other/?name=serviceworker.js&isworker=true").then(function(registration) {
			console.log("Service worker registration successfully in scope: " + registration.scope);
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

function checkForFirstLoad() {
	var isFirstLoad = false;
	var params = document.location.search.substring(1).split("&");

	for (var i=0; i<params.length; i++) {
		var param = params[i].split("=");
		if (param[0] === "firstload") {
			
			var message = {
				action: "refresh"
			};
			parent.postMessage(message, document.referrer);
		}
	}
}

document.addEventListener("DOMContentLoaded", function() {
	checkForFirstLoad();
	startServiceWorker();
	addButtonListener();
});


