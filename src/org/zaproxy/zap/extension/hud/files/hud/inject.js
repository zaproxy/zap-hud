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
		timelineFrame.src = "<<ZAP_HUD_API>>OTHER/hud/other/file/?name=timeline.html&parentUrl=" + document.location.toString();
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

			case "createTimeline":
				createTimeline();
				break;

			case "removeTimeline":
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

			case "refresh":
				window.location.reload();
				break;

			case "heighten":
				heighten(message.orientation);
				break;

			case "shorten":
				shorten(message.orientation);
				break;

			default:
				break;
		}
	}
	
	/* initializes the HUD Frames */
	if (window.top == window.self) {
		window.addEventListener("message", receiveMessages);
	}
})();