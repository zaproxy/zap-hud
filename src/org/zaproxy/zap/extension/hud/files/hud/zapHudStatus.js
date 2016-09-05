var isInScope = false;
var isAttack = false;
var isSpidering = false;
var isAscanning = false;
var hudLhsMin = false;
var hudRhsMin = false;

function showZapLabel(id){
	var el = document.getElementById(id)
	el.style.display = "";
	return false;
}
function hideZapLabel(id){
	var el = document.getElementById(id)
	el.style.display = "none";
	return false;
}
function setHudData(id, data) {
	console.log('setHudData(' + id + ')');
	var el = document.getElementById(id + '-data')
	if (el == undefined ) {
		console.log('Failed to find element with id ' + id);
	} else {
		el.firstChild.data = data;
		if (document.getElementById(id + '-sub')) {
			document.getElementById(id + '-sub').firstChild.data = data;
		}
	}
	return false;
}
function moveLhsFrame() {
	if (hudLhsMin) {
		// Currently minimized, so maximize
		//document.getElementById('hud-minlhs-data').firstChild.data = '<<'
		document.getElementById('hud-minlhs-icon').setAttribute('src', '<<ZAP_HUD_API>>OTHER/hud/other/image/?name=layer-arrow-left.png');
		document.getElementById('hud-minlhs-label').firstChild.data = 'Minimize HUD Frame';
		hudLhsMin = false;
		parent.postMessage('zapHudMaximizeHudLhs', parentUrl);

	} else {
		//document.getElementById('hud-minlhs-data').firstChild.data = '>>';
		document.getElementById('hud-minlhs-icon').setAttribute('src', '<<ZAP_HUD_API>>OTHER/hud/other/image/?name=layer-arrow-right.png');
		document.getElementById('hud-minlhs-label').firstChild.data = 'Maximize HUD Frame';
		hudLhsMin = true;
		parent.postMessage('zapHudMinimizeHudLhs', parentUrl);
	}
	// TODO read from configs
	moveHudElement('hud-scope', 'left')
	moveHudElement('hud-attack', 'left')
	moveHudElement('hud-page-alert-high', 'left')
	moveHudElement('hud-page-alert-medium', 'left')
	moveHudElement('hud-page-alert-low', 'left')
	moveHudElement('hud-page-alert-info', 'left')
}

function moveRhsFrame() {
	if (hudRhsMin) {
		// Currently minimized, so maximize
		document.getElementById('hud-minrhs-icon').setAttribute('src', '<<ZAP_HUD_API>>OTHER/hud/other/image/?name=layer-arrow-right.png');
		document.getElementById('hud-minrhs-label').firstChild.data = 'Minimize HUD Frame';
		hudRhsMin = false;
		parent.postMessage('zapHudMaximizeHudRhs', parentUrl);

	} else {
		document.getElementById('hud-minrhs-icon').setAttribute('src', '<<ZAP_HUD_API>>OTHER/hud/other/image/?name=layer-arrow-left.png');
		document.getElementById('hud-minrhs-label').firstChild.data = 'Maximize HUD Frame';
		hudRhsMin = true;
		parent.postMessage('zapHudMinimizeHudRhs', parentUrl);
	}
	// TODO read from configs
	moveHudElement('hud-spider', 'right')
	moveHudElement('hud-ascan', 'right')
	moveHudElement('hud-reveal', 'right')
	moveHudElement('hud-site-alert-high', 'right')
	moveHudElement('hud-site-alert-medium', 'right')
	moveHudElement('hud-site-alert-low', 'right')
	moveHudElement('hud-site-alert-info', 'right')
}

function moveHudElement(el, posn) {
	if (document.getElementById(el + '-wrapper')) {
		if (posn == 'left') {
			if (hudLhsMin) {
				document.getElementById(el + '-data').style.display = "none";
				var sub = document.getElementById(el + '-icon').appendChild(document.createElement("sub"));
				sub.setAttribute('id', el + '-sub');
				sub.appendChild(document.createTextNode(document.getElementById(el + '-data').firstChild.data));
			} else {
				document.getElementById(el + '-data').style.display = "";
				document.getElementById(el + '-icon').removeChild(document.getElementById(el + '-sub'));
			}
		} else if (posn == 'right') {
			if (hudRhsMin) {
				document.getElementById(el + '-data').style.display = "none";
				var sub = document.getElementById(el).insertBefore(document.createElement("sub"), document.getElementById(el + '-icon'));
				//var sub = document.getElementById(el + '-icon').appendChild(document.createElement("sub"));
				sub.setAttribute('id', el + '-sub');
				sub.appendChild(document.createTextNode(document.getElementById(el + '-data').firstChild.data));
			} else {
				document.getElementById(el + '-data').style.display = "";
				//document.getElementById(el + '-icon').removeChild(document.getElementById(el + '-sub'));
				document.getElementById(el).removeChild(document.getElementById(el + '-sub'));
			}
		}
	}
}

function receiveMessage(e) {
	var origin = e.origin /*|| e.originalEvent.origin*/; // For Chrome, the origin property is in the event.originalEvent object.
	if (origin !== parentSite) {
		console.log('Rejecting data from ' + origin);
  		return;
	}

	var parsedData = JSON.parse(e.data);
	if (parsedData.hasOwnProperty('hudData')) {
		// loop through list, calling relevant methods with data...
		for (var i=0; i < parsedData.hudData.length; i++) {
			if (parsedData.hudData[i].hasOwnProperty('siteSummary')) {
				setSiteCounts(parsedData.hudData[i]);
				checkForNewAlerts(parsedData.hudData[i]);
			} else if (parsedData.hudData[i].hasOwnProperty('pageAlerts')) {
				setPageCounts(parsedData.hudData[i]);
				checkForNewPageAlerts(parsedData.hudData[i]);
			} else if (parsedData.hudData[i].hasOwnProperty('scope')) {
				setScope(parsedData.hudData[i]);
			} else if (parsedData.hudData[i].hasOwnProperty('spider')) {
				setSpider(parsedData.hudData[i]);
			} else if (parsedData.hudData[i].hasOwnProperty('ascan')) {
				setAscan(parsedData.hudData[i]);
			} else {
				console.log(' no good :( ' + JSON.stringify(parsedData.hudData[i] ));
			}
		}
	} else if (parsedData.hasOwnProperty('hudConfig')) {

		if (document.getElementById('hud-minlhs')) {
			if (!parsedData.hudConfig.left.max) {
				moveLhsFrame();
			}
		} else if (document.getElementById('hud-minrhs')) {
			if (!parsedData.hudConfig.right.max) {
				moveRhsFrame();
			}
		} 
	}
}

function setSiteCounts(data) {
	var count = {'Informational' : 0, 'Low' : 0, 'Medium' : 0, 'High' : 0};
	for (var i = 0; i < data.siteSummary.length; i++) { 
    		count[data.siteSummary[i].risk]++;
	}
	// TODO should be able to ref via 'high' etc

	if (document.getElementById('hud-site-alert-high-data')) {
		setHudData('hud-site-alert-high', count['High']);
	}
	if (document.getElementById('hud-site-alert-medium-data')) {
		setHudData('hud-site-alert-medium', count['Medium']);
	}
	if (document.getElementById('hud-site-alert-low-data')) {
		setHudData('hud-site-alert-low', count['Low']);
	}
	if (document.getElementById('hud-site-alert-info-data')) {
		setHudData('hud-site-alert-info', count['Informational']);
	}
}

function setPageCounts(data) {
	var count = {'Informational' : 0, 'Low' : 0, 'Medium' : 0, 'High' : 0};
	// A list of all of the alert names
	var alertList = [];
	for (var i = 0; i < data.pageAlerts.length; i++) { 
		// Just count the number of alert types not alert instances
		if (alertList.indexOf(data.pageAlerts[i].alert) < 0) {
			alertList.push(data.pageAlerts[i].alert);
	    		count[data.pageAlerts[i].risk]++;
		}
	}
	if (document.getElementById('hud-page-alert-high-data')) {
		setHudData('hud-page-alert-high', count['High']);
	}
	if (document.getElementById('hud-page-alert-medium-data')) {
		setHudData('hud-page-alert-medium', count['Medium']);
	}
	if (document.getElementById('hud-page-alert-low-data')) {
		setHudData('hud-page-alert-low', count['Low']);
	}
	if (document.getElementById('hud-page-alert-info-data')) {
		setHudData('hud-page-alert-info', count['Informational']);
	}
}

function checkForNewPageAlerts(data) {
	for (var i = 0; i < data.pageAlerts.length; i++) { 
		if (data.pageAlerts[i].param.length > 0) {
			parent.postMessage('zapHudHighlight:' + JSON.stringify(data.pageAlerts[i]), parentUrl);
		}
//console.log('zapHud-siteAlerts ' + data.pageAlerts[i].risk + ' : ' + count[data.pageAlerts[i].risk]);
	}
}

function checkForNewAlerts(data) {
	var prev = sessionStorage.getItem('zapHud-siteAlerts');
	if (prev) {
		try {
			prevData = JSON.parse(prev);
			for (var i = 0; i < data.siteSummary.length; i++) { 
				var found = 0;
				for (var j = 0; j < prevData.siteSummary.length; j++) { 
						if (JSON.stringify(data.siteSummary[i]) == JSON.stringify(prevData.siteSummary[j])) {
						found = 1;
						break;
					}
				}
				if (! found) {
					parent.postMessage('zapHudAlert:' + JSON.stringify(data.siteSummary[i]), parentUrl);
				}
		//console.log('zapHud-siteAlerts ' + data.siteSummary[i].risk + ' : ' + count[data.siteSummary[i].risk]);
			}
		} catch (e) {
			console.log('Failed to parse: ' + prev);
		}
	}
	sessionStorage.setItem('zapHud-siteAlerts', JSON.stringify(data));
}

function setScope(data) {
	if (!document.getElementById('hud-scope-wrapper')) {
		// These are used by other controls so keep updated even if these controls not in the frame
		if (data.scope[0].inscope == 'true' ) {
			isInScope = true;
		} else if (data.scope[0].inscope == 'false' ) {
			isInScope = false;
		}
		if (data.scope[0].attack == 'true' ) {	
			isAttack = true;
		} else {
			isAttack = false;
		}
		return;
	}
	if (data.scope[0].inscope == 'true' ) {
		isInScope = true;
		//document.getElementById('hud-scope-data').firstChild.data = 'Yes';
		setHudData('hud-scope', 'Yes');
		document.getElementById('hud-scope-label').firstChild.data = 'In Scope';
		document.getElementById('hud-scope-icon').firstChild.setAttribute('src', '<<ZAP_HUD_API>>OTHER/hud/other/image/?name=target.png');
		if (data.scope[0].attack == 'true' ) {
			isAttack = true;
			setHudData('hud-attack', 'On');
			document.getElementById('hud-attack-label').firstChild.data = 'Attacking!';
			document.getElementById('hud-attack-icon').firstChild.setAttribute('src', '<<ZAP_HUD_API>>OTHER/hud/other/image/?name=flame.png');

		} else if (data.scope[0].attack == 'false' ) {
			isAttack = false;
			//document.getElementById('hud-attack-data').firstChild.data = 'Off';
			setHudData('hud-attack', 'Off');
			document.getElementById('hud-attack-label').firstChild.data = 'Not attacking';
			document.getElementById('hud-attack-icon').firstChild.setAttribute('src', '<<ZAP_HUD_API>>OTHER/hud/other/image/?name=flame-grey.png');
		}

	} else if (data.scope[0].inscope == 'false' ) {
		isInScope = false;
		//document.getElementById('hud-scope-data').firstChild.data = 'No';
		setHudData('hud-scope', 'No');
		document.getElementById('hud-scope-label').firstChild.data = 'Out of Scope';
		document.getElementById('hud-scope-icon').firstChild.setAttribute('src', '<<ZAP_HUD_API>>OTHER/hud/other/image/?name=target-grey.png');
		if (data.scope[0].attack == 'true' ) {
			isAttack = true;
			setHudData('hud-attack', 'On');
			document.getElementById('hud-attack-label').firstChild.data = 'Out of scope';
			document.getElementById('hud-attack-icon').firstChild.setAttribute('src', '<<ZAP_HUD_API>>OTHER/hud/other/image/?name=flame-grey.png');

		} else if (data.scope[0].attack == 'false' ) {
			isAttack = false;
			setHudData('hud-attack', 'Off');
			document.getElementById('hud-attack-label').firstChild.data = 'Not attacking';
			document.getElementById('hud-attack-icon').firstChild.setAttribute('src', '<<ZAP_HUD_API>>OTHER/hud/other/image/?name=flame-grey.png');
		}
	}
}

function setSpider(data) {
	if (!document.getElementById('hud-spider-wrapper')) {
		return;
	}
	if (data.spider[0].progress == '-1' ) {
		// No spider scans started
		isSpidering = false;
		setHudData('hud-spider', 'N/A');
		document.getElementById('hud-spider-label').firstChild.data = 'Spider not started';
	} else {
		if (data.spider[0].progress == '100' ) {
			isSpidering = false;
			setHudData('hud-spider', '100');
			document.getElementById('hud-spider-label').firstChild.data = 'Spider completed';
		} else {
			isSpidering = true;
			setHudData('hud-spider', data.spider[0].progress + '%');
			document.getElementById('hud-spider-label').firstChild.data = 'Spider in progress';
		}
	}
}

function setAscan(data) {
	if (!document.getElementById('hud-ascan-wrapper')) {
		return;
	}
	if (data.ascan[0].progress == '-1' ) {
		// No active scans started
		isAscanning = false;
		document.getElementById('hud-ascan-data').firstChild.data = 'N/A';
		document.getElementById('hud-ascan-label').firstChild.data = 'Scanner not started';
		document.getElementById('hud-ascan-icon').firstChild.setAttribute('src', '<<ZAP_HUD_API>>OTHER/hud/other/image/?name=flame-grey.png');
	} else {
		if (data.ascan[0].progress == '100' ) {
			isAscanning = false;
			document.getElementById('hud-ascan-data').firstChild.data = '✓';
			document.getElementById('hud-ascan-label').firstChild.data = 'Scanner completed';
			document.getElementById('hud-ascan-icon').firstChild.setAttribute('src', '<<ZAP_HUD_API>>OTHER/hud/other/image/?name=flame-grey.png');
		} else {
			isAscanning = true;
			document.getElementById('hud-ascan-data').firstChild.data = data.ascan[0].progress + '%';
			document.getElementById('hud-ascan-label').firstChild.data = 'Scanner in progress';
			document.getElementById('hud-ascan-icon').firstChild.setAttribute('src', '<<ZAP_HUD_API>>OTHER/hud/other/image/?name=flame.png');
		}
	}
}

function showData (type, data) {
	parent.postMessage('zapHudData:' + JSON.stringify({'type' : type, 'data' : data}), parentUrl);
}


function switchAttack () {
	var op;
	if (! isAttack) {
		op = 'start';
	} else {
		op = 'stop';
	}
	parent.postMessage('zapHudData:' + JSON.stringify({'type' : 'attackDialog', 'op' : op}), parentUrl);
}

function switchScope () {
	var op;
	if (! isInScope) {
		op = 'add';
	} else {
		op = 'remove';
	}
	parent.postMessage('zapHudData:' + JSON.stringify({'type' : 'scopeDialog', 'op' : op}), parentUrl);
}

function spiderDialog () {
	var op;
	if (! isInScope) {
		op = 'scope';
	} else if (isSpidering) {
		op = 'stop';
	} else {
		op = 'start';
		// Assume they'll start the spider - this will be corrected on the next poll if they dont
		isSpidering = true;
	}
	parent.postMessage('zapHudData:' + JSON.stringify({'type' : 'spiderDialog', 'op' : op}), parentUrl);
}

function revealDialog () {
	var zapXmlHttp = new XMLHttpRequest();
	
	zapXmlHttp.onreadystatechange = function() {
		if (zapXmlHttp.readyState == XMLHttpRequest.DONE) {
			var isRevealed = JSON.parse(zapXmlHttp.responseText).reveal;

			var op;
			if (isRevealed == "true") {
				op = 'stop';
			} else {
				op = 'start';
			}
			parent.postMessage('zapHudData:' + JSON.stringify({'type' : 'revealDialog', 'op' : op}), parentUrl);
		}
	}

	zapXmlHttp.open("GET", "<<ZAP_HUD_API>>JSON/reveal/view/reveal/?zapapiformat=JSON&apikey=<<ZAP_HUD_API_KEY>>");
	zapXmlHttp.send();
}

function ascanDialog () {
	var op;
	if (! isInScope) {
		op = 'scope';
	} else if (isAscanning) {
		op = 'stop';
	} else {
		op = 'start';
		// Assume they'll start the active scanner - this will be corrected on the next poll if they dont
		isAscanning = true;
	}
	parent.postMessage('zapHudData:' + JSON.stringify({'type' : 'ascanDialog', 'op' : op}), parentUrl);
}

function updateRevealData() {
	var zapXmlHttp = new XMLHttpRequest();
	
	zapXmlHttp.onreadystatechange = function() {
		if (zapXmlHttp.readyState == XMLHttpRequest.DONE) {
			var isRevealed = JSON.parse(zapXmlHttp.responseText).reveal;

			if (isRevealed == "true") {
				document.getElementById("hud-reveal-data").innerText = "On";
				document.getElementById('hud-reveal-icon').firstChild.setAttribute('src', '<<ZAP_HUD_API>>OTHER/hud/other/image/?name=light-on.png');
				document.getElementById("hud-reveal-label").innerText = "Hide/Disable";
			} else {
				document.getElementById("hud-reveal-data").innerText = "Off";
				document.getElementById('hud-reveal-icon').firstChild.setAttribute('src', '<<ZAP_HUD_API>>OTHER/hud/other/image/?name=light-off.png');
				document.getElementById("hud-reveal-label").innerText = "Display/Enable";
			}
		}
	}

	zapXmlHttp.open("GET", "<<ZAP_HUD_API>>JSON/reveal/view/reveal/?zapapiformat=JSON&apikey=<<ZAP_HUD_API_KEY>>");
	zapXmlHttp.send();
}

document.addEventListener('DOMContentLoaded', function () {
	parentUrl = document.location.toString().split("url=")[1];

	var parser = document.createElement('a');
	parser.href = parentUrl;
	parentSite = parser.protocol + '//' + parser.host;

	console.log('hudStatus parent url = ' + parentUrl);

	window.addEventListener("message", receiveMessage, false);

	if (document.getElementById('hud-config-wrapper')) {
		document.getElementById('hud-config-wrapper').addEventListener('mouseover', function(e) {showZapLabel('hud-config-label');}, false);
		document.getElementById('hud-config-wrapper').addEventListener('mouseout',  function(e) {hideZapLabel('hud-config-label');}, false);
		document.getElementById('hud-config').addEventListener('click',  function(e) {showData('config');}, false);
		document.getElementById('hud-config-label').style.display = "none";
	}
	if (document.getElementById('hud-page-alert-high-wrapper')) {
		document.getElementById('hud-page-alert-high-wrapper').addEventListener('mouseover', function(e) {showZapLabel('hud-page-alert-high-label');}, false);
		document.getElementById('hud-page-alert-high-wrapper').addEventListener('mouseout',  function(e) {hideZapLabel('hud-page-alert-high-label');}, false);
		document.getElementById('hud-page-alert-high').addEventListener('click',  function(e) {showData('page-alerts', 'High');}, false);
		document.getElementById('hud-page-alert-high-label').style.display = "none";
	}
	if (document.getElementById('hud-page-alert-medium-wrapper')) {
		document.getElementById('hud-page-alert-medium-wrapper').addEventListener('mouseover', function(e) {showZapLabel('hud-page-alert-medium-label');}, false);
		document.getElementById('hud-page-alert-medium-wrapper').addEventListener('mouseout',  function(e) {hideZapLabel('hud-page-alert-medium-label');}, false);
		document.getElementById('hud-page-alert-medium').addEventListener('click',  function(e) {showData('page-alerts', 'Medium');}, false);
		document.getElementById('hud-page-alert-medium-label').style.display = "none";
	}
	if (document.getElementById('hud-page-alert-low-wrapper')) {
		document.getElementById('hud-page-alert-low-wrapper').addEventListener('mouseover', function(e) {showZapLabel('hud-page-alert-low-label');}, false);
		document.getElementById('hud-page-alert-low-wrapper').addEventListener('mouseout',  function(e) {hideZapLabel('hud-page-alert-low-label');}, false);
		document.getElementById('hud-page-alert-low').addEventListener('click',  function(e) {showData('page-alerts', 'Low');}, false);
		document.getElementById('hud-page-alert-low-label').style.display = "none";
	}
	if (document.getElementById('hud-page-alert-info-wrapper')) {
		document.getElementById('hud-page-alert-info-wrapper').addEventListener('mouseover', function(e) {showZapLabel('hud-page-alert-info-label');}, false);
		document.getElementById('hud-page-alert-info-wrapper').addEventListener('mouseout',  function(e) {hideZapLabel('hud-page-alert-info-label');}, false);
		document.getElementById('hud-page-alert-info').addEventListener('click',  function(e) {showData('page-alerts', 'Informational');}, false);
		document.getElementById('hud-page-alert-info-label').style.display = "none";
	}
	if (document.getElementById('hud-site-alert-high-wrapper')) {
		document.getElementById('hud-site-alert-high-wrapper').addEventListener('mouseover', function(e) {showZapLabel('hud-site-alert-high-label');}, false);
		document.getElementById('hud-site-alert-high-wrapper').addEventListener('mouseout',  function(e) {hideZapLabel('hud-site-alert-high-label');}, false);
		document.getElementById('hud-site-alert-high').addEventListener('click',  function(e) {showData('site-alerts', 'High');}, false);
		document.getElementById('hud-site-alert-high-label').style.display = "none";
	}
	if (document.getElementById('hud-site-alert-medium-wrapper')) {
		document.getElementById('hud-site-alert-medium-wrapper').addEventListener('mouseover', function(e) {showZapLabel('hud-site-alert-medium-label');}, false);
		document.getElementById('hud-site-alert-medium-wrapper').addEventListener('mouseout',  function(e) {hideZapLabel('hud-site-alert-medium-label');}, false);
		document.getElementById('hud-site-alert-medium').addEventListener('click',  function(e) {showData('site-alerts', 'Medium');}, false);
		document.getElementById('hud-site-alert-medium-label').style.display = "none";
	}
	if (document.getElementById('hud-site-alert-low-wrapper')) {
		document.getElementById('hud-site-alert-low-wrapper').addEventListener('mouseover', function(e) {showZapLabel('hud-site-alert-low-label');}, false);
		document.getElementById('hud-site-alert-low-wrapper').addEventListener('mouseout',  function(e) {hideZapLabel('hud-site-alert-low-label');}, false);
		document.getElementById('hud-site-alert-low').addEventListener('click',  function(e) {showData('site-alerts', 'Low');}, false);
		document.getElementById('hud-site-alert-low-label').style.display = "none";
	}
	if (document.getElementById('hud-site-alert-info-wrapper')) {
		document.getElementById('hud-site-alert-info-wrapper').addEventListener('mouseover', function(e) {showZapLabel('hud-site-alert-info-label');}, false);
		document.getElementById('hud-site-alert-info-wrapper').addEventListener('mouseout',  function(e) {hideZapLabel('hud-site-alert-info-label');}, false);
		document.getElementById('hud-site-alert-info').addEventListener('click',  function(e) {showData('site-alerts', 'Informational');}, false);
		document.getElementById('hud-site-alert-info-label').style.display = "none";
	}
	if (document.getElementById('hud-hack-wrapper')) {
	//document.getElementById('hud-hack-wrapper').addEventListener('mouseover', function(e) {showZapLabel('hud-hack-label');}, false);
	//document.getElementById('hud-hack-wrapper').addEventListener('mouseout',  function(e) {hideZapLabel('hud-hack-label');}, false);
	//document.getElementById('hud-hack-label').style.display = "none";
	}

	if (document.getElementById('hud-scope-wrapper')) {
		document.getElementById('hud-scope-wrapper').addEventListener('mouseover', function(e) {showZapLabel('hud-scope-label');}, false);
		document.getElementById('hud-scope-wrapper').addEventListener('mouseout',  function(e) {hideZapLabel('hud-scope-label');}, false);
		document.getElementById('hud-scope').addEventListener('click',  function(e) {switchScope();}, false);
		document.getElementById('hud-scope-label').style.display = "none";
	}
	if (document.getElementById('hud-attack-wrapper')) {
		document.getElementById('hud-attack-wrapper').addEventListener('mouseover', function(e) {showZapLabel('hud-attack-label');}, false);
		document.getElementById('hud-attack-wrapper').addEventListener('mouseout',  function(e) {hideZapLabel('hud-attack-label');}, false);
		document.getElementById('hud-attack').addEventListener('click',  function(e) {switchAttack();}, false);
		document.getElementById('hud-attack-label').style.display = "none";
	}
	if (document.getElementById('hud-spider-wrapper')) {
		document.getElementById('hud-spider-wrapper').addEventListener('mouseover', function(e) {showZapLabel('hud-spider-label');}, false);
		document.getElementById('hud-spider-wrapper').addEventListener('mouseout',  function(e) {hideZapLabel('hud-spider-label');}, false);
		document.getElementById('hud-spider').addEventListener('click',  function(e) {spiderDialog();}, false);
		document.getElementById('hud-spider-label').style.display = "none";
	}
	if (document.getElementById('hud-reveal-wrapper')) {
		document.getElementById('hud-reveal-wrapper').addEventListener('mouseover', function(e) {showZapLabel('hud-reveal-label');}, false);
		document.getElementById('hud-reveal-wrapper').addEventListener('mouseout',  function(e) {hideZapLabel('hud-reveal-label');}, false);
		document.getElementById('hud-reveal').addEventListener('click',  function(e) {revealDialog();}, false);
		document.getElementById('hud-reveal-label').style.display = "none";
		updateRevealData();
	}
	if (document.getElementById('hud-ascan-wrapper')) {
		document.getElementById('hud-ascan-wrapper').addEventListener('mouseover', function(e) {showZapLabel('hud-ascan-label');}, false);
		document.getElementById('hud-ascan-wrapper').addEventListener('mouseout',  function(e) {hideZapLabel('hud-ascan-label');}, false);
		document.getElementById('hud-ascan').addEventListener('click',  function(e) {ascanDialog();}, false);
		document.getElementById('hud-ascan-label').style.display = "none";
	}
	if (document.getElementById('hud-minlhs-wrapper')) {
		document.getElementById('hud-minlhs-wrapper').addEventListener('mouseover', function(e) {showZapLabel('hud-minlhs-label');}, false);
		document.getElementById('hud-minlhs-wrapper').addEventListener('mouseout',  function(e) {hideZapLabel('hud-minlhs-label');}, false);
		document.getElementById('hud-minlhs').addEventListener('click',  function(e) {moveLhsFrame();}, false);
		document.getElementById('hud-minlhs-label').style.display = "none";
	}
	if (document.getElementById('hud-minrhs-wrapper')) {
		document.getElementById('hud-minrhs-wrapper').addEventListener('mouseover', function(e) {showZapLabel('hud-minrhs-label');}, false);
		document.getElementById('hud-minrhs-wrapper').addEventListener('mouseout',  function(e) {hideZapLabel('hud-minrhs-label');}, false);
		document.getElementById('hud-minrhs').addEventListener('click',  function(e) {moveRhsFrame();}, false);
		document.getElementById('hud-minrhs-label').style.display = "none";
	}

	// Request configs
	// TODO need to be told which one we are! (or work it out)
	if (document.getElementById('hud-minlhs')) {
		parent.postMessage('zapHudGetConfigLhs', parentUrl);
	} else if (document.getElementById('hud-minrhs')) {
		parent.postMessage('zapHudGetConfigRhs', parentUrl);
	} 

	// Init counts from sessionStorage
	var data = sessionStorage.getItem('zapHud-siteAlerts');
	if (data) {
		try {
			setCounts(JSON.parse(data));
		} catch (e) {
			// Ignore - this will be overwritten next time
		}
	}

}, false);
