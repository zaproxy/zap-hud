// App is the main Vue object controlling everything
let app;
const eventBus = new Vue();
let frameId = '';
let tabId = '';
const context = {
	url: document.referrer,
	domain: utils.parseDomainFromUrl(document.referrer)
};

Vue.component('history', {
	template: '#history-template',
	data() {
		return {
			filter: '',
			regexEnabled: false,
			messages: [],
			hiddenMessageCount: 0,
			isRegExError: false,
			historyItemsFilteredMessage: '',
			enableRegExText: I18n.t('common_enable_regex')
		};
	},
	computed: {
		timeDescendingMessages() {
			return this.messages.slice().reverse();
		},
		messageCount() {
			return this.messages.length;
		},
		filteredMessages() {
			const self = this;

			const isRegex = this.regexEnabled;
			let re;

			if (isRegex) {
				try {
					re = new RegExp(this.filter);
					this.isRegExError = false;
				} catch (error) {
					this.isRegExError = true;
					return []; // Return empty array if invalid RegEx
				}
			}

			return this.messages.filter(message => {
				if (self.filter.trim().length === 0) {
					return true;
				}

				if (isRegex) {
					return re.test(message.url);
				}

				return message.url.indexOf(self.filter) >= 0;
			});
		}
	},
	methods: {
		messageSelected(id) {
			navigator.serviceWorker.controller.postMessage({tabId, frameId, action: 'showHttpMessageDetails', tool: 'history', id});
		},
		historyItemsFiltered() {
			this.historyItemsFilteredMessage = I18n.t('common_items_filtered', [this.hiddenMessageCount, this.messageCount]);
		}
	},
	watch: {
		regexEnabled() {
			this.isRegExError = !this.regexEnabled ? false : this.isRegExError;
		},
		filteredMessages() {
			this.$nextTick(function () {
				const visibleMessages = document.querySelectorAll('#history-messages .message-tr');
				this.hiddenMessageCount = (!this.messages) ? 0 : this.messages.length - visibleMessages.length;
				this.historyItemsFiltered();
			});
		}
	},
	created() {
		utils.loadTool('history')
			.then(tool => {
				this.messages = tool.messages;
			})
			.catch(utils.errorHandler);

		eventBus.$on('setMessages', data => {
			this.messages = data.messages;
		});

		eventBus.$on('updateMessages', data => {
			this.messages = this.messages.concat(data.messages);

			const count = data.messages.length;
			this.$parent.$emit('badgeDataEvent', {data: count});
		});
	},
	updated() {
		if (this.messages.length > 0) {
			const lastMessage = this.messages[this.messages.length - 1];
			const lastid = 'message-tr-' + lastMessage.id;
			const lastIdElement = document.getElementById(lastid);

			if (lastIdElement) {
				lastIdElement.scrollIntoView({block: 'end', behavior: 'smooth'});
			}

			// Move horizontal scroll bar to the left
			const tabsDetailsElems = document.querySelectorAll('tabs-details');
			if (tabsDetailsElems.length > 0) {
				tabsDetails[0].scrollTo(0, tabsDetails.scrollHeight);
			}
		}
	},
	beforeDestroy() {
		eventBus.$off('setMessages');
		eventBus.$off('updateMessages');
	}
});

Vue.component('websockets', {
	template: '#websockets-template',
	data() {
		return {
			filter: '',
			regexEnabled: false,
			messages: [],
			hiddenMessageCount: 0,
			isRegExError: false,
			websocketsItemsFilteredMessage: '',
			enableRegExText: I18n.t('common_enable_regex')
		};
	},
	computed: {
		timeDescendingMessages() {
			return this.messages.slice().reverse();
		},
		messageCount() {
			return this.messages.length;
		},
		filteredMessages() {
			const self = this;

			const isRegex = this.regexEnabled;
			let re;

			if (isRegex) {
				try {
					re = new RegExp(this.filter);
					this.isRegExError = false;
				} catch (error) {
					this.isRegExError = true;
					return []; // Return empty array if invalid RegEx
				}
			}

			return this.messages.filter(message => {
				if (self.filter.trim().length === 0) {
					return true;
				}

				if (isRegex) {
					return re.test(message.messageSummary);
				}

				return message.messageSummary.indexOf(self.filter) >= 0;
			});
		}
	},
	methods: {
		messageSelected(channelId, messageId) {
			navigator.serviceWorker.controller.postMessage({tabId, frameId, action: 'showWebSocketMessageDetails', tool: 'websockets', channelId, messageId});
		},
		websocketsItemsFiltered() {
			this.websocketsItemsFilteredMessage = I18n.t('common_items_filtered', [this.hiddenMessageCount, this.messageCount]);
		}
	},
	watch: {
		regexEnabled() {
			this.isRegExError = !this.regexEnabled ? false : this.isRegExError;
		},
		filteredMessages() {
			this.$nextTick(function () {
				const visibleMessages = document.querySelectorAll('#websockets-messages .message-tr');
				this.hiddenMessageCount = (!this.messages) ? 0 : this.messages.length - visibleMessages.length;
				this.websocketsItemsFiltered();
			});
		}
	},
	created() {
		utils.loadTool('websockets')
			.then(tool => {
				this.messages = tool.messages;
			})
			.catch(utils.errorHandler);

		eventBus.$on('setMessages', data => {
			this.messages = data.messages;
		});

		eventBus.$on('updateWebSockets', data => {
			this.messages = this.messages.concat(data.messages);

			const count = data.messages.length;
			this.$parent.$emit('badgeDataEvent', {data: count});
		});
	},
	updated() {
		if (this.messages.length > 0) {
			const lastMessage = this.messages[this.messages.length - 1];
			const lastid = 'message-tr-' + lastMessage.messageId;
			const lastIdElement = document.querySelector(lastid);
			if (lastIdElement) {
				lastIdElement.scrollIntoView({block: 'end', behavior: 'smooth'});
			}

			// Move horizontal scroll bar to the left
			const tabsDetailsElems = document.querySelectorAll('tabs-details');
			if (tabsDetailsElems.length > 0) {
				tabsDetails[0].scrollTo(0, tabsDetails.scrollHeight);
			}
		}
	}
});

Vue.component('tabs', {
	template: '#tabs-template',
	data() {
		return {
			tabs: [],
			isOpen: false,
			isArrowUp: true,
			tabsVisible: true
		};
	},
	methods: {
		closeDrawer() {
			this.isOpen = false;
			this.isArrowUp = true;
			localforage.setItem('drawer.isDrawerOpen', false)
				.catch(utils.errorHandler);
			parent.postMessage({tabId, frameId, action: 'hideBottomDrawer'}, document.referrer);
		},
		openDrawer() {
			this.isOpen = true;
			this.isArrowUp = false;
			localforage.setItem('drawer.isDrawerOpen', true)
				.catch(utils.errorHandler);
			parent.postMessage({tabId, frameId, action: 'showBottomDrawer'}, document.referrer);
		},
		toggleOpenClose() {
			if (this.isOpen) {
				this.closeDrawer();
			} else {
				this.openDrawer();
			}
		},
		selectTab(selectedTab) {
			if (!this.isOpen) {
				this.openDrawer();
				selectedTab.badgeData = 0;
			} else if (selectedTab.isActive) {
				this.closeDrawer();
			}

			localforage.setItem('drawer.activeTab', selectedTab.href)
				.catch(utils.errorHandler);

			this.highlightTab(selectedTab.href);
		},
		highlightTab(href) {
			this.tabs.forEach(tab => {
				tab.isActive = (tab.href === href);
				if (tab.isActive) {
					tab.badgeData = 0;
				}
			});
		}
	},
	created() {
		this.tabs = this.$children;

		const promises = [
			localforage.getItem('drawer.isDrawerOpen'),
			localforage.getItem('drawer.activeTab')
		];

		Promise.all(promises)
			.then(results => {
				const shouldOpenDrawer = results[0];
				const activeTab = results[1];

				if (activeTab) {
					this.highlightTab(activeTab);
				} else {
					this.highlightTab('#history');
				}

				if (shouldOpenDrawer) {
					this.openDrawer();
				}
			})
			.catch(utils.errorHandler);

		eventBus.$on('showTabs', data => {
			this.tabsVisible = true;
		});
		eventBus.$on('hideTabs', data => {
			this.tabsVisible = false;
			if (this.isOpen) {
				this.closeDrawer();
			}
		});
	},
	beforeDestroy() {
		eventBus.$off('hideTabs');
		eventBus.$off('showTabs');
	}
});

Vue.component('tab', {
	template: '#tab-template',
	props: {
		id: {required: true},
		name: {required: true},
		selected: {default: false}
	},
	data() {
		return {
			isActive: false,
			badgeData: 0
		};
	},
	computed: {
		href() {
			return '#' + this.name.toLowerCase().replace(/ /g, '-');
		},
		isBadgeData() {
			return this.badgeData > 0;
		}
	},
	mounted() {
		this.isActive = this.selected;
	},
	created() {
		const self = this;

		this.$on('badgeDataEvent', message => {
			if (!self.$parent.isOpen || !self.isActive) {
				self.badgeData += message.data;
			}
		});
	}
});

Vue.component('drawer-button-template', {
	template: '#drawer-button-template',
	props: ['label', 'icon', 'data'],
	data() {
		return {
			showData: false,
			isActive: false
		};
	},
	methods: {
		mouseOver() {
			this.isActive = true;
		},
		mouseLeave() {
			this.isActive = false;
		}
	}
});

Vue.component('drawer-button-settings', {
	template: '#drawer-button-settings-template',
	props: [],
	data() {
		return {
			icon: utils.getZapImagePath('gear.png')
		};
	},
	methods: {
		showHudSettings() {
			localforage.getItem('drawer')
				.then(drawer => {
					navigator.serviceWorker.controller.postMessage(
						{tabId, frameId, action: 'showHudSettings',
							tutorialUpdates: drawer.tutorialUpdates.length > 0, newChangelog: drawer.newChangelog});
				})
				.catch(utils.errorHandler);
		}
	},
	created() {
		utils.log(LOG_DEBUG, 'drawer', 'created');
		localforage.getItem('drawer')
			.then(drawer => {
				if (drawer.newChangelog || drawer.tutorialUpdates.length > 0) {
					this.icon = utils.getZapImagePath('gear-exclamation.png');
				} else {
					this.icon = utils.getZapImagePath('gear.png');
				}
			})
			.catch(utils.errorHandler);
	}
});

Vue.component('drawer-button-showhide', {
	template: '#drawer-button-showhide-template',
	props: [],
	data() {
		return {
			icon: utils.getZapImagePath('radar.png'),
			isHudVisible: true
		};
	},
	methods: {
		showHud() {
			this.isHudVisible = true;
			localforage.setItem('settings.isHudVisible', true)
				.then(function (value) {
					this.icon = utils.getZapImagePath('radar.png');
					parent.postMessage({tabId, frameId, action: 'showHudPanels'}, document.referrer);
					eventBus.$emit('showTabs', {});
				})
				.catch(utils.errorHandler);
		},
		hideHud() {
			this.isHudVisible = false;
			localforage.setItem('settings.isHudVisible', false)
				.then(function (value) {
					this.icon = utils.getZapImagePath('radar-grey.png');
					parent.postMessage({tabId, frameId, action: 'hideHudPanels'}, document.referrer);
					eventBus.$emit('hideTabs', {});
				})
				.catch(utils.errorHandler);
		},
		toggleIsVisible() {
			if (this.isHudVisible) {
				this.hideHud();
			} else {
				this.showHud();
			}
		}
	},
	created() {
		localforage.getItem('settings.isHudVisible')
			.then(isHudVisible => {
				utils.log(LOG_DEBUG, 'drawer', 'hudVisible?', isHudVisible);
				this.isHudVisible = isHudVisible;
				if (!this.isHudVisible) {
					this.icon = utils.getZapImagePath('radar-grey.png');
					eventBus.$emit('hideTabs', {});
				}
			})
			.catch(utils.errorHandler);
	}
});

document.addEventListener('DOMContentLoaded', () => {
	const parameters = new URL(document.location).searchParams;

	frameId = parameters.get('frameId');
	tabId = parameters.get('tabId');

	/* Vue app */
	app = new Vue({
		i18n: I18n.i18n,
		el: '#app',
		data: {

		}
	});
});

navigator.serviceWorker.addEventListener('message', event => {
	const action = event.data.action;
	const port = event.ports[0];

	switch (action) {
		case 'updateMessages':
			eventBus.$emit('updateMessages', {
				messages: event.data.messages,
				port
			});

			break;
		case 'updateWebSockets':
			eventBus.$emit('updateWebSockets', {
				messages: event.data.messages,
				port
			});

			break;
		default:
			break;
	}
});

