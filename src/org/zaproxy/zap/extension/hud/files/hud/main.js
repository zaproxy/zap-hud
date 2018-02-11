/*
 * Main Display
 *
 * Description goes here...
 */

var IMAGE_PREFIX = "<<ZAP_HUD_FILES>>?image=";
var v;

document.addEventListener("DOMContentLoaded", function() {
	//document.getElementById("background-link").addEventListener("click", hideMainDisplay);

	Vue.component('modal', {
		template: '#modal-template',
		props: ['show'],
		methods: {
			close: function () {
				this.$emit('close');
			},
			afterLeave: function (el) {
				parent.postMessage({action:"hideMainDisplay"}, document.referrer);
			}
		},
		mounted: function () {
			document.addEventListener("keydown", (e) => {
				if (this.show && e.keyCode == 27) {
					this.close();
				}
			});
		}
	});
	
	Vue.component('dialogModal', {
		template: '#dialog-modal-template',
		props: ['show'],
		methods: {
			close: function () {
				this.$emit('close');
			},
			buttonPress: function () {
				buttonHandler("button", port)
			
				this.close();
			}
		}
	});
	
	v = new Vue({
		el: '#app',
		data: {
			showModal: false,
			header: '',
			text: ''
		}, 
		methods: {
			
		}
	});
});

navigator.serviceWorker.addEventListener("message", function(event) {
	var message = event.data;
	
	switch(message.action) {
		case "showDialog":
			showVueDialog(message.config, event.ports[0]);
			break;

		case "showAddToolList":
			showAddToolList(message.config, event.ports[0]);
			break;

		case "showAlerts":
			showAlerts(message.config, event.ports[0]);
			break;

		case "showAlertDetails":
			showAlertDetails(message.config, event.ports[0]);
			break;

		case "showButtonOptions":
			showButtonOptions(message.config, event.ports[0]);
			break;

		case "showHudSettings":
			showHudSettings(message.config, event.ports[0]);
			break;

		case "showHttpMessage":
			showHttpMessage(message.config, event.ports[0]);
			break;

		default:
			break;
	}
});


function showListMenu(config, port) {
	var menu = loadTemplate("list-menu-template");
	var options = config.options;

	for (var key in options) {
		var item = loadTemplate("menu-option-template", menu);

		item.querySelector(".option-label").innerText += options[key];
		item.getElementById("option-name").value = key;

		// create function for on click
		var option = item.querySelector(".menu-option");
		option.addEventListener("click", buttonHandler(key, port));

		menu.getElementById("menu-options").appendChild(item);
	}

	showMainDisplay().then(function() {
		document.body.appendChild(menu);

		$( "#menu-options" ).dialog({
			title: config.title,
			width: 400,
			height: 400,
			open: function(event, ui) { $(".ui-dialog-titlebar-close").hide(); },
		});
	});
}

function showButtonOptions(config, port) {
	config.title = "Options for " + config.toolLabel;

	showListMenu(config, port);
}

function showHudSettings(config, port) {
	config.options = config.settings;
	config.title = "HUD Settings";

	showListMenu(config, port);
}

function showVueDialog(config, port) {
	// show modal pop up
	v.showModal = true;
	v.header = config.title;
	v.text = config.text;

	showMainDisplay();
}

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

function showAlerts(config, port) {
	var dialog = loadTemplate("alerts-template");
	var alertData = config.alerts;

	for (var level in alertData) {
		// update count on tab
		var tab = dialog.querySelector("#" + level.toLowerCase() +"-tab");
		var text = tab.innerText.substring(0, tab.innerText.indexOf(" "));
		text += " (" + Object.keys(alertData[level]).length +")";
		tab.innerText = text;

		// get the content panel, and set low to display first
		var content = dialog.getElementById(level.toLowerCase() + "-content");
		if (level !== "Informational") {
			content.style.display = "none";
		}

		// populate 
		// todo: fix this closure garbage
		var alertTypes = alertData[level];
		for (var alertType in alertTypes) {		
			var typeUl = loadTemplate("alert-type-template", dialog);
			
			typeUl.querySelector(".alert-type-header").innerText = alertType + " (" + alertTypes[alertType].length +")";

			var alerts = alertTypes[alertType];
			for (var i=0; i<alerts.length; i++) {
				(function () {
					var alert = loadTemplate("alert-item-template", dialog);
					var alertLi = alert.querySelector(".alert-link");

					alertLi.text = alerts[i].alert + " (" + alerts[i].id + ")";
					//var apiString = "core/view/alert/?id="+alerts[i].id;

					//todo: fix this with the actual button handlers
					alertLi.addEventListener("click", buttonHandler(alerts[i].id, port));
					//alertLi.addEventListener("click", function() {utils.buildApiCall(apiString, showAlertDetails);});

					typeUl.querySelector("ul").appendChild(alertLi);
				})();
			}
			content.appendChild(typeUl);
		}
	}

	showMainDisplay().then(function() {
		document.body.appendChild(dialog);

		// make tabs change the content pane
		var tabs = document.querySelectorAll(".tablinks");
		for (var i=0; i<tabs.length; i++) {
			tabs[i].addEventListener("click", handleOpenAlertPane);
		}

		// make all content panes accordions
		var contents = document.querySelectorAll(".alert-content");
		for (i=0; i<contents.length; i++) {
			$(contents[i]).accordion({
				active: false,
				heightStyle: "content",
				collapsible: true
			});
		}

		$( "#alerts-div" ).dialog({
			title: "Alerts For This Page",
			resizable: false,
			height: 450,
			width: 500,
			position: { my: 'left top', at: 'left+' + (550) + ' top+' + (550)},
			open: function(event, ui) { $(".ui-dialog-titlebar-close").hide(); },	// Hides close button
		});
	});
}

function handleOpenAlertPane() {
	var panes = document.querySelectorAll(".alert-content");
	for (var i=0; i < panes.length; i++) {
		panes[i].style.display = "none";
	}

	var paneName = this.id.slice(0, this.id.indexOf("-tab"));
	document.getElementById(paneName+"-content").style.display = "";
}

function showAlertDetails(config, port){
	var alertData = config.details;

	var details = loadTemplate("alert-details-template");

	for (var field in alertData) {
		var detailField = details.querySelector("#detail-" + field);
		if (detailField) {
			detailField.innerText = "   " + alertData[field] + "\n";
		}
		else {
			console.log("no label for field: #detail-" + field + " with value: " + alertData[field]);
		}
	}

	showMainDisplay().then(function() {
		document.body.appendChild(details);

		$( "#alert-details" ).dialog({
			title: alertData.name,
			resizable: true,
			height: 600,
			width: 800,
			position: { my: 'left top', at: 'left+' + (550) + ' top+' + (50)},
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

				item.querySelector(".option-icon").src = IMAGE_PREFIX + tool.icon;
				item.querySelector(".option-label").innerText += tool.label;
				item.getElementById("option-name").value = tool.name;

				// create function for on click
				var option = item.querySelector(".menu-option");
				option.addEventListener("click", buttonHandler(tool.name, port));

				dialog.getElementById("menu-options").appendChild(item);
			}
		});

		showMainDisplay().then(function() {
			document.body.appendChild(dialog);

			$( "#menu-options" ).dialog({
				title: "Select Tool to Add",
				width: 400,
				height: 400,
				open: function(event, ui) { $(".ui-dialog-titlebar-close").hide(); },
			});
		});
	});
}

function showHttpMessage(config, port) {

	var dialog = loadTemplate("http-message-template");
	var buttons = {};

	dialog.querySelector("#header-text").value = config.headerText;
	dialog.querySelector("#body-text").value = config.bodyText;

	config.buttons.forEach(function(button) {
		buttons[button.text] = httpMessageHandler(button.id, port);
	});

	showMainDisplay().then(function() {
		document.body.appendChild(dialog);

		$( "#http-message-div" ).dialog({
			resizable: true,
			height: 800,
			width: 900,
			position: { my: 'left top', at: 'left+' + (550) + ' top+' + (50)},
			buttons: buttons,
			open: function(event, ui) { $(".ui-dialog-titlebar-close").hide(); },	// Hides close button
		});
	});

	// show main display
	showMainDisplay();
}

function buttonHandler(id, port) {
	return function() {
		hideMainDisplay();
		port.postMessage({"action": "dialogSelected", id:id});
	};
}

function httpMessageHandler(id, port) {
	return function() {
		var data = {};

		data.action = "dialogSelected";
		data.id = id;
		data.header = encodeURIComponent(document.getElementById("header-text").value);
		data.body = encodeURIComponent(document.getElementById("body-text").value);
		data.method = encodeURIComponent(parseRequestHeader(data.header).method);

		hideMainDisplay();
		port.postMessage(data);
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
