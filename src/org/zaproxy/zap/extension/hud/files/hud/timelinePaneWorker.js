var last = 0;
var count = 20;
var pollDelay = 200;

function poll() {
	var xhr = new XMLHttpRequest();

	xhr.open("GET", "<<ZAP_HUD_API>>JSON/core/view/messages/?start=" + last + "&count=" + count, true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			if (xhr.status === 200) {
				var messages = JSON.parse(xmlRequest.responseText).messages;

				if (messages.length > 0) {
					// update last
					last += messages.length + 1; //todo: why + 1?

					// send messages
					postMessage({action: "timelineData", data: messages});
				}
			}
		}
	};
}

function startPolling() {
	setTimeout(startPolling, pollDelay);
}

addEventListener("messaage", function(message) {
	pollDelay = message.data.delay ? message.data.delay : pollDelay;
	last = message.data.delay ? message.data.delay : pollDelay;
});

startPolling();