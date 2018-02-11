var app;
window.Event = new Vue();

Vue.component('modal', {
	template: '#modal-template',
	props: ['show', 'title', 'text'],
	methods: {
		close: function () {
			this.$emit('close');
		},
		afterLeave: function (el) {
			parent.postMessage({action:"hideMainDisplay"}, document.referrer);
		}
	},
	mounted: function () {
		// todo: supposed to close modal on escape key, doesn't work
		document.addEventListener("keydown", (e) => {
			if (this.show && e.keyCode == 27) {
				this.close();
			}
		});
	},
})

Vue.component('dialog-modal', {
	template: '#dialog-modal-template',
	props: ['show', 'title', 'text'],
	methods: {
		close: function() {
			this.$emit('close');
		},
		buttonClick: function(id) {
			this.port.postMessage({"action": "dialogSelected", id:id});
			this.close();
		}
	},
	data() {
		return {
			buttons: [
				{text: "Okay", id:"okay"},
				{text: "close", id:"close"}
			]
		}
	},
	created: function() {
		let self = this;

		Event.$on('showDialogModal', function(data) {
			console.log("showDialogModal triggered")

			app.isDialogModalShown = true;
			app.dialogModalTitle = data.title;
			app.dialogModalText = data.text;

			self.buttons = data.buttons;
			self.port = data.port;
		})
	}
});

document.addEventListener("DOMContentLoaded", function() {
	
	app = new Vue({
		el: '#app',
		data: {
			isDialogModalShown: false,
			dialogModalTitle: "Default Title",
			dialogModalText: "Default Text"
		},
	});
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

function showDialog(config, port) {
	Event.$emit('showDialogModal', {
		title: config.title, 
		text: config.text,
		buttons: config.buttons,
		port: port
	});
	
	showMainDisplay();
}

function showAddToolList(config, port) {

}

function showAlerts(config, port) {

}

function showAlertDetails(config, port) {

}

function showButtonOptions(config, port) {

}

function showHudSettings(config, port) {

}

function showHttpMessage(config, port) {

}

/* the injected script makes the main frame visible */
function showMainDisplay() {
	return messageWindow(parent, {action: "showMainDisplay"}, document.referrer);
}

/* the injected script makes the main frame invisible */
function hideMainDisplay() {
	parent.postMessage({action:"hideMainDisplay"}, document.referrer);
}