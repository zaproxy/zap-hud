function initializeTimeline() {
	loadTool("timeline").then(function(tool) {
		var messages = tool.messages;

		setTimeline(messages);
	});
}

function updateTimeline(count) {
	loadTool("timeline").then(function(tool) {
		var messages = tool.messages;

		setTimeline(messages.slice(messages.length - count, messages.length));
	});
}

function setTimeline(httpMessages) {
	var top = null;

	for (var i=0; i<httpMessages.length; i++) {
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
		top = document.getElementById("top");

		list.insertBefore(item, top);

		top.id = "";
		top = document.getElementById("new");
		top.id = "top";
	}
}

/* displays http-message info from selected item in timeline */
function displayHttpMessage(event) {
	var timelineItem = event.target.parentNode.parentNode;
	var httpMessageData = timelineItem.querySelector(".full-message").value;

	navigator.serviceWorker.controller.postMessage({action: "showHttpMessage", httpMessageData: httpMessageData});
}

navigator.serviceWorker.addEventListener("message", function(event) {
	var message = event.data;
	
	switch(message.action) {
		case "updateMessages":
			updateTimeline(message.count);
			break;

		default:
			break;
	}
});

document.addEventListener("DOMContentLoaded", function () {
	initializeTimeline();
});