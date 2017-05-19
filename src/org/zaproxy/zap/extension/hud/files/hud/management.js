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

	button.addEventListener("click", configureStorage);
}

document.addEventListener("DOMContentLoaded", function() {
	startServiceWorker();
	addButtonListener();
});


