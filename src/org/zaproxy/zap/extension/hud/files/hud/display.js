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
			this.port.postMessage({'action': 'dialogSelected', id: id});
			this.close();
		}
	},
	data() {
		return {
			port: null,
			buttons: [
				{text: "Okay", id:"okay"},
				{text: "Cancel", id:"cancel"}
			]
		}
	},
	created: function() {
		let self = this;

		Event.$on('showDialogModal', function(data) {
			console.log('showDialogModal triggered')

			app.isDialogModalShown = true;
			app.dialogModalTitle = data.title;
			app.dialogModalText = data.text;

			self.buttons = data.buttons;
			self.port = data.port;
		})
	}
});

Vue.component('select-tool-modal', {
	template: '#select-tool-modal-template',
	props:['show', 'title'],
	methods: {
		close: function() {
			this.$emit('close');
		},
	},
	data() {
		return {
			port: null,
			tools: []
		}
	},
	created: function() {
		let self = this;

		Event.$on('showSelectToolModal', function(data) {
			console.log('showSelectToolModal triggered')

			app.isSelectToolModalShown = true;
			
			self.tools = data.tools;
			self.port = data.port;
		});
	}
})

Vue.component('tool-li', {
	template: '#tool-li-template',
	props:['image', 'label', 'toolname', 'port'],
	methods: {
		close: function() {
			this.$emit('close');
		},
		toolSelect: function() {
			this.port.postMessage({'action': 'toolSelected', 'toolname': this.toolname})
			this.close();
		}
	}
})

Vue.component('all-alerts-modal', {
	template: '#all-alerts-modal-template',
	props: ['show', 'title'],
	methods: {
		close: function () {
			this.$emit('close');
		}
	},
	data() {
		return {
			port: null,
			alerts: {}
		}
	},
	created: function() {
		let self = this;
		
		Event.$on('showAllAlertsModal', function(data) {
			console.log('showAllAlertsModal triggered')

			app.isAllAlertsModalShown = true;
			app.allAlertsModalTitle = data.title;

			self.alerts = data.alerts;
			self.port = data.port;
		})
	}
})

Vue.component('alert-list-modal', {
	template: '#alert-list-modal-template',
	props:['show', 'title'],
	methods: {
		close: function() {
			this.$emit('close');
		},
	},
	data() {
		return {
			port: null,
			alerts: {}
		}
	},
	created() {
		let self = this;

		Event.$on('showAlertListModal', function(data) {
			console.log('showAlertListModal triggered')

			app.isAlertListModalShown = true;
			app.alertListModalTitle = data.title;

			self.alerts = data.alerts;
			self.port = data.port;
		});
	}
})

Vue.component('alert-accordion', {
	template: '#alert-accordion-template',
	props:['title', 'alerts', 'port'],
	methods: {
		close: function() {
			this.$emit('close');
		},
		alertSelect: function(id) {
			this.port.postMessage({'action': 'alertSelected', 'alertId': id})
			this.close();
		}
	}
})

Vue.component('tabs', {
	template: '#tabs-template',
    data() {
        return { 
			tabs: [] 
		};
    },
    methods: {
        selectTab(selectedTab) {
            this.tabs.forEach(tab => {
                tab.isActive = (tab.href == selectedTab.href);
            });
        }
    },
    created() {
        this.tabs = this.$children;
    },

});

Vue.component('tab', {
    template: '#tab-template',
    props: {
        name: { required: true },
        selected: { default: false }
    },
    data() {
        return {
            isActive: false
        };
    },
    computed: {
        href() {
            return '#' + this.name.toLowerCase().replace(/ /g, '-');
        }
    },
    mounted() {
        this.isActive = this.selected;
    },
});

document.addEventListener("DOMContentLoaded", function() {
	
	app = new Vue({
		el: '#app',
		data: {
			isDialogModalShown: false,
			dialogModalTitle: "Default Title",
			dialogModalText: "Default Text",
			isSelectToolModalShown: false,
			isAlertListModalShown: false,
			alertListModalTitle: "Default Title",
			isAllAlertsModalShown: false,
			allAlertsModalTitle: "Default Title"
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
			showSelectTool(message.config, event.ports[0]);
			break;

		case "showAlerts":
			showAlertList(message.config, event.ports[0]);
			break;

		case "showAllAlerts":
			showAllAlerts(message.config, event.ports[0]);
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

function showSelectTool(config, port) {
	Event.$emit('showSelectToolModal', {
		tools: config.tools,
		port: port
	});

	showMainDisplay();
}

function showAlertList(config, port) {
	Event.$emit('showAlertListModal', {
		title: config.title,
		alerts: config.alerts,
		port: port
	});

	showMainDisplay();
}

function showAllAlerts(config, port) {
	Event.$emit('showAllAlertsModal', {
		title: config.title,
		alerts: config.alerts,
		port: port
	});

	showMainDisplay();
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