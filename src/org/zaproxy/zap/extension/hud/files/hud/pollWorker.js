var dataDelay = 1000;
var targetDomain = "";
var targetUrl = "";
var cache = null;

var messageDelay = 3000;
var messageCount = 20;
var messageQueue = [];
var lastMessage = 0;

function pollData() {
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

function pollMessages() {
	var xhr = new XMLHttpRequest();

	xhr.open("GET", "<<ZAP_HUD_API>>JSON/core/view/messages/?start=" + lastMessage + "&count=" + messageCount, true);
	xhr.onreadystatechange = function() {
		if (xhr.readyState === XMLHttpRequest.DONE) {
			if (xhr.status === 200) {
				
				var messages = JSON.parse(xhr.responseText).messages;

				if (messages.length > 0) {

					lastMessage += messages.length;

					postMessage({action: "pollMessages", pollMessages: messages, lastMessage: lastMessage});
				}
			}
		}
	};
	xhr.send();
}

function startPollingData() {
	if (targetUrl) {
		pollData();
	}

	setTimeout(startPollingData, dataDelay);
}

function startPollingMessages() {
	if (lastMessage > 0) {
		pollMessages();
	}
	setTimeout(startPollingMessages, messageDelay);
}

addEventListener("message", function(message) {
	var data = message.data;

	if ('targetDomain' in data)
		targetDomain = data.targetDomain;

	if ('targetUrl' in data)
		targetUrl = data.targetUrl;

	if ('dataDelay' in data)
		dataDelay = data.dataDelay;

	if ('messageDelay' in data)
		messageDelay = data.messageDelay;

	if ('lastMessage' in data) {
		lastMessage = data.lastMessage;
	}
});

startPollingData();
// Disable until its fixed
//startPollingMessages();