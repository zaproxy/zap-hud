function startWorkerThread () {
	// todo: notify user if browser doesn't support worker
	if (window.Worker) {
		var worker = new Worker("<<ZAP_HUD_API>>OTHER/hud/other/file/?name=timelinePaneWorker.js");

		worker.onmessage = receiveMessages;
		worker.onerror = function(error) {console.log('worker error:' + error.toString());};
	}
}

/* displays http-message info from selected item in timeline */
function displayHttpMessage(event) {
	var timelineItem = event.target.parentNode.parentNode;

	var message = {
		action: "showHttpMessage",
		httpMessageData: timelineItem.querySelector(".full-message").value
	};

	//todo: message serviceworker, duh.
	mainDisplay.postMessage(message, mainDisplay.location);
}

/* load all messages from ZAP */
// todo: happens every page load and takes way too long, need to improve performance
//       perhaps only load 50 most recent then load older messages as we scroll
// hacked: to show only last 50
function updateTimeline(httpMessages) {
	// todo: tertiary operator
	var end = httpMessages.length - 50;
	if (end < 0) {
		end = 0;
	}

	for (var i=httpMessages.length-1; i>=end; i--) {
		var item = loadTemplate("list-item");

		// get info and populate each item
		var reqHeader = parseRequestHeader(httpMessages[i].requestHeader);
		var resHeader = parseResponseHeader(httpMessages[i].responseHeader);

		item.querySelector(".method").innerText = reqHeader.method;
		item.querySelector(".status").innerText = resHeader.status;
		item.querySelector(".domain").innerText = parseDomainFromUrl(reqHeader.uri);
		item.querySelector(".file").innerText = parsePathFromUrl(reqHeader.uri);
		item.querySelector(".full-message").value = JSON.stringify(httpMessages[i]);
		item.querySelector(".list-item").addEventListener("click", displayHttpMessage);

		// append to list
		var list = document.querySelector(".list");
		list.appendChild(item);
	}
}


/* COMMUNICATION */
function receiveMessages (event) {

	if (!isFromTrustedOrigin(event)) {
		return;
	}

	var message = event.data;

	switch(message.action) {
		case "updateTimeline":
			updateTimeline(message.timelineMessages);
			break;

		default:
			break;
	}
}

/* INIT */
document.addEventListener("DOMContentLoaded", function () {
	window.addEventListener("message", receiveMessages);
	//startWorkerThread();
	console.log("timeline started")
});