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
	props: []
})

Vue.component('welcome-screen', {
	template: '#welcome-screen-template',
	props: [],
	methods: {
		closeWelcomeScreen: function() {
			if (dontShowAgain.checked) {
				utils.zapApiCall("/hud/action/setOptionShowWelcomeScreen/?Boolean=false");
			}

			app.showWelcomeScreen = false;
			parent.postMessage( {action: 'contractManagement'} , document.referrer);
		},
		continueToTutorial: function() {
			window.open(TUTORIAL_URL);

			this.closeWelcomeScreen();
		}
	},
	data() {
		return {
			dontShowAgain: false
		}
	}
})

document.addEventListener('DOMContentLoaded', () => {
	let params = new URL(document.location).searchParams;

	frameId = params.get('frameId');
	tabId = params.get('tabId');

	// initialize Vue app
	app = new Vue({
		el: '#app',
		data: {
			isSettingsButtonShown: false,
			showLoadingScreen: false,
			showWelcomeScreen: false
		}
	});

	// if first time starting HUD boot up the service worker
	if (navigator.serviceWorker.controller === null) {
		parent.postMessage( {action: 'hideAllDisplayFrames'} , document.referrer);

		localforage.setItem('is_first_load', true)

		startServiceWorker();
	}
	else {
		parent.postMessage( {action: 'showAllDisplayFrames'} , document.referrer);
		parent.postMessage( {action: 'fadeAllDisplayFrames'} , document.referrer);

		localforage.setItem(IS_SERVICEWORKER_REFRESHED, true);
		localforage.getItem('is_first_load')
			.then(isFirstLoad => {
				localforage.setItem('is_first_load', false)

				if (isFirstLoad && SHOW_WELCOME_SCREEN) {
					parent.postMessage( {action: 'expandManagement'} , document.referrer);
					app.showWelcomeScreen = true;
				}
			})

		window.addEventListener('message', windowMessageListener)
		window.addEventListener('beforeunload', beforeunloadListener)

		navigator.serviceWorker.addEventListener('message', serviceWorkerMessageListener)
		navigator.serviceWorker.controller.postMessage({action: 'targetload', tabId: tabId, targetUrl: context.url});

		startHeartBeat();
	}
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
	}
	else if ("" === ZAP_SHARED_SECRET) {
		// A blank secret is used to indicate that this functionality is turned off
		utils.log(LOG_DEBUG, 'management.receiveMessage', 'Message from target domain ignored as on-domain messaging has been switched off');
	}
	else if (event.data.sharedSecret === ZAP_SHARED_SECRET) {
		navigator.serviceWorker.controller.postMessage(event.data);
	}
	else {
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
					.then(() => {
						// refresh the frames so the service worker can take control
						parent.postMessage( {action: 'refreshAllFrames'} , document.referrer);
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
