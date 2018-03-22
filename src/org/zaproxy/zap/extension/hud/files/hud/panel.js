/*
 * Panel
 *
 * Description goes here...
 */

var IMAGE_URL = "<<ZAP_HUD_FILES>>?image=";
var orientation = "";
var panelKey = "";

// the Vue app
var app;

// the Event wrapper class will act as an Event dispatcher for Vue
window.Event = new class {
	constructor() {
		this.vue = new Vue();
	}

	fire(event, data = null) {
		this.vue.$emit(event, data);
	}

	listen(event, callback) {
		this.vue.$on(event, callback);
	}
}

Vue.component('hud-button', {
	template: '#hud-button-template',
	props: ['label', 'name', 'icon', 'data'],
	data() {
		return {
			currentData: this.data,
			currentIcon: this.icon,
			showData: true,
			showLabel: false,
			orientation: orientation,
			marginleft: '0rem',
			marginright: '0rem',
			isActive: false,
		}
	},
	computed: {
		isSmall: function() {
			return this.currentData == null;
		}
	},
	methods: {
		selectButton() {
			navigator.serviceWorker.controller.postMessage({
				action: 'buttonClicked',
				buttonLabel: this.name,
				tool: this.name,
				domain: getReferrerDomain(),
				url: document.referrer,
				panelKey: panelKey});
		},
		showContextMenu(event) {
			event.preventDefault();
			navigator.serviceWorker.controller.postMessage({action: "buttonMenuClicked", tool: this.name});
		},
		mouseOver() {
			this.showLabel = true;
			this.isActive = true;
			expandPanel();
		},
		mouseLeave() {
			this.showLabel = false;
			this.isActive = false;
			contractPanel();
		}
	},
	created() {
		let self = this;

		// set the margins depending on the orientation
		if (orientation === 'left') {
			self.marginleft = '.5rem';
		}
		else {
			self.marginright = '.5rem'
		}

		Event.listen('updateButton', function(data) {
			if (self.name === data.name) {
				self.currentIcon = '<<ZAP_HUD_FILES>>?image=' + data.icon;
				self.currentData = data.data;
			}
		})
	}
});

Vue.component('hud-buttons', {
	template: '#hud-buttons-template',
	data() {
		return {
			tools: {},
			orientation: orientation
		}
	},
	created() {
		let self = this;
		var panel = orientation + 'Panel';

		// initialize panels with tools		
		loadPanelTools(panel)
			.then(function(tools) {
				self.tools = tools;
			})
			.catch(console.error);

		// listen for update events to add new button
		Event.listen('updateButton', function(data) {
			if (self.tools.filter(function(tool) {return tool.name === data.name}).length === 0) {
				self.tools.push(data.tool)
			}
		})

		// listen to remove buttons
		Event.listen('removeButton', function(data) {
			self.tools = self.tools.filter(function(tool) {return tool.name !== data.name});
		})
	}

})

document.addEventListener("DOMContentLoaded", function() {
	// set orientation
	var params = document.location.search.substring(1).split("&");

	for (var i=0; i<params.length; i++) {
		var param = params[i].split("=");
		if (param[0] === "orientation") {
			orientation = param[1];
			panelKey = orientation + "Panel";
		}
	}

	window.name = orientation+"Panel";

	// initialize vue app
	app = new Vue({
		el: '#app',
		data: {

		}
	}); 
});

navigator.serviceWorker.addEventListener("message", function(event) {
	var message = event.data;
	
	switch(message.action) {
		case "updateData":
			var tool = message.tool;

			Event.fire('updateButton', {
				name: tool.name,
				data: tool.data,
				icon: tool.icon,
				tool: tool
			});
			break;

		case "removeTool":
			var tool = message.tool;

			Event.fire('removeButton', {
				name: tool.name
			})
			break;

		default:
			break;
	}
});

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