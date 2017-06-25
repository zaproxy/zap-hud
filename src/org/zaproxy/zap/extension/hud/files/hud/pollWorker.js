var targetDomain = "";
var targetUrl = "";
var pollDelay = 1000;
var cache = null;

function poll() {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", "<<ZAP_HUD_API>>JSON/hud/view/hudData/?url=" + targetUrl, true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			if (xhr.status === 200) {

				if (xhr.responseText !== cache) {
					cache = xhr.responseText;

					var data = JSON.parse(xhr.responseText);
					postMessage({action: "pollData", pollData: data, targetUrl: targetUrl, targetDomain: targetDomain});
				}
			}
		}
	};
	xhr.send();
}

function startPolling() {
	if (targetUrl) {
		poll();
	}

	//todo: change this to pollDelay
	setTimeout(startPolling, 1000);
}

addEventListener("message", function(message) {
	targetDomain = message.data.targetDomain !== null ? message.data.targetDomain : targetDomain;
	targetUrl = message.data.targetUrl !== null ? message.data.targetUrl : targetUrl;
	pollDelay = message.data.delay !== null ? message.data.delay : pollDelay;
});

startPolling();