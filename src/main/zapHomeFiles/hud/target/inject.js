/*
 * Injection Module
 *
 * Description goes here...
 */

 var injection  = (function () {
	// Injected strings
	var URL = '<<URL>>';
	var ZAP_HUD_FILES = '<<ZAP_HUD_FILES>>';
	var ZAP_SHARED_SECRET = '<<ZAP_SHARED_SECRET>>';

	 let tabId = '';

	/* HELPERS */
	function isFromTrustedOrigin (message) {
		return (
			message.origin === "https://zap"
			|| message.isTrusted
		);
	}

	/* TARGET INTERACTIONS */
	// code that will interact with the target domain will go here


	/* FRAMES */
	// todo: standardize z-indexes. they will need to be really high, see youtube and espn for why
	function removePanel(panel) {
		panel.parentNode.removeChild(panel);
	}

	/* PRESENTATION */
	// todo: implement hide/show panels
	function hidePanel(panel) {
		return 0;
	}

	function showPanel(panel) {
		return 0;
	}

	/* change width of iframe for expanding buttons*/
	function expandPanel(panelOrientation){
		// todo: is this too hacky?
		var panel = document.getElementById(panelOrientation+"-panel");

		panel.style.width = "300px";
	}

	function contractPanel(panelOrientation){
		var panel = document.getElementById(panelOrientation+"-panel");
		
		panel.style.width = "110px";
	}

	/* dynamically size growler iframes with number of alerts */
	function heightenGrowlerFrame(lines) {
		var panel = document.getElementById("growler-alerts");
		var offset = 56 + 30 * lines;

		panel.style.height = (panel.offsetHeight + offset) + "px";
	}

	function shortenGrowlerFrame(lines) {
		var panel = document.getElementById("growler-alerts");
		var offset = 56 + 30 * lines;

		panel.style.height = (panel.offsetHeight - offset) + "px";
	}

	/* dynamically size iframes with number of buttons */
	function heighten(panelOrientation) {
		var panel = document.getElementById(panelOrientation+"-panel");

		panel.style.height = (panel.offsetHeight + 33) + "px";
	}

	function shorten(panelOrientation) {
		var panel = document.getElementById(panelOrientation+"-panel");

		panel.style.height = (panel.offsetHeight - 33) + "px";
	}

	function showSidePanels() {
		document.getElementById("left-panel").style.display = "";
		document.getElementById("right-panel").style.display = "";
	}

	function hideSidePanels() {
		document.getElementById("left-panel").style.display = "none";
		document.getElementById("right-panel").style.display = "none";
	}

	/* hide or show main iframe for popups and dialogs */
	function showMainDisplay() {
		document.getElementById("main-display").style.display = "";
	}

	function hideMainDisplay() {
		document.getElementById("main-display").style.display = "none";
	}
	
	function showBottomDrawer() {
		document.getElementById("bottom-drawer").style.height = "30%";
	}

	function hideBottomDrawer() {
		document.getElementById("bottom-drawer").style.height = "50px";
	}


	function expandManagement() {
		document.getElementById("management").style.width = "100%";
		document.getElementById("management").style.height = "100%";
	}

	function contractManagement() {
		document.getElementById("management").style.width = "0px";
		document.getElementById("management").style.height = "0px";
	}
	
	// TODO put this code in a separate file and inject ?
	var showEnabled = false;
	var showEnabledCount = 0;
	var showEnableTypeHiddenFields = [];
	var showEnableDisplayNoneFields = [];
	var showEnableDisplayHiddenFields = [];
	var showEnabledDisabled = [];
	var showEnabledReadOnly = [];

	function showEnableOn() {
		var inputs, index;

		inputs = document.getElementsByTagName('input');
		for (index = 0; index < inputs.length; ++index) {
			var counted = false;
			if (inputs[index].disabled) {
				inputs[index].disabled = false;
				inputs[index].style.borderColor = 'blue';
				showEnabledDisabled.push(inputs[index]);
				// We dont count disabled fields as they are still visible
			}
			if (inputs[index].readOnly) {
				inputs[index].readOnly = false;
				inputs[index].style.borderColor = 'blue';
				showEnabledReadOnly.push(inputs[index]);
				// We dont count readonly fields as they are still visible
			}
			if (inputs[index].type == "hidden") {
				inputs[index].type = "";
				inputs[index].style.borderColor = 'purple';
				showEnableTypeHiddenFields.push(inputs[index]);
				showEnabledCount++;
				counted = true;
			}
			if (inputs[index].style.display == "none") {
				inputs[index].style.display = "";
				inputs[index].style.borderColor = 'purple';
				showEnableDisplayNoneFields.push(inputs[index]);
				if (! counted) {
					showEnabledCount++;
					counted = true;
				}
			}
			if (inputs[index].style.visibility == "hidden") {
				inputs[index].style.visibility = "";
				inputs[index].style.borderColor = 'purple';
				showEnableTypeHiddenFields.push(inputs[index]);
				if (! counted) {
					showEnabledCount++;
					counted = true;
				}
			}
		}
		showEnabled = true;
	}

	function showEnableOff() {
		var index;
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
		showEnabledCount = 0
	}
	

	function showEnableCount() {
		var count = 0;
		if (showEnabled) {
			count = showEnabledCount;
		} else {
			// Count the number of hidden fields
			var inputs = document.getElementsByTagName('input');
			for (index = 0; index < inputs.length; ++index) {
				if (inputs[index].type == "hidden") {
					count++;
				} else if (inputs[index].style.display == "none") {
					count++;
				} else if (inputs[index].style.visibility == "hidden") {
					count++;
				}
			}
		}
		// Send to the management frame with the shared secret
		var iframe = document.getElementById("management");
		iframe.contentWindow.postMessage({action: 'showEnable.count', tabId: tabId, count: count, sharedSecret: ZAP_SHARED_SECRET}, ZAP_HUD_FILES);
	}
	
	function highlightAlert(alert) {
		var id = alert.param;
		var el = document.getElementById(id);
		if (!el) {
			var els = document.getElementsByName(id);
			for (var i=0; i < els.length; i++) {
				if (els[i] instanceof HTMLInputElement) {
					el = els[i];
					break;
				}
			}
		}
		if (el) {
			const colours = {
				'Informational': 'blue',
				'Low': 'yellow',
				'Medium': 'orange',
				'High': 'red'
			};
			let colour = colours[alert.risk];
			el.style.borderColor = colour || 'red';
			el.insertAdjacentHTML('afterend',
				'<img src="' + ZAP_HUD_FILES + '?image=flag-' + colour + '.png" ' +
				'id="zapHudAlert-' + alert.id + '" ' +
				'title="' + alert.name + '" height="16" width="16" ' +
				'onclick="injection.showZapAlert(' + alert.id + ');" />');
		}
	}


	function showZapAlertInternal (alertId) {
		// Send to the management frame with the shared secret
		var iframe = document.getElementById("management");
		iframe.contentWindow.postMessage({action: 'commonAlerts.showAlert', alertId: alertId, tabId: tabId, sharedSecret: ZAP_SHARED_SECRET}, ZAP_HUD_FILES);
	}


	/* COMMUNICATIONS */
	function receiveMessages (event) {

		if (!isFromTrustedOrigin(event)) {
			return;
		}

		var message = event.data;

		switch(message.action) {
			case "showPanel":
				showPanel(message.orientation);
				break;

			case "showSidePanels":
				showSidePanels();
				break;

			case "hideSidePanels":
				hideSidePanels();
				break;

			case "showMainDisplay":
				showMainDisplay();
				event.ports[0].postMessage({isDisplayShown:"true"});
				break;

			case "hideMainDisplay":
				hideMainDisplay();
				break;
			
			case "showBottomDrawer":
				showBottomDrawer();
				break;

			case "hideBottomDrawer":
				hideBottomDrawer();
				break;

			case "expandPanel":
				expandPanel(message.orientation);
				break;

			case "contractPanel":
				contractPanel(message.orientation);
				break;

			case "expandManagement":
				expandManagement();
				break;

			case "contractManagement":
				contractManagement();
				break;

			case "refresh":
				window.location.reload(false);
				break;

			case "heighten":
				heighten(message.orientation);
				break;

			case "shorten":
				shorten(message.orientation);
				break;

			case "heightenGrowlerFrame":
				heightenGrowlerFrame(message.lines);
				break;

			case "shortenGrowlerFrame":
				shortenGrowlerFrame(message.lines);
				break;

			case "showEnable.on":
				showEnableOn();
				break;

			case "showEnable.off":
				showEnableOff();
				break;

			case "showEnable.count":
				showEnableCount();
				break;
				
			case "commonAlerts.alert":
				highlightAlert(message);
				break;

			default:
				break;
		}
	}

	/* initializes the HUD Frames */
	if (window.top == window.self) {
		tabId = Math.round(Math.random()*5000) //todo: nonsense random number generator;

		window.addEventListener("message", receiveMessages);

		var template = document.createElement("template");
		template.innerHTML = '<iframe id="management" src="' + ZAP_HUD_FILES + '?name=management.html&amp;frameId=management&amp;tabId=' + tabId + '" scrolling="no" style="position: fixed; right: 0px; bottom: 50px; width:28px; height:60px; border: medium none; overflow: hidden; z-index: 2147483647"></iframe>\n' +
			'<iframe id="left-panel" src="' + ZAP_HUD_FILES + '?name=panel.html&amp;url=' + URL + '&amp;orientation=left&amp;frameId=leftPanel&amp;tabId=' + tabId + '" scrolling="no" style="position: fixed; border: medium none; top: 30%; border: medium none; left: 0px; width: 110px; height: 300px; z-index: 2147483646;"></iframe>\n' +
			'<iframe id="right-panel" src="' + ZAP_HUD_FILES + '?name=panel.html&amp;url=' + URL + '&amp;orientation=right&amp;frameId=rightPanel&amp;tabId=' + tabId + '" scrolling="no" style="position: fixed; border: medium none; top: 30%; overflow: hidden; right: 0px; width: 110px; height: 300px; z-index: 2147483646;"></iframe>\n' +
			'<iframe id="bottom-drawer" src="' + ZAP_HUD_FILES + '?name=drawer.html&amp;frameId=drawer&amp;tabId=' + tabId + '" scrolling="no" style="position: fixed; border: medium none; overflow: hidden; left: 0px; bottom: 0px; width: 100%; height: 50px; z-index: 2147483646;"></iframe>\n' +
			'<iframe id="main-display" src="' + ZAP_HUD_FILES + '?name=display.html&amp;frameId=display&amp;tabId=' + tabId + '" style="position: fixed; right: 0px; top: 0px; width: 100%; height: 100%; border: 0px none; display: none; z-index: 2147483647;"></iframe>\n' +
			'<iframe id="growler-alerts" src="' + ZAP_HUD_FILES + '?name=growlerAlerts.html&amp;frameId=growlerAlerts&amp;tabId=' + tabId + '" style="position: fixed; right: 0px; bottom: 0px; width: 500px; height: 0px;border: 0px none; z-index: 2147483647;"></iframe>';
		document.body.appendChild(template.content);
		document.body.style.marginBottom = "50px";
		
		let zapReplaceOffset = window.location.href.indexOf('zapHudReplaceReq=');
		if (zapReplaceOffset > 0) {
			// Hide the zapHudReplaceReq injected when resending a message in the browser
			// But dont loose any fragment
			var fragment = window.location.hash.substr(1);
			var origUrl = window.location.href.substring(0, zapReplaceOffset-1);
			if (fragment) {
				origUrl += "#" + fragment;
			}
			history.pushState({},document.title,origUrl);
		}
	}
	
	return {
		showZapAlert: function(alertId) {
			showZapAlertInternal(alertId);
		}
	};
})();
