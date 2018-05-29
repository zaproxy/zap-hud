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
		navigator.serviceWorker.controller.postMessage({action:"onTargetLoad", targetUrl: document.referrer});
	}

	startHeartBeat();
});

navigator.serviceWorker.addEventListener('message', function(event) {
	var message = event.data;
	
	switch(message.action) {
		case 'refreshTarget':
			parent.postMessage( {action: 'refresh'} , document.referrer);
			break;

		case 'showTimeline':
			parent.postMessage({action: 'showTimeline'}, document.referrer);
			break;

		case 'hideTimeline':
			parent.postMessage({action: 'hideTimeline'}, document.referrer);
			break;

		case 'showEnable.on':
			parent.postMessage({action: 'showEnable.on'}, document.referrer);
			break;

		case 'showEnable.off':
			parent.postMessage({action: 'showEnable.off'}, document.referrer);
			break;

		default:
			console.log('Unexpected action ' + message.action);
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
					.catch(errorHandler);
			})
			.catch(errorHandler);
	}
	else {
		alert('This browser does not support Service Workers. The HUD will not work properly.')
	}
}

/*
 * Starts sending heart beat messages to the ZAP API every 10 seconds
 */
function startHeartBeat() {
	setInterval(function() {
		log(LOG_INFO, 'heartbeat', 'heartbeat')
	}, 10000)
}