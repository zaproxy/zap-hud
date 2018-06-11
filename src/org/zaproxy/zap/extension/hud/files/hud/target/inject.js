/*
 * Injection Module
 *
 * Description goes here...
 */

 var injection  = (function () {
	/* HELPERS */
	function isFromTrustedOrigin (message) {

		if (message.origin === "https://zap" || message.isTrusted) {
			return true;
		}
		return false;
	}

	/* TARGET INTERACTIONS */
	// code that will interact with the target domain will go here


	/* FRAMES */
	// todo: standardize z-indexes. they will need to be really high, see youtube and espn for why
	function removePanel(panel) {
		panel.parentNode.removeChild(panel);
	}

	function createTimeline() {
		var timelineFrame = document.createElement("iframe");

		timelineFrame.id = "timeline";
		timelineFrame.src = "<<ZAP_HUD_FILES>>?name=timelinePane.html&parentUrl=" + document.location.toString();
		timelineFrame.scrolling = "no";
		timelineFrame.style.cssText = "position: fixed; top: 0; right: 0; width: 300px; height: 100%; overflow: hidden; border: none; z-index: 2000;";

		// shift target body
		document.body.style.marginRight = "300px";

		// shift right panel
		var rightPanel = document.getElementById("right-panel");

		if (rightPanel) {
			rightPanel.style.right = "300px";
		}

		document.body.appendChild(timelineFrame);		
	}

	function removeTimeline() {
		var timelineFrame = document.getElementById("timeline");
		timelineFrame.parentNode.removeChild(timelineFrame);

		// shift original page back
		document.body.style.marginRight = "0px";

		// shift right panel back
		var rightPanel = document.getElementById("right-panel");

		if (rightPanel) {
			rightPanel.style.right = "0px";
		}

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

	/* hide or show main iframe for popups and dialogs */
	function showMainDisplay() {
		document.getElementById("main-display").style.display = "";
	}

	function hideMainDisplay() {
		document.getElementById("main-display").style.display = "none";
	}

	function expandManagement() {
		document.getElementById("management").style.width = "100%";
		document.getElementById("management").style.height = "100%";
	}

	function contractManagement() {
		document.getElementById("management").style.width = "50px";
		document.getElementById("management").style.height = "50px";
	}
	
	// TODO put this code in a separate file and inject ?
	var showEnableTypeHiddenFields = [];
	var showEnableDisplayNoneFields = [];
	var showEnableDisplayHiddenFields = [];

	function showEnableOn() {
		var inputs, index;

		inputs = document.getElementsByTagName('input');
		for (index = 0; index < inputs.length; ++index) {
			if (inputs[index].type == "hidden") {
				inputs[index].type = "";
				showEnableTypeHiddenFields.push(inputs[index]);
			}
			if (inputs[index].style.display == "none") {
				inputs[index].style.display = "";
				showEnableDisplayNoneFields.push(inputs[index]);
			}
			if (inputs[index].style.visibility == "hidden") {
				inputs[index].style.visibility = "";
				showEnableTypeHiddenFields.push(inputs[index]);
			}
		}
	}

	function showEnableOff() {
		var index;
		for (index = 0; index < showEnableTypeHiddenFields.length; ++index) {
			showEnableTypeHiddenFields[index].type = 'hidden';
		}
		showEnableTypeHiddenFields = [];
		for (index = 0; index < showEnableDisplayNoneFields.length; ++index) {
			showEnableDisplayNoneFields[index].style.display = 'none';
		}
		showEnableDisplayNoneFields = [];
		for (index = 0; index < showEnableDisplayHiddenFields.length; ++index) {
			showEnableDisplayHiddenFields[index].style.visibility = 'hidden';
		}
		showEnableDisplayHiddenFields = [];
	}

	/* COMMUNICATIONS */
	function receiveMessages (event) {

		if (!isFromTrustedOrigin(event)) {
			return;
		}

		var message = event.data;

		switch(message.action) {
			case "showPanel":
				createPanel(message.orientation);
				break;

			case "showTimeline":
				createTimeline();
				break;

			case "hideTimeline":
				removeTimeline();
				break;

			case "showMainDisplay":
				showMainDisplay();
				event.ports[0].postMessage({isDisplayShown:"true"});
				break;

			case "hideMainDisplay":
				hideMainDisplay();
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

			default:
				break;
		}
	}
	
	/* initializes the HUD Frames */
	if (window.top == window.self) {
		window.addEventListener("message", receiveMessages);
		var template = document.createElement("template");
		template.innerHTML = '<iframe id="management" src="<<ZAP_HUD_FILES>>?name=management.html" scrolling="no" style="position: fixed; left: 0px; top: 0px; width:28px; height:28px; border: medium none; overflow: hidden; z-index: 2147483647"></iframe>\n' +
			'<iframe id="left-panel" src="<<ZAP_HUD_FILES>>?name=panel.html&amp;url=<<URL>>&amp;orientation=left" scrolling="no" style="position: fixed; border: medium none; top: 30%; border: medium none; left: 0px; width: 110px; height: 300px; z-index: 2147483646;"></iframe>\n' +
			'<iframe id="right-panel" src="<<ZAP_HUD_FILES>>?name=panel.html&amp;url=<<URL>>&amp;orientation=right" scrolling="no" style="position: fixed; border: medium none; top: 30%; overflow: hidden; right: 0px; width: 110px; height: 300px; z-index: 2147483646;"></iframe>\n' +
			'<iframe id="main-display" src="<<ZAP_HUD_FILES>>?name=display.html" style="position: fixed; right: 0px; top: 0px; width: 100%; height: 100%; border: 0px none; display: none; z-index: 2147483647;"></iframe>\n' +
			'<iframe id="growler-alerts" src="<<ZAP_HUD_FILES>>?name=growlerAlerts.html" style="position: fixed; right: 0px; bottom: 0px; width: 500px; height: 0px;border: 0px none; z-index: 2147483647;"></iframe>';
		document.body.appendChild(template.content);
	}
})();