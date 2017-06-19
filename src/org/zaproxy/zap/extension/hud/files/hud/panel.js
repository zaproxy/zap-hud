/*
 * Panel
 *
 * Description goes here...
 */

var IMAGE_URL = "<<ZAP_HUD_API>>OTHER/hud/other/image/?name=";
var orientation = "";
var panelKey = "";


document.addEventListener("DOMContentLoaded", function() {
	// Set Orientation
	var params = document.location.search.substring(1).split("&");

	for (var i=0; i<params.length; i++) {
		var param = params[i].split("=");
		if (param[0] === "orientation") {
			orientation = param[1];
			panelKey = orientation + "Panel";
		}
	}

	window.name = orientation+"Panel";

	// Add Button Listeners
	var buttons = document.getElementsByClassName("button");

	for (var button of buttons) {
		var buttonName = button.id.substring(0, button.id.indexOf("-button"));

		button.addEventListener("mouseenter", showButtonLabel);
		button.addEventListener("mouseleave", hideButtonLabel);
		button.addEventListener("click", handleButtonAction(buttonName), true);
	}
});

document.addEventListener("message", function(event) {
	//todo: anything from other frames here
});

navigator.serviceWorker.addEventListener("message", function(event) {
	var message = event.data;
	
	switch(message.action) {
		case "updateData":
			if (hasButton(message.tool)) {
				setButtonData(message.tool);
			}
			else {
				addButton(message.tool);
			}
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

function addButton(tool) {
	var template = document.createElement("template");
	template.innerHTML = configureButtonHtml(tool);

	var newButton = template.content.firstChild;

	newButton.addEventListener("mouseenter", showButtonLabel);
	newButton.addEventListener("mouseleave", hideButtonLabel);
	newButton.addEventListener("click", handleButtonAction(tool.name), true);

	var buttonList = document.querySelector(".buttons-list");
	var lastButton = document.getElementById("add-tool-button");
	buttonList.insertBefore(newButton, lastButton);
}

function handleButtonAction(name) {
	return function() { 
		doButtonAction(name);
	};
}

function doButtonAction(buttonName) {
	navigator.serviceWorker.controller.postMessage({
		action:"buttonClicked",
		buttonLabel:buttonName,
		tool: buttonName,
		domain:getReferrerDomain(),
		url: document.referrer,
		panelKey:panelKey});
}

/* shows or hides a button label and expands or shrinks panel */
function showButtonLabel(event){
	expandPanel();
	event.target.querySelector(".button-label").style.display = "inline-block";
}

function hideButtonLabel(event){
	event.target.querySelector(".button-label").style.display = "none";
	contractPanel();
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
	return parseDomainFromUrl(document.referrer);
}

function hasButton(tool) {
	var buttonId = tool.name + "-button";
	var hasButton = document.getElementById(buttonId);

	if (hasButton) {
		return true;
	}
	return false;
}