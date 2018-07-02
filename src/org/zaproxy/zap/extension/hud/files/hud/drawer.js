// app is the main Vue object controlling everything
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
    created() {
        let self = this;

        loadTool('history')
            .then(function(tool) {
                self.messages = tool.messages
            })
            .catch(errorHandler)

        Event.listen('setMessages', function(data) {
            self.messages = data.messages;
        })

		Event.listen('updateMessages', function(data) {
            self.messages = self.messages.concat(data.messages);
		});
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
            if (this.isOpen) {
                this.closeDrawer();
            }
            else {
                this.openDrawer();
            }
        },
        selectTab(selectedTab) {
            if (!this.isOpen) {
                this.openDrawer();
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
            .then(function(results) {
                let isDrawerOpen = results[0];
                let activeTab = results[1];

                if (isDrawerOpen) {
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

navigator.serviceWorker.addEventListener('message', function(event) {
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