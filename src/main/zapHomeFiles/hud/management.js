/*
 * Zed Attack Proxy (ZAP) and its related class files.
 *
 * ZAP is an HTTP/HTTPS proxy for assessing web application security.
 *
 * Copyright $YEAR The ZAP Development Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/*
 * Management Frame
 *
 * Initializes the service worker and forwards messages between the service worker
 * and inject.js.
 */

// temp time test
const startTime = new Date().getTime();

// Injected strings
const SHOW_WELCOME_SCREEN = '<<SHOW_WELCOME_SCREEN>>' === 'true';
const TUTORIAL_URL = '<<TUTORIAL_URL>>';
const ZAP_SHARED_SECRET = '<<ZAP_SHARED_SECRET>>';

let app;
let tabId = '';
let frameId = '';
const urlParameter = utils.getParameter(document.location.href, 'url');
const context = {
	url: urlParameter,
	domain: utils.parseDomainFromUrl(urlParameter)
};

Vue.component('welcome-screen', {
	template: '#welcome-screen-template',
	props: [],
	methods: {
		continueToTutorial() {
			showTutorial();
			this.closeWelcomeScreen();
		},
		closeWelcomeScreen() {
			if (doNotShowAgain.checked) {
				navigator.serviceWorker.controller.postMessage({
					action: 'zapApiCall', component: 'hud', type: 'action',
					name: 'setOptionShowWelcomeScreen',
					params: {Boolean: 'false'}});
			}

			app.showWelcomeScreen = false;
			parent.postMessage({action: 'contractManagement'}, context.url);
		}
	},
	data() {
		return {
			doNotShowAgain: false
		};
	}
});

function showTutorial() {
	window.open(TUTORIAL_URL);
}

document.addEventListener('DOMContentLoaded', () => {
	const parameters = new URL(document.location).searchParams;

	frameId = parameters.get('frameId');
	tabId = parameters.get('tabId');

	app = new Vue({
		el: '#app',
		data: {
			showWelcomeScreen: false
		}
	});

	// If first time starting HUD boot up the service worker
	if (navigator.serviceWorker.controller === null) {
		// Temp time test
		localforage.setItem('starttime', startTime);

		parent.postMessage({action: 'hideAllDisplayFrames'}, context.url);

		localforage.setItem('is_first_load', true);

		startServiceWorker();
	} else {
		parent.postMessage({action: 'showAllDisplayFrames'}, context.url);

		// Temp time test
		localforage.getItem('starttime')
			.then(startT => {
				const currentTime = new Date().getTime();
				const diff = currentTime - Number.parseInt(startT, 10);
				console.log('Time (ms) to load UI: ' + diff);
			});

		localforage.setItem(IS_SERVICEWORKER_REFRESHED, true);
		localforage.getItem('is_first_load')
			.then(isFirstLoad => {
				localforage.setItem('is_first_load', false);

				if (isFirstLoad && SHOW_WELCOME_SCREEN) {
					parent.postMessage({action: 'expandManagement'}, context.url);
					app.showWelcomeScreen = true;
				}
			});

		window.addEventListener('message', windowMessageListener);
		navigator.serviceWorker.addEventListener('message', serviceWorkerMessageListener);
		navigator.serviceWorker.controller.postMessage({action: 'targetload', tabId, targetUrl: context.url});

		startHeartBeat();
	}
});

/*
 * Receive messages from the target domain, which is not trusted.
 * As a result we only accept messages that contain a shared secret generated and injected at runtime.
 * The contents of the messages should still be treated as potentially malicious.
 */
function windowMessageListener(event) {
	const message = event.data;
	if (!Object.prototype.hasOwnProperty.call(message, 'sharedSecret')) {
		utils.log(LOG_WARN, 'management.receiveMessage', 'Message without sharedSecret rejected', message);
	} else if (ZAP_SHARED_SECRET === '') {
		// A blank secret is used to indicate that this functionality is turned off
		utils.log(LOG_DEBUG, 'management.receiveMessage', 'Message from target domain ignored as on-domain messaging has been switched off');
	} else if (message.sharedSecret === ZAP_SHARED_SECRET) {
		// These are the only messages we allow from the target site, validate and filter out just the info we are expecting
		const limitedData = {};
		limitedData.action = message.action;
		limitedData.tabId = message.tabId;
		switch (message.action) {
			case 'showEnable.count':
				if (message.count === Number.parseInt(message.count, 10)) {
					limitedData.count = message.count;
					navigator.serviceWorker.controller.postMessage(limitedData);
					return;
				}

				break;
			case 'commonAlerts.showAlert':
				if (message.alertId === Number.parseInt(message.alertId, 10)) {
					limitedData.alertId = message.alertId;
					navigator.serviceWorker.controller.postMessage(limitedData);
					return;
				}

				break;
			case 'showComments.count':
				if (message.count === Number.parseInt(message.count, 10) &&
						message.suspicious === Number.parseInt(message.suspicious, 10)) {
					limitedData.count = message.count;
					limitedData.suspicious = message.suspicious;
					navigator.serviceWorker.controller.postMessage(limitedData);
					return;
				}

				break;
			default:
				break;
		}

		utils.log(LOG_DEBUG, 'management.receiveMessage', 'Unrecognised message from target domain ignored', message);
	} else {
		utils.log(LOG_WARN, 'management.receiveMessage', 'Message with incorrect sharedSecret rejected', message);
	}
}

function serviceWorkerMessageListener(event) {
	const message = event.data;

	switch (message.action) {
		case 'refreshTarget':
			parent.postMessage({action: 'refresh'}, context.url);
			break;

		case 'showEnable.on':
			parent.postMessage({action: 'showEnable.on'}, context.url);
			break;

		case 'showEnable.off':
			parent.postMessage({action: 'showEnable.off'}, context.url);
			break;

		case 'showEnable.count':
			parent.postMessage({action: 'showEnable.count'}, context.url);
			break;

		case 'showComments.on':
			parent.postMessage({action: 'showComments.on', suspicious: message.suspicious}, context.url);
			break;

		case 'showComments.off':
			parent.postMessage({action: 'showComments.off'}, context.url);
			break;

		case 'showComments.count':
			parent.postMessage({action: 'showComments.count', suspicious: message.suspicious}, context.url);
			break;

		case 'commonAlerts.alert':
			parent.postMessage(message, context.url);
			break;

		case 'showTutorial':
			showTutorial();
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
				utils.log(LOG_INFO, 'Service worker registration was successful for the scope: ' + registration.scope);

				// Wait until serviceworker is installed and activated
				return navigator.serviceWorker.ready;
			})
			.then(() => {
				// Refresh the frames so the service worker can take control
				parent.postMessage({action: 'refreshAllFrames'}, context.url);
			})
			.catch(utils.errorHandler);
	} else {
		console.log('This browser does not support Service Workers. The HUD will not work.');
	}
}

/*
 * Starts sending heart beat messages to the ZAP API every 10 seconds
 */
function startHeartBeat() {
	setInterval(() => {
		navigator.serviceWorker.controller.postMessage({action: 'heartbeat'});
	}, 10000);
}
