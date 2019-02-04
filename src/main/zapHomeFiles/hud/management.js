/*
 * Management & HUD Settings
 *
 * Description goes here...
 */


// Injected strings
var SHOW_WELCOME_SCREEN = '<<SHOW_WELCOME_SCREEN>>' === 'true' ? true : false ;
var TUTORIAL_URL = '<<TUTORIAL_URL>>';
var ZAP_SHARED_SECRET = '<<ZAP_SHARED_SECRET>>';

var app;
var tabId = '';
var frameId = '';
var context = {
	url: document.referrer,
	domain: utils.parseDomainFromUrl(document.referrer)
};

Vue.component('loading-screen', {
	template: '#loading-screen-template',
	methods: {
		target: function() {
			if (dontShowAgain.checked) {
				dontShowWelcomeAgain().then(() => {
					// Refresh the target so the HUD buttons appear
					parent.postMessage( {action: 'refresh'} , document.referrer);
				})
				.catch(utils.errorHandler);
			} else {
				// Refresh the target so the HUD buttons appear
				parent.postMessage( {action: 'refresh'} , document.referrer);
			}
		},
		tutorial: function() {
			if (dontShowAgain.checked) {
				dontShowWelcomeAgain().then(() => {
					// Open the tutorial in a new window / tab
					window.open(TUTORIAL_URL);
					// Refresh the target so the HUD buttons appear
					parent.postMessage( {action: 'refresh'} , document.referrer);
				})
				.catch(utils.errorHandler);
			} else {
				// Open the tutorial in a new window / tab
				window.open(TUTORIAL_URL);
				// Refresh the target so the HUD buttons appear
				parent.postMessage( {action: 'refresh'} , document.referrer);
			}
		}
	},
	data() {
		return {
			isShowWelcomeScreen: SHOW_WELCOME_SCREEN,
			dontShowAgain: false
		}
	},
	props: []
})

function dontShowWelcomeAgain() {
	// TODO - we can no longer call the API directly from the display frames, but at this point the service worker
	// will not be available.
	// Plan to fix once the startup rework has stabilised
	// return utils.zapApiCall("/hud/action/setOptionShowWelcomeScreen/?Boolean=false");
}

document.addEventListener('DOMContentLoaded', () => {
	let params = new URL(document.location).searchParams;

	frameId = params.get('frameId');
	tabId = params.get('tabId');

	// initialize Vue app
	app = new Vue({
		el: '#app',
		data: {
			isSettingsButtonShown: false
		}
	});

	// if first time starting HUD boot up the service worker
	if (navigator.serviceWorker.controller === null) {
		parent.postMessage( {action: 'expandManagement'} , document.referrer);
		startServiceWorker();
	}
	else {
		// show the settings button
		app.isSettingsButtonShown = true;

		window.addEventListener('message', windowMessageListener)
		window.addEventListener('beforeunload', beforeunloadListener)

		navigator.serviceWorker.addEventListener('message', serviceWorkerMessageListener)

		// send targetload message 
		navigator.serviceWorker.controller.postMessage({action: 'targetload', tabId: tabId, targetUrl: context.url});

		localforage.setItem(IS_SERVICEWORKER_REFRESHED, true);
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
		utils.log(LOG_WARN, 'management.receiveMessage', 'Message without sharedSecret rejected');
		return;
	} else if ("" === ZAP_SHARED_SECRET) {
		// A blank secret is used to indicate that this functionality is turned off
		utils.log(LOG_DEBUG, 'management.receiveMessage', 'Message from target domain ignored as on-domain messaging has been switched off');
	} else if (event.data.sharedSecret === ZAP_SHARED_SECRET) {
		navigator.serviceWorker.controller.postMessage(event.data);
	} else {
		utils.log(LOG_WARN, 'management.receiveMessage', 'Message with incorrect sharedSecret rejected ' + event.data.sharedSecret);
	}
}

function beforeunloadListener() {
	let currentTimeInMs = new Date().getTime();

	navigator.serviceWorker.controller.postMessage({action: 'unload', time: currentTimeInMs})
		.catch(utils.errorHandler)
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
		navigator.serviceWorker.register(utils.getZapFilePath('serviceworker.js'))
			.then(registration => {
				console.log('Service worker registration was successful for the scope: ' + registration.scope);

				// wait until serviceworker is installed and activated
				navigator.serviceWorker.ready
					.then(serviceWorkerRegistration => {
						if (! SHOW_WELCOME_SCREEN ) {
							// refresh the target page
							parent.postMessage( {action: 'refresh'} , document.referrer);
						}
					})
					.catch(utils.errorHandler);
			})
			.catch(utils.errorHandler);
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
		navigator.serviceWorker.controller.postMessage({action:"heartbeat"});
	}, 10000)
}
