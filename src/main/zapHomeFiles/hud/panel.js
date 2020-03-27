/*
 * Panel
 *
 * Description goes here...
 */

const IMAGE_URL = '<<ZAP_HUD_FILES>>/image/';
let orientation = '';
let panelKey = '';
let frameId = '';
let tabId = '';
const context = {
	url: document.referrer,
	domain: utils.parseDomainFromUrl(document.referrer)
};

// The Vue app
let app;

// Event dispatcher for Vue
const eventBus = new Vue();

Vue.component('hud-button', {
	template: '#hud-button-template',
	props: ['label', 'name', 'icon', 'data'],
	data() {
		return {
			currentData: this.data,
			currentIcon: this.icon,
			showData: true,
			orientation,
			marginleft: '0rem',
			marginright: '0rem',
			labelmarginleft: '0rem',
			labelmarginright: '0rem',
			isActive: false,
			isDisabled: false,
			isClosed: true,
			direction: 'ltr'
		};
	},
	computed: {
		isSmall() {
			return this.currentData === null;
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
				panelKey,
				frameId,
				tabId});
		},
		showContextMenu(event) {
			event.preventDefault();
			navigator.serviceWorker.controller.postMessage({action: 'buttonMenuClicked', tool: this.name, frameId, tabId});
		},
		mouseOver() {
			this.labelmarginleft = this.marginleft;
			this.labelmarginright = this.marginright;
			this.isActive = true;
			this.isClosed = false;
			expandPanel();
		},
		mouseLeave() {
			this.labelmarginleft = '0rem';
			this.labelmarginright = '0rem';
			this.isActive = false;
		},
		transitionEnd() {
			let areAllButtonsClosed = true;

			if (!this.isActive) {
				this.isClosed = true;
			}

			this.$parent.$children.forEach(child => {
				if (!child.isClosed) {
					areAllButtonsClosed = false;
				}
			});

			if (areAllButtonsClosed) {
				contractPanel();
			}
		}
	},
	created() {
		const self = this;

		// Set the margins depending on the orientation
		if (orientation === 'left') {
			self.marginleft = '.5rem';
			self.direction = 'ltr';
		} else {
			self.marginright = '.5rem';
			self.direction = 'rtl';
		}

		eventBus.$on('updateButton', data => {
			utils.log(LOG_TRACE, 'panel.updateButton', 'updating button: ' + data.name, data);

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
		});
	},
	beforeDestroy() {
		eventBus.$off('updateButton');
	}
});

Vue.component('hud-buttons', {
	template: '#hud-buttons-template',
	data() {
		return {
			tools: [],
			orientation,
			isVisible: false
		};
	},
	created() {
		const self = this;
		const panel = orientation + 'Panel';

		// Check if currently hidden
		localforage.getItem('settings.isHudVisible')
			.then(isHudVisible => {
				if (isHudVisible !== null && !isHudVisible) {
					return parent.postMessage({action: 'hideHudPanels'}, document.referrer);
				}
			})
			.then(() => {
				// Hide the panels until we know whether to show them or not to prevent flashing
				this.isVisible = true;
			})
			.catch(utils.errorHandler);

		// Initialize panels with tools
		utils.loadPanelTools(panel)
			.then(tools => {
				self.tools = tools;

				tools.forEach(tool => {
					const channel = new MessageChannel();
					channel.port1.start();
					channel.port2.start();

					channel.port1.addEventListener('message', event => {
						eventBus.$emit('updateButton', {
							name: tool.name,
							data: event.data.data,
							icon: event.data.icon,
							isDisabled: event.data.isDisabled
						});
					});

					navigator.serviceWorker.controller.postMessage({
						action: 'getTool',
						tool: tool.name,
						context,
						frameId,
						tabId
					}, [channel.port2]);
				});
			})
			.catch(utils.errorHandler);

		eventBus.$on('addButton', data => {
			if (self.tools.filter(tool => tool.name === data.name) > 0) {
				throw new Error('Attempted to add tool "' + data.name + '" to ' + orientation + 'panel, but it has already been added.');
			} else {
				self.tools.push(data.tool);
			}
		});

		// Listen to remove buttons
		eventBus.$on('removeButton', data => {
			self.tools = self.tools.filter(tool => tool.name !== data.name);
		});
	},
	beforeDestroy() {
		eventBus.$off('addButton');
		eventBus.$off('removeButton');
	}
});

document.addEventListener('DOMContentLoaded', () => {
	const parameters = new URL(document.location).searchParams;

	orientation = parameters.get('orientation');
	panelKey = orientation + 'Panel';
	frameId = parameters.get('frameId');
	tabId = parameters.get('tabId');

	window.name = panelKey;

	// Initialize vue app
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
		('notTabId' in toolContext && toolContext.notTabId !== tabId) ||
		('notDomain' in toolContext && toolContext.notDomain !== context.domain) ||
		('scope' in toolContext && toolContext.scope.includes(context.domain));
}

navigator.serviceWorker.addEventListener('message', event => {
	const message = event.data;
	let tool;

	switch (message.action) {
		case 'broadcastUpdate':
			tool = message.tool;

			if (message.context === undefined || doesContextApply(message.context)) {
				eventBus.$emit('updateButton', {
					isDisabled: message.isToolDisabled,
					name: tool.name,
					data: tool.data,
					icon: tool.icon,
					tool
				});
			}

			break;

		case 'updateData':
			tool = message.tool;

			eventBus.$emit('updateButton', {
				name: tool.name,
				data: tool.data,
				icon: tool.icon,
				tool
			});
			break;

		case 'addTool':
			tool = message.tool;
			eventBus.$emit('addButton', {
				name: tool.name,
				data: tool.data,
				icon: tool.icon,
				tool
			});

			break;

		case 'removeTool':
			tool = message.tool;

			eventBus.$emit('removeButton', {
				name: tool.name
			});
			break;

		default:
			break;
	}
});

/* Sends message to inject script to expand or contract width of panel iframe */
function expandPanel() {
	const message = {
		action: 'expandPanel',
		orientation
	};
	parent.postMessage(message, document.referrer);
}

function contractPanel() {
	const message = {
		action: 'contractPanel',
		orientation
	};

	parent.postMessage(message, document.referrer);
}
