/* This should be on the same domain as the target page */
var zapHudConfig = {'hudConfig': {'left': {'max':true}, 'right' : {'max':true}}};

function expandZapHudLhs(){
	document.getElementById('zapItemPaneLhs').style.width = "244px";
	document.getElementById('zapHudStatusDisplayLhs').style.width = "240px";
	return false;
}
function contractZapHudLhs(){
	document.getElementById('zapItemPaneLhs').style.width = "104px";
	document.getElementById('zapHudStatusDisplayLhs').style.width = "80px";
	return false;
}
function minimizeZapHudLhs(){
	document.getElementById('zapHudStatusDisplayLhs').style.marginLeft = "-20px";
	//document.getElementById('zapHudStatusDisplayLhs').style.width = "80px";
	zapHudConfig.hudConfig.left.max = false;
	sessionStorage.setItem('zapHud-config', JSON.stringify(zapHudConfig));
}
function maximizeZapHudLhs(){
	document.getElementById('zapHudStatusDisplayLhs').style.marginLeft = "24px";
	//document.getElementById('zapHudStatusDisplayLhs').style.width = "80px";
	// In case the mouse is still in the new frame
	expandZapHudLhs();
	zapHudConfig.hudConfig.left.max = true;
	sessionStorage.setItem('zapHud-config', JSON.stringify(zapHudConfig));
}
function expandZapHudRhs(){
	document.getElementById('zapItemPaneRhs').style.width = "264px";
	document.getElementById('zapHudStatusDisplayRhs').style.width = "240px";
	return false;
}
function contractZapHudRhs(){
	document.getElementById('zapItemPaneRhs').style.width = "104px";
	//document.getElementById('zapHudStatusDisplayRhs').style.width = "80px";
	return false;
}
function minimizeZapHudRhs(){
	document.getElementById('zapHudStatusDisplayRhs').style.marginRight = "-20px";
	//document.getElementById('zapHudStatusDisplayRhs').style.width = "40px";
	zapHudConfig.hudConfig.right.max = false;
	sessionStorage.setItem('zapHud-config', JSON.stringify(zapHudConfig));
}
function maximizeZapHudRhs(){
	document.getElementById('zapHudStatusDisplayRhs').style.marginRight = "24px";
	document.getElementById('zapHudStatusDisplayRhs').style.width = "80px";
	// In case the mouse is still in the new frame
	expandZapHudRhs();
	zapHudConfig.hudConfig.right.max = true;
	sessionStorage.setItem('zapHud-config', JSON.stringify(zapHudConfig));
}
function alertifyLoad() {
	if (typeof alertify != "undefined") {
		alertify.maxLogItems(5);
		alertify.logPosition("bottom right");
		//alertify.log('Good start;)');
	} else {
		console.log('hubInjectScript alertify is null :(');
		// TODO set up an external div?
	}
}

function showZapData(data) {
	console.log('hubInjectScript showZapData ' + data);
	var mainDisplay = document.getElementById('zapHudMainDisplay');
	// TODO test with all main modern browsers
	mainDisplay.style.cssText = 'background-color:#000000; opacity: 1.0; position:fixed; top:0px; left:0px; width:100%; height:00px; color:#FFFFFF; ; z-index: 2000000010;';

	// TODO need to perform validation/encoding on the url
	//var parentUrl = document.location.toString().split("url=");

	var mainDisplayFrame = document.getElementById('zapHudStatusDisplayFrame');
	mainDisplayFrame.contentWindow.postMessage(data, '<<ZAP_HUD_API>>');
	//mainDisplayFrame.zapHudDisplayLoad(data);
	//mainDisplayFrame.setAttribute('onload', 'zapHudDisplayLoad(\'' + data + '\');');
	//mainDisplayFrame.setAttribute('src', '<<ZAP_HUD_API>>OTHER/hud/other/file/?name=zapHudMainDisplay.html&url=' + parentUrl);

}

// TODO dont need anymore?
function zapHudDisplayLoad(data) {
	// Send straight on to the main display
	var mainDisplayFrame = document.getElementById('zapHudStatusDisplayFrame');
	mainDisplayFrame.contentWindow.postMessage(data, '<<ZAP_HUD_API>>');
	//console.log('hubInjectScript sent data?? ' + data);
}

function hideZapData() {
	var mainDisplay = document.getElementById('zapHudMainDisplay');
	mainDisplay.style.display = 'none';
	//var mainDisplayFrame = document.getElementById('zapHudStatusDisplayFrame');
	//mainDisplayFrame.setAttribute('src', '');
}

function zapHudHighlightErrorFields(data) {
console.log('zapHudHighlightErrorFields ' + data);
	var alert = JSON.parse(data);
	var el = document.getElementById(alert.param);
	if (!el) {
		var els = document.getElementsByName(alert.param);
		for (var i=0; i < els.length; i++) {
			if (els[i] instanceof HTMLInputElement) {
				el = els[i];
				break;
			}
		}
	}
	if (el && ! document.getElementById('zapHudAlert-' + alert.id)) {
		var colour = 'red';
		switch (alert.risk) {
		case 'Informational': 
			colour = 'blue';
			break;
		case 'Low': 
			colour = 'yellow';
			break;
		case 'Medium': 
			colour = 'orange';
			break;
		case 'High': 
			colour = 'red';
			break;
		}
		el.insertAdjacentHTML('afterend', 
		'<img src="<<ZAP_HUD_API>>OTHER/hud/other/image/?name=flag-' + colour + '.png" ' +
		'id="zapHudAlert-' + alert.id + '" ' +
		'title="' + alert.alert + '" height="16" width="16" ' +
		'onclick="showZapData(JSON.stringify({\'type\' : \'alert\', \'alertid\' : \'' + alert.id + '\'}));" />');
		el.style.borderColor = colour;
		}
}

window.addEventListener('message', function (e) {
	//console.log('hubInjectScript received message!: ' + e.data);
	if (e.data.startsWith('zapHudAlert:')) {
		if (typeof alertify != "undefined") {
			var data = JSON.parse(e.data.substring(12));
			if (typeof data.alert != "undefined") {
				var msg;
				switch (data.risk) {
				case 'Informational': 
					msg = '<img src="<<ZAP_HUD_API>>OTHER/hud/other/image/?name=flag-blue.png">&nbsp' + data.alert;
					break;
				case 'Low': 
					msg = '<img src="<<ZAP_HUD_API>>OTHER/hud/other/image/?name=flag-yellow.png">&nbsp' + data.alert;
					break;
				case 'Medium': 
					msg = '<img src="<<ZAP_HUD_API>>OTHER/hud/other/image/?name=flag-orange.png">&nbsp' + data.alert;
					break;
				case 'High': 
					msg = '<img src="<<ZAP_HUD_API>>OTHER/hud/other/image/?name=flag-red.png">&nbsp' + data.alert;
					break;
				default:
					msg = data.alert;	// Dont expect this to happen
					break;
				}
				alertify.log(msg, function(ev) {
					// TODO - need at least one id in order to display a specific one
					showZapData(JSON.stringify({'type' : 'site-alerts', 'data' : data.risk}));
					//showZapData(JSON.stringify({'type' : 'alert', 'alertid' : data.alertid}));
				});
			}
		}
	} else if (e.data.startsWith('zapHudDataX:')) {
		// TODO post to all ZAP display frames...
		zapHudShareData(e.data.substring(12))
	} else if (e.data.startsWith('zapHudData:')) {
		showZapData(e.data.substring(11))
	} else if (e.data.startsWith('zapHudHighlight:')) {
		zapHudHighlightErrorFields(e.data.substring(16))
	} else if (e.data == 'zapHudHideMainDisplay') {
		hideZapData();
	} else if (e.data == 'zapHudMinimizeHudLhs') {
		minimizeZapHudLhs();
	} else if (e.data == 'zapHudMaximizeHudLhs') {
		maximizeZapHudLhs();
	} else if (e.data == 'zapHudMinimizeHudRhs') {
		minimizeZapHudRhs();
	} else if (e.data == 'zapHudMaximizeHudRhs') {
		maximizeZapHudRhs();
	} else if (e.data == 'zapHudGetConfigLhs') {
		// TODO how to post back??
		var lhsDisplayFrame = document.getElementById('zapHudStatusDisplayLhs');
		lhsDisplayFrame.contentWindow.postMessage(JSON.stringify(zapHudConfig), '<<ZAP_HUD_API>>');
	} else if (e.data == 'zapHudGetConfigRhs') {
		// TODO how to post back??
		var rhsDisplayFrame = document.getElementById('zapHudStatusDisplayRhs');
		rhsDisplayFrame.contentWindow.postMessage(JSON.stringify(zapHudConfig), '<<ZAP_HUD_API>>');
	}

});

function zapHudShareData(data) {
	// Send straight on to the main display
	var lhsDisplayFrame = document.getElementById('zapHudStatusDisplayLhs');
	lhsDisplayFrame.contentWindow.postMessage(data, '<<ZAP_HUD_API>>');
	//console.log('hubInjectScript sent data to lhs?? ' + data);
	var rhsDisplayFrame = document.getElementById('zapHudStatusDisplayRhs');
	rhsDisplayFrame.contentWindow.postMessage(data, '<<ZAP_HUD_API>>');
}

document.addEventListener('DOMContentLoaded', function () {
	// check if top window, if so inject frames etc...
	if (window.top == window.self) {
		// TODO
		var configStr = sessionStorage.getItem('zapHud-config');
		if (configStr) {
			zapHudConfig = JSON.parse(configStr);
		}

		var frag = document.createDocumentFragment();

		// The MainDisplay is used for the HUD popup tables and forms
		var div1 = frag.appendChild(document.createElement("div"));
		div1.setAttribute("id", "zapHudMainDisplay");
		div1.style.display = "none";

		var ifr1 = div1.appendChild(document.createElement("iframe"));
		ifr1.setAttribute("id", "zapHudStatusDisplayFrame");
		ifr1.style.cssText = "width:100%; height:100%; position:fixed;";
		// TODO need to perform validation/encoding on the url
		ifr1.setAttribute('src', '<<ZAP_HUD_API>>OTHER/hud/other/file/?name=zapHudMainDisplay.html&url=' + document.location.toString());

		var div2 = frag.appendChild(document.createElement("div"));
		div2.setAttribute("id", "zapItemPaneLhs");
		div2.style.cssText = "position: absolute; top:30%; overflow: hidden; left: 0px; border: 0px none; width:104px; height:200px; z-index: 2000000000;";

		// All target frames should be on the ZAP API domain

		// The div and iframe used for the controls on the left hand side
		var ifr2 = div2.appendChild(document.createElement("iframe"));
		ifr2.setAttribute("id", "zapHudStatusDisplayLhs");
		ifr2.setAttribute("scrolling", "no");
		ifr2.setAttribute("onmouseover", "expandZapHudLhs();");
		ifr2.setAttribute("onmouseout", "contractZapHudLhs();");
		//ifr2.setAttribute("src", "<<ZAP_HUD_API>>zap/OTHER/hud/other/file/?name=zapHudStatus.html");
		ifr2.setAttribute("src", "<<ZAP_HUD_API>>OTHER/hud/other/file/?name=zapHudStatus.html&url=" + document.location.toString());
		ifr2.style.cssText = "height: 320px; width: 80px; margin-bottom: 100px; margin-left: 24px; border: 0px none; position:fixed; z-index: 10000;";
		// This one has a border for testing purposes ;)
		//ifr2.style.cssText = "height: 280px; width: 80px; margin-bottom: 100px; margin-left: 24px; position:fixed; z-index: 2000000000;";
/* */
		// The div and iframe used for the controls on the right hand side
		var div3 = frag.appendChild(document.createElement("div"));
		div3.setAttribute("id", "zapItemPaneRhs");
		div3.style.cssText = "position: absolute; top:40%; overflow: hidden; right: 0px; border: 0px none; width:104px; height:200px; z-index: 2000000000;";

		var ifr3 = div3.appendChild(document.createElement("iframe"));
		ifr3.setAttribute("id", "zapHudStatusDisplayRhs");
		ifr3.setAttribute("scrolling", "no");
		ifr3.setAttribute("onmouseover", "expandZapHudRhs();");
		ifr3.setAttribute("onmouseout", "contractZapHudRhs();");
		//ifr2.setAttribute("src", "<<ZAP_HUD_API>>zap/OTHER/hud/other/file/?name=zapHudStatus.html");
		ifr3.setAttribute("src", "<<ZAP_HUD_API>>OTHER/hud/other/file/?name=zapHudStatusRhs.html&url=" + document.location.toString());
		//ifr3.setAttribute("align", "right");
		ifr3.style.cssText = "height: 280px; width: 80px; margin-bottom: 100px; right: 0px; margin-right: 24px; border: 0px none; position:fixed; z-index: 10000;";
		// This one has a border for testing purposes ;)
		//ifr3.style.cssText = "height: 200px; width: 80px; margin-bottom: 100px; margin-right: 24px; position:fixed; z-index: 10000;";
/* */

		// Insert the alertify script...
		var scr = frag.appendChild(document.createElement("script"));
		scr.setAttribute("type", "text/javascript");
		scr.setAttribute("src", "<<FILE_PREFIX>>?zapfile=alertify.js");
		scr.setAttribute("onload", "alertifyLoad();");
	
		document.body.appendChild(frag);
	}
});


