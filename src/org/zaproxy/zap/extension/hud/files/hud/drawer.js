// app is the main Vue object controlling everything
var app;

// the Event wrapper class will act as an Event dispatcher for Vue
window.Event = new (class {
	constructor() {
		this.vue = new Vue();
	}

	fire(event, data = null) {
		this.vue.$emit(event, data);
	}

	listen(event, callback) {
		this.vue.$on(event, callback);
	}
})

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
            navigator.serviceWorker.controller.postMessage({action: "showHttpMessageDetails", tool: "history", id:id});
        }
    },
    created() {
        let self = this;

        loadTool('history')
            .then(tool => {
                self.messages = tool.messages
            })
            .catch(errorHandler)

        Event.listen('setMessages', data => {
            self.messages = data.messages;
        })

		Event.listen('updateMessages', data => {
            self.messages = self.messages.concat(data.messages);

            let count = data.messages.length;
            self.$parent.$emit('badgeDataEvent', {data: count}) 
        });
    },
    updated() {
        if (this.messages.length > 0) {
            let lastMessage = this.messages[this.messages.length - 1]
            let lastid = 'message-tr-' + lastMessage.id

            document.getElementById(lastid).scrollIntoView({block:'end', behaviour:'smooth'});
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
            parent.postMessage({action:"hideBottomDrawer"}, document.referrer);
        },
        openDrawer() {
            this.isOpen = true;
            this.isArrowUp = false;
            localforage.setItem('drawer.isDrawerOpen', true)
                .catch(errorHandler);
            parent.postMessage({action:"showBottomDrawer"}, document.referrer);
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
        let self = this;
        self.tabs = this.$children;

        let promises = [
            localforage.getItem('drawer.isDrawerOpen'),
            localforage.getItem('drawer.activeTab')];

        Promise.all(promises)
            .then(results => {
                let shouldOpenDrawer = results[0];
                let activeTab = results[1];

                if (shouldOpenDrawer) {
                    self.openDrawer();

                    if (activeTab) {
                        self.highlightTab(activeTab);
                    }
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

Vue.component('hud-button-config', {
	template: '#hud-button-config',
	props: ['label', 'icon', 'data'],
	data() {
		return {
			showData: false,
			isActive: false
		}
	},
	methods: {
		click: function() {
			navigator.serviceWorker.controller.postMessage({action:'showHudSettings'});
		},
		mouseOver() {
			this.isActive = true;
		},
		mouseLeave() {
			this.isActive = false;
		}
	}
})

Vue.component('hud-button-showhide', {
	template: '#hud-button-showhide',
	props: ['label', 'icon', 'data'],
	data() {
		return {
			showData: false,
			isActive: false,
			hudVisible: true
		}
	},
	methods: {
		click: function() {
			if (this.hudVisible) {
				parent.postMessage({action:'hideSidePanels'}, document.referrer);
			} else {
				parent.postMessage({action:'showSidePanels'}, document.referrer);
			}
			this.hudVisible = ! this.hudVisible;
		},
		mouseOver() {
			this.isActive = true;
		},
		mouseLeave() {
			this.isActive = false;
		}
	}
})

document.addEventListener("DOMContentLoaded", () => {

	/* Vue app */
	app = new Vue({
		el: '#app',
		data: {
			
		},
    });
    
    // notify service worker drawer has been refreshed
    navigator.serviceWorker.controller.postMessage({
        action: 'frameload',
        name: 'drawer'
    });
});

navigator.serviceWorker.addEventListener('message', event => {
	var action = event.data.action;
	var port = event.ports[0];
	
	switch(action) {
        case 'updateMessages':
			Event.fire('updateMessages', {
                messages: event.data.messages,
				port: port
			});
			
            break;
    }
});