/*
 * Injection Module
 *
 * Description goes here...
 */

const injection = (function () {
	// Injected strings
	const URL = '<<URL>>';
	const ZAP_HUD_FILES = '<<ZAP_HUD_FILES>>';
	const ZAP_SHARED_SECRET = '<<ZAP_SHARED_SECRET>>';

	const HUD_PREFIX = 'zap-hud-';
	const LEFT_PANEL = HUD_PREFIX + 'left-panel';
	const RIGHT_PANEL = HUD_PREFIX + 'right-panel';
	const BOTTOM_DRAWER = HUD_PREFIX + 'bottom-drawer';
	const MAIN_DISPLAY = HUD_PREFIX + 'main-display';
	const GROWLER_ALERTS = HUD_PREFIX + 'growler-alerts';
	const MANAGEMENT = HUD_PREFIX + 'management';

	let tabId = '';

	/* HELPERS */
	function isFromTrustedOrigin(message) {
		return (
			message.origin === 'https://zap' ||
			message.isTrusted
		);
	}

	function generateTabId() {
		const millis = Date.now();
		const r = Math.floor(Math.random() * 1000);
		const tabId = String(millis) + '-' + r;

		return tabId.substring(6);
	}

	/* TARGET INTERACTIONS */
	// code that will interact with the target domain will go here

	function showPanel(_panel) {
		return 0;
	}

	/* Change width of iframe for expanding buttons */
	function expandPanel(panelOrientation) {
		// Todo: is this too hacky?
		const panel = document.getElementById(HUD_PREFIX + panelOrientation + '-panel');

		panel.style.width = '300px';
	}

	function contractPanel(panelOrientation) {
		const panel = document.getElementById(HUD_PREFIX + panelOrientation + '-panel');

		panel.style.width = '110px';
	}

	/* Dynamically size growler iframes with number of alerts */
	function heightenGrowlerFrame(lines) {
		const panel = document.getElementById(GROWLER_ALERTS);
		const offset = 56 + (30 * lines);

		panel.style.height = (panel.offsetHeight + offset) + 'px';
	}

	function shortenGrowlerFrame(lines) {
		const panel = document.getElementById(GROWLER_ALERTS);
		const offset = 56 + (30 * lines);

		panel.style.height = (panel.offsetHeight - offset) + 'px';
	}

	/* Dynamically size iframes with number of buttons */
	function heighten(panelOrientation) {
		const panel = document.getElementById(HUD_PREFIX + panelOrientation + '-panel');

		panel.style.height = (panel.offsetHeight + 33) + 'px';
	}

	function shorten(panelOrientation) {
		const panel = document.getElementById(HUD_PREFIX + panelOrientation + '-panel');

		panel.style.height = (panel.offsetHeight - 33) + 'px';
	}

	function showHudPanels() {
		document.getElementById(LEFT_PANEL).style.display = '';
		document.getElementById(RIGHT_PANEL).style.display = '';
		const panel = document.getElementById(BOTTOM_DRAWER);
		panel.style.width = '100%';
		panel.style.left = '0px';
		panel.style.right = '';
	}

	function hideHudPanels() {
		document.getElementById(LEFT_PANEL).style.display = 'none';
		document.getElementById(RIGHT_PANEL).style.display = 'none';
		const panel = document.getElementById(BOTTOM_DRAWER);
		panel.style.width = '90px';
		panel.style.left = '';
		panel.style.right = '0px';
	}

	function hideAllDisplayFrames() {
		document.getElementById(LEFT_PANEL).style.display = 'none';
		document.getElementById(RIGHT_PANEL).style.display = 'none';
		document.getElementById(BOTTOM_DRAWER).style.display = 'none';
		document.getElementById(GROWLER_ALERTS).style.display = 'none';
	}

	function showAllDisplayFrames() {
		document.getElementById(LEFT_PANEL).style.display = '';
		document.getElementById(RIGHT_PANEL).style.display = '';
		document.getElementById(BOTTOM_DRAWER).style.display = '';
		document.getElementById(GROWLER_ALERTS).style.display = '';
	}

	function refreshAllFrames() {
		document.getElementById(LEFT_PANEL).src = document.getElementById(LEFT_PANEL).src;
		document.getElementById(RIGHT_PANEL).src = document.getElementById(RIGHT_PANEL).src;
		document.getElementById(MAIN_DISPLAY).src = document.getElementById(MAIN_DISPLAY).src;
		document.getElementById(BOTTOM_DRAWER).src = document.getElementById(BOTTOM_DRAWER).src;
		document.getElementById(GROWLER_ALERTS).src = document.getElementById(GROWLER_ALERTS).src;
		document.getElementById(MANAGEMENT).src = document.getElementById(MANAGEMENT).src;
	}

	function refreshDisplayFrames() {
		document.getElementById(LEFT_PANEL).src = document.getElementById(LEFT_PANEL).src;
		document.getElementById(RIGHT_PANEL).src = document.getElementById(RIGHT_PANEL).src;
		document.getElementById(MAIN_DISPLAY).src = document.getElementById(MAIN_DISPLAY).src;
		document.getElementById(BOTTOM_DRAWER).src = document.getElementById(BOTTOM_DRAWER).src;
		document.getElementById(GROWLER_ALERTS).src = document.getElementById(GROWLER_ALERTS).src;
	}

	function refreshManagementFrame() {
		document.getElementById(MANAGEMENT).src = document.getElementById(MANAGEMENT).src;
	}

	/* Hide or show main iframe for popups and dialogs */
	function showMainDisplay() {
		document.getElementById(MAIN_DISPLAY).style.display = '';
	}

	function hideMainDisplay() {
		document.getElementById(MAIN_DISPLAY).style.display = 'none';
	}

	function showBottomDrawer() {
		document.getElementById(BOTTOM_DRAWER).style.height = '30%';
	}

	function hideBottomDrawer() {
		document.getElementById(BOTTOM_DRAWER).style.height = '50px';
	}

	function expandManagement() {
		document.getElementById(MANAGEMENT).style.width = '100%';
		document.getElementById(MANAGEMENT).style.height = '100%';
	}

	function contractManagement() {
		document.getElementById(MANAGEMENT).style.width = '0px';
		document.getElementById(MANAGEMENT).style.height = '0px';
	}

	// TODO showEnable section - put this code in a separate file and inject ?
	let showEnabled = false;
	let showEnabledCount = 0;
	let showEnableTypeHiddenFields = [];
	let showEnableDisplayNoneFields = [];
	let showEnableDisplayHiddenFields = [];
	let showEnabledDisabled = [];
	let showEnabledReadOnly = [];

	function showEnableOn() {
		const inputs = document.querySelectorAll('input');
		let index;

		for (index = 0; index < inputs.length; ++index) {
			let counted = false;
			if (inputs[index].disabled) {
				inputs[index].disabled = false;
				inputs[index].style.borderColor = 'blue';
				showEnabledDisabled.push(inputs[index]);
				// We don't count disabled fields as they are still visible
			}

			if (inputs[index].readOnly) {
				inputs[index].readOnly = false;
				inputs[index].style.borderColor = 'blue';
				showEnabledReadOnly.push(inputs[index]);
				// We don't count readonly fields as they are still visible
			}

			if (inputs[index].type === 'hidden') {
				inputs[index].type = '';
				inputs[index].style.borderColor = 'purple';
				showEnableTypeHiddenFields.push(inputs[index]);
				showEnabledCount++;
				counted = true;
			}

			if (inputs[index].style.display === 'none') {
				inputs[index].style.display = '';
				inputs[index].style.borderColor = 'purple';
				showEnableDisplayNoneFields.push(inputs[index]);
				if (!counted) {
					showEnabledCount++;
					counted = true;
				}
			}

			if (inputs[index].style.visibility === 'hidden') {
				inputs[index].style.visibility = '';
				inputs[index].style.borderColor = 'purple';
				showEnableTypeHiddenFields.push(inputs[index]);
				if (!counted) {
					// If any checks are added after this will also need to inc counted
					showEnabledCount++;
				}
			}
		}

		showEnabled = true;
	}

	function showEnableOff() {
		let index;
		for (index = 0; index < showEnableTypeHiddenFields.length; ++index) {
			showEnableTypeHiddenFields[index].type = 'hidden';
			showEnableTypeHiddenFields[index].style.borderColor = '';
		}

		for (index = 0; index < showEnableDisplayNoneFields.length; ++index) {
			showEnableDisplayNoneFields[index].style.display = 'none';
			showEnableDisplayNoneFields[index].style.borderColor = '';
		}

		for (index = 0; index < showEnableDisplayHiddenFields.length; ++index) {
			showEnableDisplayHiddenFields[index].style.visibility = 'hidden';
			showEnableDisplayHiddenFields[index].style.borderColor = '';
		}

		for (index = 0; index < showEnabledDisabled.length; ++index) {
			showEnabledDisabled[index].disabled = true;
			showEnabledDisabled[index].style.borderColor = '';
		}

		for (index = 0; index < showEnabledReadOnly.length; ++index) {
			showEnabledReadOnly[index].readOnly = true;
			showEnabledReadOnly[index].style.borderColor = '';
		}

		showEnableTypeHiddenFields = [];
		showEnableDisplayNoneFields = [];
		showEnableDisplayHiddenFields = [];
		showEnabledDisabled = [];
		showEnabledReadOnly = [];
		showEnabled = false;
		showEnabledCount = 0;
	}

	function showEnableCount() {
		let count = 0;
		if (showEnabled) {
			count = showEnabledCount;
		} else {
			// Count the number of hidden fields
			const inputs = document.querySelectorAll('input');
			for (const element of inputs) {
				if (element.type === 'hidden') {
					count++;
				} else if (element.style.display === 'none') {
					count++;
				} else if (element.style.visibility === 'hidden') {
					count++;
				}
			}
		}

		// Send to the management frame with the shared secret
		const iframe = document.getElementById(MANAGEMENT);
		iframe.contentWindow.postMessage({action: 'showEnable.count', tabId, count, sharedSecret: ZAP_SHARED_SECRET}, ZAP_HUD_FILES);
	}

	function highlightAlert(alert) {
		const id = alert.param;
		let element = document.getElementById(id);
		if (!element) {
			const els = document.getElementsByName(id);
			for (const namedElement of els) {
				if (namedElement instanceof HTMLInputElement) {
					element = namedElement;
					break;
				}
			}
		}

		if (element) {
			const colours = {
				Informational: 'blue',
				Low: 'yellow',
				Medium: 'orange',
				High: 'red'
			};
			const colour = colours[alert.risk];
			const alertId = Number.parseInt(alert.id, 10);
			if (alertId >= 0) {
				element.style.borderColor = colour || 'red';
				const img = document.createElement('img');
				img.src = ZAP_HUD_FILES + '/image/flag-' + colour + '.png';
				img.id = 'zapHudAlert-' + alertId;
				img.title = alert.name;
				img.height = 16;
				img.width = 16;
				element.parentNode.insertBefore(img, element.nextSibling);
				img.addEventListener('click', () => {
					injection.showZapAlert(alertId);
				});
			}
		}
	}

	// End of showEnable section

	// TODO showComments section - put this code in a separate file and inject ?
	let commentImages = [];

	function includeComment(commentNode) {
		return commentNode.textContent.trim().length > 0;
	}

	function isSuspiciousComment(commentNode, suspiciousList) {
		const textUc = commentNode.textContent.toUpperCase();
		for (const element of suspiciousList) {
			if (textUc.includes(element)) {
				return true;
			}
		}

		return false;
	}

	function showCommentsOn(suspiciousList) {
		const x = document.evaluate('//comment()', document, null, XPathResult.ANY_TYPE, null);
		let count = 0;
		const comments = [];
		let comment = x.iterateNext();
		// Can't change the DOM while iterating through the results, so put them in a list
		while (comment) {
			if (includeComment(comment)) {
				comments.push(comment);
			}

			comment = x.iterateNext();
		}

		const first = document.body.firstChild;
		comments.forEach(comment => {
			count += 1;
			const img = new Image(16, 16);
			img.src = ZAP_HUD_FILES + '/image/balloon.png';
			img.title = comment.textContent;
			img.id = 'zapHudComment-' + count;
			img.style.zIndex = '1000000';
			img.addEventListener('click', () => {
				navigator.clipboard.writeText(comment.textContent);
			});

			if (isSuspiciousComment(comment, suspiciousList)) {
				img.src = ZAP_HUD_FILES + '/image/balloon-yellow-exclamation.png';
			}

			try {
				if (document.body.contains(comment)) {
					comment.parentNode.insertBefore(img, comment);
				} else if (first) {
					// Keep the same 'first' node to keep the comments in order
					document.body.insertBefore(img, first);
				} else {
					// Nothing in the body, unlikely but possible
					document.body.append(img);
				}

				commentImages.push(img);
			} catch (error) {
				console.log('Failed to add comment icon ' + error.message);
			}
		});
	}

	function showCommentsOff() {
		commentImages.forEach(img => {
			img.remove();
		});
		commentImages = [];
	}

	function showCommentsCount(suspiciousList) {
		const x = document.evaluate('//comment()', document, null, XPathResult.ANY_TYPE, null);
		let count = 0;
		let sus = 0;
		let comment = x.iterateNext();

		while (comment) {
			if (includeComment(comment)) {
				count += 1;
				if (isSuspiciousComment(comment, suspiciousList)) {
					sus += 1;
				}
			}

			comment = x.iterateNext();
		}

		// Send to the management frame with the shared secret
		const iframe = document.getElementById(MANAGEMENT);
		iframe.contentWindow.postMessage({action: 'showComments.count', tabId,
			count, suspicious: sus, sharedSecret: ZAP_SHARED_SECRET}, ZAP_HUD_FILES);
	}

	// End of showComments section

	function showZapAlertInternal(alertId) {
		// Send to the management frame with the shared secret
		const iframe = document.getElementById(MANAGEMENT);
		iframe.contentWindow.postMessage({action: 'commonAlerts.showAlert', alertId, tabId, sharedSecret: ZAP_SHARED_SECRET}, ZAP_HUD_FILES);
	}

	/* COMMUNICATIONS */
	function receiveMessages(event) {
		if (!isFromTrustedOrigin(event)) {
			return;
		}

		const message = event.data;

		switch (message.action) {
			case 'showPanel':
				showPanel(message.orientation);
				break;

			case 'showHudPanels':
				showHudPanels();
				break;

			case 'hideHudPanels':
				hideHudPanels();
				break;

			case 'showMainDisplay':
				showMainDisplay();
				event.ports[0].postMessage({isDisplayShown: 'true'});
				break;

			case 'hideMainDisplay':
				hideMainDisplay();
				break;

			case 'showBottomDrawer':
				showBottomDrawer();
				break;

			case 'hideBottomDrawer':
				hideBottomDrawer();
				break;

			case 'hideAllDisplayFrames':
				hideAllDisplayFrames();
				break;

			case 'showAllDisplayFrames':
				showAllDisplayFrames();
				break;

			case 'expandPanel':
				expandPanel(message.orientation);
				break;

			case 'contractPanel':
				contractPanel(message.orientation);
				break;

			case 'expandManagement':
				expandManagement();
				break;

			case 'contractManagement':
				contractManagement();
				break;

			case 'refresh':
				window.location.reload(false);
				break;

			case 'refreshAllFrames':
				refreshAllFrames();
				break;

			case 'refreshDisplayFrames':
				refreshDisplayFrames();
				break;

			case 'refreshManagementFrame':
				refreshManagementFrame();
				break;

			case 'heighten':
				heighten(message.orientation);
				break;

			case 'shorten':
				shorten(message.orientation);
				break;

			case 'heightenGrowlerFrame':
				heightenGrowlerFrame(message.lines);
				break;

			case 'shortenGrowlerFrame':
				shortenGrowlerFrame(message.lines);
				break;

			case 'showEnable.on':
				showEnableOn();
				break;

			case 'showEnable.off':
				showEnableOff();
				break;

			case 'showEnable.count':
				showEnableCount();
				break;

			case 'showComments.on':
				showCommentsOn(message.suspicious);
				break;

			case 'showComments.off':
				showCommentsOff();
				break;

			case 'showComments.count':
				showCommentsCount(message.suspicious);
				break;

			case 'commonAlerts.alert':
				highlightAlert(message);
				break;

			default:
				break;
		}
	}

	/* Initializes the HUD Frames */
	if (window.top === window.self) {
		tabId = generateTabId();

		window.addEventListener('message', receiveMessages);

		const sandbox = 'allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-forms allow-top-navigation';

		const mframe = document.createElement('iframe');
		mframe.id = MANAGEMENT;
		mframe.src = ZAP_HUD_FILES + '/file/management.html?url=' + URL + '&frameId=management&tabId=' + tabId;
		mframe.scrolling = 'no';
		mframe.style = 'position: fixed; right: 0px; bottom: 50px; width:28px; height:60px; border: medium none; overflow: hidden; z-index: 2147483647;';
		mframe.title = 'Management Area';
		mframe.setAttribute('sandbox', sandbox);

		const lframe = document.createElement('iframe');
		lframe.id = LEFT_PANEL;
		lframe.src = ZAP_HUD_FILES + '/file/panel.html?url=' + URL + '&orientation=left&frameId=leftPanel&tabId=' + tabId;
		lframe.scrolling = 'no';
		lframe.style = 'position: fixed; border: medium none; top: 30%; border: medium none; left: 0px; width: 110px; height: 300px; z-index: 2147483646;';
		lframe.title = 'Left Panel';
		lframe.setAttribute('sandbox', sandbox);

		const rframe = document.createElement('iframe');
		rframe.id = RIGHT_PANEL;
		rframe.src = ZAP_HUD_FILES + '/file/panel.html?url=' + URL + '&orientation=right&frameId=rightPanel&tabId=' + tabId;
		rframe.scrolling = 'no';
		rframe.style = 'position: fixed; border: medium none; top: 30%; overflow: hidden; right: 0px; width: 110px; height: 300px; z-index: 2147483646;';
		rframe.title = 'Right Panel';
		rframe.setAttribute('sandbox', sandbox);

		const bframe = document.createElement('iframe');
		bframe.id = BOTTOM_DRAWER;
		bframe.src = ZAP_HUD_FILES + '/file/drawer.html?url=' + URL + '&frameId=drawer&tabId=' + tabId;
		bframe.scrolling = 'no';
		bframe.style = 'position: fixed; border: medium none; overflow: hidden; left: 0px; bottom: 0px; width: 100%; height: 50px; z-index: 2147483646;';
		bframe.title = 'Bottom Drawer';
		bframe.setAttribute('sandbox', sandbox);

		const dframe = document.createElement('iframe');
		dframe.id = MAIN_DISPLAY;
		dframe.src = ZAP_HUD_FILES + '/file/display.html?url=' + URL + '&frameId=display&tabId=' + tabId;
		dframe.style = 'position: fixed; right: 0px; top: 0px; width: 100%; height: 100%; border: 0px none; display: none; z-index: 2147483647;';
		dframe.title = 'Main Display';
		dframe.setAttribute('sandbox', sandbox);

		const gframe = document.createElement('iframe');
		gframe.id = GROWLER_ALERTS;
		gframe.src = ZAP_HUD_FILES + '/file/growlerAlerts.html?url=' + URL + '&frameId=growlerAlerts&tabId=' + tabId;
		gframe.style = 'position: fixed; right: 0px; bottom: 30px; width: 500px; height: 0px;border: 0px none; z-index: 2147483647;';
		gframe.title = 'Growler Alerts';
		gframe.setAttribute('sandbox', sandbox);

		document.body.append(mframe);
		document.body.append(lframe);
		document.body.append(rframe);
		document.body.append(bframe);
		document.body.append(dframe);
		document.body.append(gframe);

		document.body.style.marginBottom = '50px';

		const zapReplaceOffset = window.location.href.indexOf('zapHudReplaceReq=');
		if (zapReplaceOffset > 0) {
			// Hide the zapHudReplaceReq injected when resending a message in the browser
			// But don't loose any fragment
			const fragment = window.location.hash.substr(1);
			let origUrl = window.location.href.substring(0, zapReplaceOffset - 1);
			if (fragment) {
				origUrl += '#' + fragment;
			}

			history.pushState({}, document.title, origUrl);
		}
	}

	return {
		showZapAlert(alertId) {
			showZapAlertInternal(alertId);
		}
	};
})();
