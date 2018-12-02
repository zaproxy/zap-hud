// app is the main Vue object controlling everything
var app;
var eventBus = new Vue();
var frameId = '';
var tabId = '';
var context = {
    url: document.referrer,
    domain: parseDomainFromUrl(document.referrer)
};

Vue.component('history', {
    template: '#history-template',
    data() {
        return {
            messages: []
        }
    },
    computed: {
        timeDescendingMessages() {
            return this.messages.slice().reverse();
        }
    },
    methods: {
        messageSelected(id) {
            navigator.serviceWorker.controller.postMessage({tabId: tabId, frameId: frameId, action: "showHttpMessageDetails", tool: "history", id:id});
        }
    },
    created() {
        loadTool('history')
            .then(tool => {
                this.messages = tool.messages
            })
            .catch(errorHandler)

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

            document.getElementById(lastid).scrollIntoView({block:'end', behaviour:'smooth'});
            //move horizontal scroll bar to the left
            var tabsDetails = document.getElementsByClassName('tabs-details')[0];
            tabsDetails.scrollTo(0,tabsDetails.scrollHeight)
        }
    }
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
                .catch(errorHandler);
            parent.postMessage({tabId: tabId, frameId: frameId, action:"hideBottomDrawer"}, document.referrer);
        },
        openDrawer() {
            this.isOpen = true;
            this.isArrowUp = false;
            localforage.setItem('drawer.isDrawerOpen', true)
                .catch(errorHandler);
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
                .catch(errorHandler);

            this.highlightTab(selectedTab.href)
        },
        highlightTab(href) {
            this.tabs.forEach(tab => {
                tab.isActive = (tab.href == href);
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
            .catch(errorHandler);
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
            if (!self.$parent.isOpen) {
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
            icon: getZapImagePath('radar.png'),
            isHudVisible: true
        }
    },
    methods: {
        showHud() {
            this.isHudVisible = true;
            this.icon = getZapImagePath('radar.png');
            localforage.setItem('settings.isHudVisible', true)
                .catch(errorHandler);
			parent.postMessage({tabId: tabId, frameId: frameId, action:'showSidePanels'}, document.referrer);
        },
        hideHud() {
            this.isHudVisible = false;
            this.icon = getZapImagePath('radar-grey.png');
            localforage.setItem('settings.isHudVisible', false)
                .catch(errorHandler);
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
                    this.icon = getZapImagePath('radar-grey.png');
                }
            })
            .catch(errorHandler);
    }
})

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

    // notify service worker drawer has been refreshed
    navigator.serviceWorker.controller.postMessage({
        action: 'frameload',
        name: 'drawer',
        tabId: tabId,
        frameId: frameId
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
    }
});

