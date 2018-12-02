/*
 * Panel
 *
 * Description goes here...
 */

var IMAGE_URL = '<<ZAP_HUD_FILES>>?image=';
var orientation = "";
var panelKey = "";
var frameId = '';
var tabId = '';
var context = {
	url: document.referrer,
	domain: parseDomainFromUrl(document.referrer)
};

// the Vue app
var app;

// Event dispatcher for Vue
var eventBus = new Vue();

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
			isDisabled: false
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
				domain: context.domain,
				url: context.url,
				panelKey: panelKey,
				frameId: frameId,
				tabId: tabId});
		},
		showContextMenu(event) {
			event.preventDefault();
			navigator.serviceWorker.controller.postMessage({action: "buttonMenuClicked", tool: this.name, frameId: frameId, tabId: tabId});
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

		eventBus.$on('updateButton', data => {
			log(LOG_TRACE, 'panel.updateButton', 'updating button: ' + data.name, data)

			if (self.name === data.name) {
				if (data.icon !== undefined) {
					self.currentIcon = IMAGE_URL + data.icon;
				}

				if (data.data !== undefined) {
					self.currentData = data.data;
				}

				if (data.isDisabled !== undefined) {
					self.isDisabled = data.isDisabled;
				}
			}
		})
	}
});

Vue.component('hud-buttons', {
	template: '#hud-buttons-template',
	data() {
		return {
			tools: [],
			orientation: orientation,
			isVisible: false
		}
	},
	created() {
		let self = this;
		var panel = orientation + 'Panel';

		// check if currently hidden
		localforage.getItem('settings.isHudVisible')
			.then(isHudVisible => {
				if (!isHudVisible) {
					return parent.postMessage({action:'hideSidePanels'}, document.referrer);
				}
			})
			.then( () => {
				// hide the panels until we know whether to show them or not to prevent flashing
				this.isVisible = true;
			})
			.catch(errorHandler)

		// initialize panels with tools
		loadPanelTools(panel)
			.then(tools => {
				self.tools = tools;

				tools.forEach(tool => {
					let channel = new MessageChannel();

					channel.port1.onmessage = function(event) {
						eventBus.$emit('updateButton', {
							name: tool.name,
							data: event.data.data,
							icon: event.data.icon,
							isDisabled: event.data.isDisabled
						});
					};

					navigator.serviceWorker.controller.postMessage({
						action: 'getTool',
						tool: tool.name,
						context: context,
						frameId: frameId,
						tabId: tabId
					}, [channel.port2]);
				})
			})
			.catch(errorHandler);

		eventBus.$on('addButton', data => {
			if (self.tools.filter(tool => tool.name === data.name)) {
				throw new Error('Attempted to add tool "' + data.name + '" to ' + orientation + 'panel, but it has already been added.')
			}
			else {
				self.tools.push(data.tool)
			}
		})

		// listen to remove buttons
		eventBus.$on('removeButton', data => {
			self.tools = self.tools.filter(tool => tool.name !== data.name);
		})
	}

})

document.addEventListener("DOMContentLoaded", () => {
	let params = new URL(document.location).searchParams;

	orientation = params.get('orientation');
	panelKey = orientation + 'Panel';
	frameId = params.get('frameId');
	tabId = params.get('tabId');

	window.name = panelKey;

	// initialize vue app
	app = new Vue({
		el: '#app',
		data: {

		}
	}); 
});

function doesContextApply(toolContext) {
	return toolContext.domain === context.domain ||
		toolContext.url === context.url ||
		toolContext.tabId === tabId ||
		('notTabId' in toolContext && toolContext.notTabId != tabId) ||
		('notDomain' in toolContext && toolContext.notDomain != context.domain);
}

navigator.serviceWorker.addEventListener("message", event => {
	var message = event.data;
	let tool;
	
	switch(message.action) {
		case "broadcastUpdate":
			tool = message.tool;

			if (message.context === undefined || doesContextApply(message.context)) {
				eventBus.$emit('updateButton', {
					isDisabled: message.isToolDisabled,
					name: tool.name,
					data: tool.data,
					icon: tool.icon,
					tool: tool
				});
			}

			break;

		case "updateData":
			tool = message.tool;

			eventBus.$emit('updateButton', {
				name: tool.name,
				data: tool.data,
				icon: tool.icon,
				tool: tool
			});
			break;

		case "addTool":
			tool = message.tool;
			eventBus.$emit('addButton', {
				name: tool.name,
				data: tool.data,
				icon: tool.icon,
				tool: tool
			});

			break;

		case "removeTool":
			tool = message.tool;

			eventBus.$emit('removeButton', {
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