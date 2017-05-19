/*
 * Main Display
 *
 * Description goes here...
 */

navigator.serviceWorker.addEventListener("message", function(event) {
	if (!isFromTrustedOrigin(event)) {
		return;
	}

	var message = event.data;
	
	switch(message.action) {
		case "showDialog":
			showDialog(message.config, event.ports[0]);
			break;

		default:
			break;
	}
});


function showDialog(config, port) {
	var buttons = {};
	var dialog = loadTemplate("dialog-template");

	dialog.querySelector("#dialog-text").innerText = config.text;

	config.buttons.forEach(function(button) {
		buttons[button.text] = buttonHandler(button.id, port);
	});

	document.body.appendChild(dialog);
	$( "#dialog" ).dialog({
		resizable: false,
		height: 240,
		position: { my: 'left top', at: 'left+' + (550) + ' top+' + (50)},
		buttons: buttons,
		open: function(event, ui) { $(".ui-dialog-titlebar-close").hide(); },	// Hides close button
	});

	showMainDisplay();
}

function buttonHandler(id, port) {
	return function() {
		hideMainDisplay();
		port.postMessage({"action": "dialogSelected", id:id});
		$( this ).dialog( "close" );
	};
}

/* the injected script makes the main frame visible */
function showMainDisplay() {
	parent.postMessage({action: "showMainDisplay"}, document.referrer);
}

/* removes all displays added to the main display and then the injected script makes the main frame invisible */
function hideMainDisplay() {
	parent.postMessage({action:"hideMainDisplay"}, document.referrer);

	// remove all display elements
	// todo: this is a little hacky
	var displays = document.querySelectorAll(".display");

	for (var i=0; i<displays.length; i++) {
		var display = displays[i];
		display.parentNode.parentNode.removeChild(display.parentNode);
	}
}