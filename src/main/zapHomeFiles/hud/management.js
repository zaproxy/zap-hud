/*
 * Management & HUD Settings
 *
 * Description goes here...
 */

var app;

// TODO: implement a super cool loading screen
Vue.component('loading-screen', {
	template: '#loading-screen-template',
	props: []
})

document.addEventListener('DOMContentLoaded', () => {
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

		window.addEventListener('message', windowMessageListener)
		window.addEventListener('beforeunload', beforeunloadListener)

		navigator.serviceWorker.addEventListener('message', serviceWorkerMessageListener)

		// send targetload message 
		navigator.serviceWorker.controller.postMessage({action:"targetload", targetUrl: document.referrer});

	}

	startHeartBeat();
});


/*
 * Receive messages from the target domain, which is not trusted.
 * As a result we only accept messages that contain a shared secret generated and injected at runtime.
 * The contents of the messages should still be treated as potentially malicious.
 */
function windowMessageListener(event) {
	if (! event.data.hasOwnProperty('sharedSecret')) {
		log(LOG_WARN, 'management.receiveMessage', 'Message without sharedSecret rejected');
		return;
	}
	if (event.data.sharedSecret === "<<ZAP_SHARED_SECRET>>") {
		navigator.serviceWorker.controller.postMessage(event.data);
	} else {
		log(LOG_WARN, 'management.receiveMessage', 'Message with incorrect sharedSecret rejected ' + event.data.sharedSecret);
	}
}

function beforeunloadListener() {
	let currentTimeInMs = new Date().getTime();

	navigator.serviceWorker.controller.postMessage({action: 'unload', time: currentTimeInMs})
		.catch(errorHandler)
}

function serviceWorkerMessageListener(event) {
	var message = event.data;
	
	switch(message.action) {
		case 'refreshTarget':
			parent.postMessage( {action: 'refresh'} , document.referrer);
			break;

		case 'showEnable.on':
			parent.postMessage({action: 'showEnable.on'}, document.referrer);
			break;

		case 'showEnable.off':
			parent.postMessage({action: 'showEnable.off'}, document.referrer);
			break;

		case 'showEnable.count':
			parent.postMessage({action: 'showEnable.count'}, document.referrer);
			break;

		case 'commonAlerts.alert':
			parent.postMessage(message, document.referrer);
			break;

		default:
			console.log('Unexpected action ' + message.action);
			break;
	}
}


/*
 * Starts the service worker and refreshes the target on success.
 */ 
function startServiceWorker() {
	if ('serviceWorker' in navigator) {

		navigator.serviceWorker.register('<<ZAP_HUD_FILES>>?name=serviceworker.js')
			.then(registration => {
				console.log('Service worker registration was successful for the scope: ' + registration.scope);

				// wait until serviceworker is installed and activated
				navigator.serviceWorker.ready
					.then(serviceWorkerRegistration => {

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
	setInterval(() => {
		log(LOG_INFO, 'heartbeat', 'heartbeat')
	}, 10000)
}