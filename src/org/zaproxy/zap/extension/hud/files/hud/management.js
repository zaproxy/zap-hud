/*
 * Management & HUD Settings
 *
 * Description goes here...
 */

var app;
var worker;

Vue.component('hud-button', {
	template: '#hud-button-template',
	props: ['label', 'icon', 'data'],
	data() {
		return {
			showData:false
		}
	},
	methods: {
		click: function() {
			navigator.serviceWorker.controller.postMessage({action:'showHudSettings'});
		},
	}
})

// TODO: implement a super cool loading screen
Vue.component('loading-screen', {
	template: '#loading-screen-template',
	props: []
})

document.addEventListener('DOMContentLoaded', function() {
	// initialize Vue app
	app = new Vue({
		el: '#app',
		data: {
			isSettingsButtonShown: false,
			isLoadingScreenShown: false
		}
	});

	// if first time starting HUD boot up the service worker
	if (navigator.serviceWorker.controller === null) {
		/*
		// TODO: turn this on for a cool loading screen
		parent.postMessage( {action: 'expandManagement'} , document.referrer);
		app.isLoadingScreenShown = true;
		*/
		startServiceWorker();
	}
	else {
		// show the settings button
		app.isSettingsButtonShown = true;

		// send onTargetLoad message 
		navigator.serviceWorker.controller.postMessage({action:'onTargetLoad'});
		startPollWorker();
	}
});

navigator.serviceWorker.addEventListener('message', function(event) {
	var message = event.data;
	
	switch(message.action) {
		case 'refreshTarget':
			parent.postMessage( {action: 'refresh'} , document.referrer);
			break;

		case 'increaseDataPollRate':
			worker.postMessage({dataDelay: 100});
			break;

		case 'decreaseDataPollRate':
			worker.postMessage({dataDelay: 1000});
			break;

		case 'showTimeline':
			parent.postMessage({action: 'showTimeline'}, document.referrer);
			break;

		case 'hideTimeline':
			parent.postMessage({action: 'hideTimeline'}, document.referrer);
			break;

		default:
			break;
	}
});


/*
 * Starts the service worker and refreshes the target on success.
 */ 
function startServiceWorker() {
	if ('serviceWorker' in navigator) {

		navigator.serviceWorker.register('<<ZAP_HUD_FILES>>?name=serviceworker.js')
			.then(function(registration) {
				console.log('Service worker registration was successful for the scope: ' + registration.scope);

				// wait until serviceworker is installed and activated
				navigator.serviceWorker.ready
					.then(function(serviceWorkerRegistration) {

						// refresh the target page
						parent.postMessage( {action: 'refresh'} , document.referrer);
					})
					.catch(console.log);
			})
			.catch(console.log);
	}
	else {
		alert('This browser does not support Service Workers. The HUD will not work properly.')
	}
}

/*
 * TO BE DEPRECATED WITH WEB SOCKETS
 * Starts the web worker that polls ZAP.
 */
function startPollWorker() {
	if (window.Worker) {
		worker = new Worker('<<ZAP_HUD_FILES>>?name=pollWorker.js');

		loadTool('timeline')
			.then(function(tool) {
				// let the worker know where to start polling messages from
				worker.postMessage({
					targetUrl: document.referrer, 
					targetDomain: parseDomainFromUrl(document.referrer), 
					lastMessage: tool.lastMessage});
			})
			.catch(console.log);

		worker.addEventListener('message', function(event) {
			// forward messages from the web worker to the service worker
			navigator.serviceWorker.controller.postMessage(event.data);
		});
	}
	else {
		alert('This browser does not support Web Workers. HUD will not work properly');
	}
}
