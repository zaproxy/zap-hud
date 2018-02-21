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
			if (!app.keepShowing) {
				parent.postMessage({action:"hideMainDisplay"}, document.referrer);
			}
			app.keepShowing = false;
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
		alertSelect: function(alert) {
			// set keepShowing so that we don't hide the display frame
			app.keepShowing = true;
			app.isAlertListModalShown = false;
			app.isAllAlertsModalShown = false;

			this.port.postMessage({'action': 'alertSelected', 'alertId': alert.id})
		}
	}
})

Vue.component('alert-details-modal', {
	template: '#alert-details-modal-template',
	props: ['show', 'title'],
	methods: {
		close: function() {
			this.$emit('close');
		}
	},
	data() {
		return {
			port: null,
			details: {}
		}
	},
	created() {
		let self = this;

		Event.$on('showAlertDetailsModal', function(data) {
			app.isAlertDetailsModalShown = true;
			app.alertDetailsModalTitle = data.title;
			
			self.details = data.details;
			self.port = data.port;
		})
	}
})

Vue.component('simple-menu-modal', {
	template: '#simple-menu-modal-template',
	props: ['show', 'title'],
	methods: {
		close: function() {
			this.$emit('close');
		},
		itemSelect: function(itemId) {
			this.port.postMessage({'action': 'itemSelected', 'id': itemId}); 
			this.close();
		}
	},
	data() {
		return {
			port: null,
			items: {}
		}
	},
	created() {
		let self = this;

		Event.$on('showSimpleMenuModal', function(data) {
			app.isSimpleMenuModalShown = true;
			app.simpleMenuModalTitle = data.title;

			self.items = data.items;
			self.port = data.port;
		})
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
			dialogModalTitle: "HUD Modal",
			dialogModalText: "text",
			isSelectToolModalShown: false,
			isAlertListModalShown: false,
			alertListModalTitle: "Alerts",
			isAllAlertsModalShown: false,
			allAlertsModalTitle: "All Alerts",
			isAlertDetailsModalShown: false,
			alertDetailsModalTitle: "Alert Details",
			isSimpleMenuModalShown: false,
			simpleMenuModalTitle: "Menu",
			keepShowing: false,
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
	Event.$emit('showAlertDetailsModal', {
		title: config.title,
		details: config.details,
		port: port
	});

	showMainDisplay();
}

function showButtonOptions(config, port) {
	Event.$emit('showSimpleMenuModal', {
		title: config.toolLabel,
		items: config.options,
		port: port
	});

	showMainDisplay();
}

function showHudSettings(config, port) {
	Event.$emit('showSimpleMenuModal', {
		title: 'HUD Settings',
		items: config.settings,
		port: port
	});

	showMainDisplay();
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