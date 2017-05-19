/*
 * Panel
 *
 * Description goes here...
 */

var IMAGE_URL = "<<ZAP_HUD_API>>OTHER/hud/other/image/?name=";
var orientation = "";


document.addEventListener("DOMContentLoaded", function() {
	// Set Orientation
	var params = document.location.search.substring(1).split("&");

	for (var i=0; i<params.length; i++) {
		var param = params[i].split("=");
		if (param[0] === "orientation") {
			orientation = param[1];
		}
	}

	window.name = orientation+"Panel";


	// Add Listeners
	var buttons = document.getElementsByClassName("button");

	for (var button of buttons) {
		var buttonName = button.id.substring(0, button.id.indexOf("-"));

		button.addEventListener("mouseenter", showButtonLabel);
		button.addEventListener("mouseleave", hideButtonLabel);
		button.addEventListener("click", handleButtonAction(buttonName), true);
	}
});

document.addEventListener("message", function(event) {
	console.log(event);
});

navigator.serviceWorker.addEventListener("message", function(event) {
	if (!isFromTrustedOrigin(event)) {
		return;
	}

	var message = event.data;
	
	switch(message.action) {
		case "updateData":
			setButtonData(message.tool);
			break;

		default:
			break;
	}
});


function setButtonData(tool) {
	var buttonId = tool.name+"-button";
	var button = document.getElementById(buttonId);

	button.querySelector(".button-data").innerText = tool.data;
	button.querySelector("img").src = IMAGE_URL + tool.icon;
}

function handleButtonAction(name) {
	return function() { doButtonAction(name); };
}

function doButtonAction(buttonName) {
	navigator.serviceWorker.controller.postMessage({action:"useTool", tool:buttonName, domain:getReferrerDomain()});
}

/* shows or hides a button label and expands or shrinks panel */
function showButtonLabel(event){
	expandPanel();
	event.target.querySelector(".button-label").style.display = "inline-block";
}

function hideButtonLabel(event){
	event.target.querySelector(".button-label").style.display = "none";

	if (event.target.id != "add-tool-button") {
		contractPanel();
	}
}

/* sends message to inject script to expand or contract width of panel iframe */
function expandPanel() {
	var message = {
		action: "expandPanel",
		orientation: orientation
	};
	parent.postMessage(message, document.referrer);
}

function contractPanel() {
	var message = {
		action: "contractPanel",
		orientation: orientation
	};

	parent.postMessage(message, document.referrer);
}

/* parses the domain from a uri string */
function getReferrerDomain() {
	var parser = document.createElement("a");
	parser.href = document.referrer;

	return parser.protocol + "//" + parser.host;
}