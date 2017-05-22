/*
 * Main Display
 *
 * Description goes here...
 */

var IMAGE_PREFIX = "<<ZAP_HUD_API>>OTHER/hud/other/image/?name=";

document.addEventListener("DOMContentLoaded", function() {
	document.getElementById("background-link").addEventListener("click", hideMainDisplay);
});

navigator.serviceWorker.addEventListener("message", function(event) {
	var message = event.data;
	
	switch(message.action) {
		case "showDialog":
			showDialog(message.config, event.ports[0]);
			break;

		case "showAddToolList":
			showAddToolList(message.config, event.ports[0]);
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

	showMainDisplay().then(function() {
		document.body.appendChild(dialog);

		$( "#dialog" ).dialog({
			resizable: false,
			height: 240,
			position: { my: 'left top', at: 'left+' + (550) + ' top+' + (550)},
			buttons: buttons,
			open: function(event, ui) { $(".ui-dialog-titlebar-close").hide(); },	// Hides close button
		});
	});
}

function showAddToolList(config, port) {

	loadAllTools().then(function(tools) {
		var dialog = loadTemplate("select-tool-template");

		tools.forEach(function(tool) {
			if (!tool.isSelected) {
				var item = loadTemplate("tool-option-template", dialog);

				item.querySelector(".tool-icon").src = IMAGE_PREFIX + tool.icon;
				item.querySelector(".tool-label").innerText += tool.label;
				item.getElementById("tool-name").value = tool.name;

				// create function for on click
				var option = item.querySelector(".tool-option");
				option.addEventListener("click", buttonHandler(tool.name, port));

				dialog.getElementById("tool-options").appendChild(item);
			}
		});

		showMainDisplay().then(function() {
			document.body.appendChild(dialog);

			$( "#tool-options" ).dialog({
				title: "Select Tool to Add",
				width: 400,
				height: 400,
				open: function(event, ui) { $(".ui-dialog-titlebar-close").hide(); },
			});
		});
	});
}



function buttonHandler(id, port) {
	return function() {
		hideMainDisplay();
		port.postMessage({"action": "dialogSelected", id:id});
		//$( this ).dialog( "close" );
	};
}

/* the injected script makes the main frame visible */
function showMainDisplay() {
	return messageWindow(parent, {action: "showMainDisplay"}, document.referrer);
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