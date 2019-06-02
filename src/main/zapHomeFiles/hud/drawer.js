// app is the main Vue object controlling everything
var app;
var eventBus = new Vue();
var frameId = '';
var tabId = '';
var context = {
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
            enableRegExText: I18n.t("common_enable_regex")
        }
    },
    computed: {
        timeDescendingMessages() {
            return this.messages.slice().reverse();
        },
        messageCount() {
            return this.messages.length;
        },
        filteredMessages() {
            const self=this,
                  isRegex = this.regexEnabled;
            let re;

            if (isRegex){
                try {
                    re = new RegExp(this.filter);
                    this.isRegExError = false;
                }
                catch (ex) {
                    this.isRegExError = true;
                    return []; //Return empty array if invalid RegEx
                }
            }

            return this.messages.filter( message => {
                if (self.filter.trim().length === 0) {
                    return true;
                }
                if (isRegex){
                    return re.test(message.url);
                }
                else{
                    return message.url.indexOf(self.filter)>=0;
                }
            });
        }
    },
    methods: {
        messageSelected(id) {
            navigator.serviceWorker.controller.postMessage({tabId: tabId, frameId: frameId, action: "showHttpMessageDetails", tool: "history", id:id});
        },
        historyItemsFiltered() {
            this.historyItemsFilteredMessage = I18n.t("common_items_filtered", [this.hiddenMessageCount, this.messageCount]);
        }
    },
    watch: {
        regexEnabled() {
           this.isRegExError = !this.regexEnabled ? false : this.isRegExError;
        },
        filteredMessages() {
            this.$nextTick(function () {
                const visibleMessages = document.querySelectorAll("#history-messages .message-tr");
                this.hiddenMessageCount = (!this.messages) ? 0 : this.messages.length - visibleMessages.length;
                this.historyItemsFiltered();
            });
        }
    },
    created() {
        utils.loadTool('history')
            .then(tool => {
                this.messages = tool.messages
            })
            .catch(utils.errorHandler)

        eventBus.$on('setMessages', data => {
            this.messages = data.messages;
        })

        eventBus.$on('updateMessages', data => {
            this.messages = this.messages.concat(data.messages);

            let count = data.messages.length;
            this.$parent.$emit('badgeDataEvent', {data: count})
        });

    },
    updated() {
        if (this.messages.length > 0) {
            let lastMessage = this.messages[this.messages.length - 1]
            let lastid = 'message-tr-' + lastMessage.id
            let lastIdElem = document.getElementById(lastid);

            if(lastIdElem) {
                lastIdElem.scrollIntoView({block:'end', behavior:'smooth'});
            }

            //move horizontal scroll bar to the left
            let tabsDetailsElems = document.querySelectorAll('tabs-details');
            if (tabsDetailsElems.length > 0){
                tabsDetails[0].scrollTo(0, tabsDetails.scrollHeight);
            }
        }
    },
    beforeDestroy () {
        eventBus.$off('setMessages')
        eventBus.$off('updateMessages')
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
            enableRegExText: I18n.t("common_enable_regex")
        }
    },
    computed: {
        timeDescendingMessages() {
            return this.messages.slice().reverse();
        },
        messageCount() {
            return this.messages.length;
        },
        filteredMessages() {
            const self=this,
                  isRegex = this.regexEnabled;
            let re;

            if (isRegex){
                try {
                    re = new RegExp(this.filter);
                    this.isRegExError = false;
                }
                catch (ex) {
                    this.isRegExError = true;
                    return []; //Return empty array if invalid RegEx
                }
            }

            return this.messages.filter( message => {
                if (self.filter.trim().length === 0) {
                    return true;
                }
                if (isRegex){
                    return re.test(message.messageSummary);
                }
                else{
                    return message.messageSummary.indexOf(self.filter)>=0;
                }
            });
        }
    },
    methods: {
        messageSelected(channelId, messageId) {
            navigator.serviceWorker.controller.postMessage({tabId: tabId, frameId: frameId, action: "showWebSocketMessageDetails", tool: "websockets", channelId: channelId, messageId: messageId});
        },
        websocketsItemsFiltered() {
            this.websocketsItemsFilteredMessage = I18n.t("common_items_filtered", [this.hiddenMessageCount, this.messageCount]);
        }
    },
    watch: {
        regexEnabled() {
           this.isRegExError = !this.regexEnabled ? false : this.isRegExError;
        },
        filteredMessages() {
            this.$nextTick(function () {
                const visibleMessages = document.querySelectorAll("#websockets-messages .message-tr");
                this.hiddenMessageCount = (!this.messages) ? 0 : this.messages.length - visibleMessages.length;
                this.websocketsItemsFiltered();
            });
        }
    },
    created() {
        utils.loadTool('websockets')
            .then(tool => {
                this.messages = tool.messages
            })
            .catch(utils.errorHandler)

        eventBus.$on('setMessages', data => {
            this.messages = data.messages;
        })

        eventBus.$on('updateWebSockets', data => {
            this.messages = this.messages.concat(data.messages);

            let count = data.messages.length;
            this.$parent.$emit('badgeDataEvent', {data: count})
        });
    },
    updated() {
        if (this.messages.length > 0) {
            let lastMessage = this.messages[this.messages.length - 1]
            let lastid = 'message-tr-' + lastMessage.messageId
            let lastIdElem = document.querySelector(lastid);
            if(lastIdElem){
                lastIdElem.scrollIntoView({block:'end', behavior:'smooth'});
            }

            //move horizontal scroll bar to the left
            let tabsDetailsElems = document.querySelectorAll('tabs-details');
            if (tabsDetailsElems.length > 0){
                tabsDetails[0].scrollTo(0, tabsDetails.scrollHeight);
            }
        }
    },
});

Vue.component('tabs', {
	template: '#tabs-template',
    data() {
        return {
            tabs: [],
            isOpen: false,
            isArrowUp: true
		};
    },
    methods: {
        closeDrawer() {
            this.isOpen = false;
            this.isArrowUp = true;
            localforage.setItem('drawer.isDrawerOpen', false)
                .catch(utils.errorHandler);
            parent.postMessage({tabId: tabId, frameId: frameId, action:"hideBottomDrawer"}, document.referrer);
        },
        openDrawer() {
            this.isOpen = true;
            this.isArrowUp = false;
            localforage.setItem('drawer.isDrawerOpen', true)
                .catch(utils.errorHandler);
            parent.postMessage({tabId: tabId, frameId: frameId, action:"showBottomDrawer"}, document.referrer);
        },
        toggleOpenClose() {
            this.isOpen ? this.closeDrawer() : this.openDrawer();
        },
        selectTab(selectedTab) {
            if (!this.isOpen) {
                this.openDrawer();
                selectedTab.badgeData = 0;
            }
            else {
                if (selectedTab.isActive) {
                    this.closeDrawer();
                }
            }

            localforage.setItem('drawer.activeTab', selectedTab.href)
                .catch(utils.errorHandler);

            this.highlightTab(selectedTab.href)
        },
        highlightTab(href) {
            this.tabs.forEach(tab => {
                tab.isActive = (tab.href == href);
                if (tab.isActive) {
                	tab.badgeData = 0;
                }
            });
        }
    },
    created() {
        this.tabs = this.$children;

        let promises = [
            localforage.getItem('drawer.isDrawerOpen'),
            localforage.getItem('drawer.activeTab')];

        Promise.all(promises)
            .then(results => {
                let shouldOpenDrawer = results[0];
                let activeTab = results[1];

                if (activeTab) {
                    this.highlightTab(activeTab);
                } else {
                    this.highlightTab("#history");
                }

                if (shouldOpenDrawer) {
                    this.openDrawer();
                }
            })
            .catch(utils.errorHandler);
    }
});

Vue.component('tab', {
    template: '#tab-template',
    props: {
        name: { required: true },
        selected: { default: false }
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
        let self = this;

        this.$on('badgeDataEvent', message => {
            if (!self.$parent.isOpen || ! self.isActive) {
                self.badgeData += message.data;
            }
        })
    }
});

Vue.component('drawer-button-template', {
    template: '#drawer-button-template',
    props: ['label', 'icon', 'data'],
    data() {
        return {
            showData: false,
            isActive: false,
        }
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
    methods: {
        showHudSettings() {
            navigator.serviceWorker.controller.postMessage({tabId: tabId, frameId: frameId, action:'showHudSettings'});
        }
    }
});

Vue.component('drawer-button-showhide', {
    template: '#drawer-button-showhide-template',
    props: [],
    data() {
        return {
            icon: utils.getZapImagePath('radar.png'),
            isHudVisible: true
        }
    },
    methods: {
        showHud() {
            this.isHudVisible = true;
            this.icon = utils.getZapImagePath('radar.png');
            localforage.setItem('settings.isHudVisible', true)
                .catch(utils.errorHandler);
			parent.postMessage({tabId: tabId, frameId: frameId, action:'showSidePanels'}, document.referrer);
        },
        hideHud() {
            this.isHudVisible = false;
            this.icon = utils.getZapImagePath('radar-grey.png');
            localforage.setItem('settings.isHudVisible', false)
                .catch(utils.errorHandler);
			parent.postMessage({tabId: tabId, frameId: frameId, action:'hideSidePanels'}, document.referrer);
        },
		toggleIsVisible() {
            this.isHudVisible ? this.hideHud() : this.showHud();
		},
    },
    created() {
        localforage.getItem('settings.isHudVisible')
            .then(isHudVisible => {
                this.isHudVisible = isHudVisible;
                if (!this.isHudVisible) {
                    this.icon = utils.getZapImagePath('radar-grey.png');
                }
            })
            .catch(utils.errorHandler);
    }
});

document.addEventListener("DOMContentLoaded", () => {
    let params = new URL(document.location).searchParams;

	frameId = params.get('frameId');
	tabId = params.get('tabId');

	/* Vue app */
	app = new Vue({
		i18n: I18n.i18n,
		el: '#app',
		data: {

		},
    });
});

navigator.serviceWorker.addEventListener('message', event => {
	var action = event.data.action;
	var port = event.ports[0];

	switch(action) {
        case 'updateMessages':
            eventBus.$emit('updateMessages', {
                messages: event.data.messages,
				port: port
			});

            break;
        case 'updateWebSockets':
            eventBus.$emit('updateWebSockets', {
                messages: event.data.messages,
				port: port
			});

            break;
    }
});

