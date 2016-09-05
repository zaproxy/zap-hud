var parentUrl = '';
var parentSite = '';

function listener(e) {
	console.log('hubInjectScript received message: ' + e.data + ' origin: ' + e.origin);
	var origin = e.origin /*|| e.originalEvent.origin*/; // For Chrome, the origin property is in the event.originalEvent object.
	if (origin !== parentSite) {
		console.log('zapHudMainDisplay rejecting message origin ' + origin + ' != parentSite ' + parentSite);
  		return;
	}

	var data = JSON.parse(e.data);
	if (data.type == 'site-alerts') {
		siteAlerts(data.data);
	} else if (data.type == 'page-alerts') {
		pageAlerts(data.data);
	} else if (data.type == 'alert') {
		showAlert(data.alertid);

	} else if (data.type == 'attackDialog') {
		showAttackDialog(data.op);

	} else if (data.type == 'scopeDialog') {
		showScopeDialog(data.op);

	} else if (data.type == 'spiderDialog') {
		showSpiderDialog(data.op);

	} else if (data.type == 'ascanDialog') {
		showAscanDialog(data.op);

	} else if (data.type == 'revealDialog') {
		showRevealDialog(data.op);

	} else if (data.type == 'config') {
		aboutDialog();

	} else {
		errorDialog(data);
	}

}

// TODO dont need?
function parseUrlParams (querystring) {
	// Based on http://stackoverflow.com/questions/2090551/parse-query-string-in-javascript
	// remove any preceding url and split
  querystring = querystring.substring(querystring.indexOf('?')+1).split('&');
  var params = {}, pair, d = decodeURIComponent;
  // march and parse
  for (var i = querystring.length - 1; i >= 0; i--) {
    pair = querystring[i].split('=');
    params[d(pair[0])] = d(pair[1]);
  }

  return params;
};

function siteAlerts(level) {
	var zapXmlHttp = new XMLHttpRequest();

	zapXmlHttp.onreadystatechange = function() {
		if (zapXmlHttp.readyState == 4 ) {
		   if (zapXmlHttp.status == 200){
			var alertData = JSON.parse(zapXmlHttp.responseText);
			displayAlerts(level, alertData);
		   } else if(zapXmlHttp.status == 400) {
		      //alert('There was an error 400')
			errorDialog({'code' : zapXmlHttp.status});
		   } else {
		      //alert('something else other than 200 was returned')
			errorDialog({'code' : zapXmlHttp.status});
		   }
		}
	}

	zapXmlHttp.open("GET", "<<ZAP_HUD_API>>JSON/core/view/alerts/?baseurl=" + parentSite + '/', true);
	zapXmlHttp.send();
}

function pageAlerts(level) {
	var zapXmlHttp = new XMLHttpRequest();

	zapXmlHttp.onreadystatechange = function() {
		if (zapXmlHttp.readyState == 4 ) {
		   if (zapXmlHttp.status == 200){
			var alertData = JSON.parse(zapXmlHttp.responseText);
			displayAlerts(level, alertData);
		   } else if(zapXmlHttp.status == 400) {
		      //alert('There was an error 400')
		   } else {
		      //alert('something else other than 200 was returned')
		   }
		}
	}

	zapXmlHttp.open("GET", "<<ZAP_HUD_API>>JSON/core/view/alerts/?baseurl=" + parentUrl, true);
	zapXmlHttp.send();
}

function displayAlerts(level, alertData) {
	// A list of all of the alert names
	var alertList = [];
	// A dictionary of alert names to a list of alerts of that name
	var summaries = {};

	for (var i = 0; i < alertData.alerts.length; i++) { 

		if (level == alertData.alerts[i].risk) { 
			if (alertData.alerts[i].alert in summaries) {
				summaries[alertData.alerts[i].alert].push(alertData.alerts[i]);
			} else {
				// first one
				alertList.push(alertData.alerts[i].alert);
				summaries[alertData.alerts[i].alert] = [ alertData.alerts[i] ];
			}
		}
	}

	var frag = document.createDocumentFragment();
	var div1 = frag.appendChild(document.createElement("div"));
	div1.setAttribute("id", "zapHudAlistList");
	div1.style.cssText = "width: 30%; height: 300px; padding: 0.5em; overflow: scroll;";
	var div2 = div1.appendChild(document.createElement("div"));
	div2.setAttribute("id", "zapHudAlertListDiv");

	for (var key in summaries) {
		// Create the accordion for each type of alert
		var h3a1 = div2.appendChild(document.createElement("h4"));
		h3a1.textContent = key + ' (' + summaries[key].length + ')';
		var diva1 = div2.appendChild(document.createElement("div"));
		var ula1 = diva1.appendChild(document.createElement("ul"));
		for (var i = 0; i < summaries[key].length; i++) { 
			var l1a1 = diva1.appendChild(document.createElement("li"));
			var link1 = l1a1.appendChild(document.createElement('a'));
			link1.title = 'Show alert details ' + summaries[key][i].id;
			link1.text = summaries[key][i].url;
			link1.href = '#';
			link1.onclick = (function(alertId) { 
				return function(){showAlert(alertId)}; 
			})(summaries[key][i].id);
		}
	}

	document.body.appendChild(frag);
	$( "#zapHudAlertListDiv" ).accordion({
		active: false,
		heightStyle: "content",
		collapsible: true,
	});
	$( "#zapHudAlistList" ).dialog({
		title: 'ZAP HUD: ' + level + ' Alerts (' + Object.keys(summaries).length + ')',
		width: 400,
		height: 400,
		position: { my: 'left', at: 'left+150' },
		open: function(event, ui) { $(".ui-dialog-titlebar-close").hide(); },	// Hides close button
		resize: function() {
			$( "#zapHudAlertListDiv" ).accordion( "refresh" );
		}
	});
}

function showAlert(alertid){

	var zapXmlHttp = new XMLHttpRequest();

	zapXmlHttp.onreadystatechange = function() {
		if (zapXmlHttp.readyState == 4 ) {
		   if (zapXmlHttp.status == 200){
			displayAlert(JSON.parse(zapXmlHttp.responseText).alert);
		   } else if(zapXmlHttp.status == 400) {
			errorDialog({'code' : zapXmlHttp.status});
		      //alert('There was an error 400')
		   } else {
		      //alert('something else other than 200 was returned')
			errorDialog({'code' : zapXmlHttp.status});
		   }
		}
	}

	zapXmlHttp.open("GET", "<<ZAP_HUD_API>>JSON/core/view/alert/?id=" + alertid, true);
	zapXmlHttp.send();
}

var alertOffset = 0;

function displayAlert(alert){

	if ($( "#zapHudAlertDiv-" + alert.id ).length) {
		// Its already being shown
		$( "#zapHudAlertDiv-" + alert.id ).dialog("moveToTop");
		return;
	}
	var frag = document.createDocumentFragment();
	var div1 = frag.appendChild(document.createElement("div"));
	div1.setAttribute("id", "zapHudAlertDiv-" + alert.id);
	div1.style.cssText = "width: 300px; height: 400px; padding: 0.5em; overflow: scroll;";
	var div2 = div1.appendChild(document.createElement("div"));
	div2.setAttribute("id", "zapHudAlertListDiv-" + alert.id);

	var el = div2.appendChild(document.createElement("p"));
	var lbl = el.appendChild(document.createElement("label"));
	var compid = "zapHudAlert-" + alert.id + '-alert';
	lbl.setAttribute("for", compid);
	lbl.textContent = 'Alert';
	var inp = el.appendChild(document.createElement("input"));
	inp.setAttribute("id", compid);
	inp.setAttribute("name", compid);
	inp.setAttribute("value", alert.alert);
	inp.setAttribute("type", "text");
	inp.setAttribute("class", "text");
	inp.setAttribute("readonly", true);

	el = div2.appendChild(document.createElement("p"));
	lbl = el.appendChild(document.createElement("label"));
	compid = "zapHudAlert-" + alert.id + '-url';
	lbl.setAttribute("for", compid);
	lbl.textContent = 'URL';

	inp = el.appendChild(document.createElement("input"));
	inp.setAttribute("id", compid);
	inp.setAttribute("name", compid);
	inp.setAttribute("value", alert.url);
	inp.setAttribute("type", "text");
//	inp.setAttribute("class", "text ui-widget-content ui-corner-all");
	inp.setAttribute("class", "text");
	inp.setAttribute("readonly", true);

	// TODO better link!
	var lnk = el.appendChild(document.createElement("a"));
	lnk.setAttribute("id", compid);
	lnk.setAttribute("name", compid);
	lnk.setAttribute("href", alert.url);
	lnk.setAttribute("target", "_top");
	lnk.text = "(open link)";


	el = div2.appendChild(document.createElement("p"));
	lbl = el.appendChild(document.createElement("label"));
	compid = "zapHudAlert-" + alert.id + '-risk';
	lbl.setAttribute("for", compid);
	lbl.textContent = 'Risk';
	inp = el.appendChild(document.createElement("input"));
	inp.setAttribute("id", compid);
	inp.setAttribute("name", compid);
	inp.setAttribute("value", alert.risk);
	inp.setAttribute("type", "text");
	inp.setAttribute("class", "text");
	inp.setAttribute("readonly", true);

	el = div2.appendChild(document.createElement("p"));
	lbl = el.appendChild(document.createElement("label"));
	compid = "zapHudAlert-" + alert.id + '-conf';
	lbl.setAttribute("for", compid);
	lbl.textContent = 'Confidence';
	inp = el.appendChild(document.createElement("input"));
	inp.setAttribute("id", compid);
	inp.setAttribute("name", compid);
	inp.setAttribute("value", alert.confidence);
	inp.setAttribute("type", "text");
	inp.setAttribute("class", "text");
	inp.setAttribute("readonly", true);

	el = div2.appendChild(document.createElement("p"));
	lbl = el.appendChild(document.createElement("label"));
	compid = "zapHudAlert-" + alert.id + '-param';
	lbl.setAttribute("for", compid);
	lbl.textContent = 'Parameter';
	inp = el.appendChild(document.createElement("input"));
	inp.setAttribute("id", compid);
	inp.setAttribute("name", compid);
	inp.setAttribute("value", alert.param);
	inp.setAttribute("type", "text");
	inp.setAttribute("class", "text");
	inp.setAttribute("readonly", true);

	el = div2.appendChild(document.createElement("p"));
	lbl = el.appendChild(document.createElement("label"));
	compid = "zapHudAlert-" + alert.id + '-desc';
	lbl.setAttribute("for", compid);
	lbl.textContent = 'Description';
	inp = el.appendChild(document.createElement("textarea"));
	inp.setAttribute("id", compid);
	inp.setAttribute("name", compid);
	inp.textContent = alert.description;
	inp.setAttribute("rows", "5");
	inp.setAttribute("class", "text");
	inp.setAttribute("readonly", true);

	el = div2.appendChild(document.createElement("p"));
	lbl = el.appendChild(document.createElement("label"));
	compid = "zapHudAlert-" + alert.id + '-other';
	lbl.setAttribute("for", compid);
	lbl.textContent = 'Other Info';
	inp = el.appendChild(document.createElement("textarea"));
	inp.setAttribute("id", compid);
	inp.setAttribute("name", compid);
	inp.textContent = alert.other;
	inp.setAttribute("rows", "5");
	inp.setAttribute("class", "text");
	inp.setAttribute("readonly", true);

	el = div2.appendChild(document.createElement("p"));
	lbl = el.appendChild(document.createElement("label"));
	compid = "zapHudAlert-" + alert.id + '-solution';
	lbl.setAttribute("for", compid);
	lbl.textContent = 'Solution';
	inp = el.appendChild(document.createElement("textarea"));
	inp.setAttribute("id", compid);
	inp.setAttribute("name", compid);
	inp.textContent = alert.solution;
	inp.setAttribute("rows", "5");
	inp.setAttribute("class", "text");
	inp.setAttribute("readonly", true);

	document.body.appendChild(frag);
	$( "#zapHudAlertDiv-" + alert.id ).dialog({
		title: 'ZAP HUD: Alert ' + alert.id,
		width: 400,
		height: 500,
		//modal: true,
		position: { my: 'left top', at: 'left+' + (550 + alertOffset) + ' top+' + (50 + alertOffset)},
		close: function(event, ui) {
			$(this).dialog("close");
			$(this).remove();
		}
	});
	alertOffset += 20;
	if (alertOffset > 200) {
		alertOffset = 0;
	}

}

function showAttackDialog(op){
	var frag = document.createDocumentFragment();
	var div1 = frag.appendChild(document.createElement("div"));
	div1.setAttribute("id", "zapHudAttackDialog");
	div1.setAttribute("title", "Attack Mode");
	p = div1.appendChild(document.createElement("p"));
	document.body.appendChild(frag);

	if (op == 'start') {
		p.appendChild(document.createTextNode("Automatically attack all pages in scope?"));
		$( "#zapHudAttackDialog" ).dialog({
		      resizable: false,
		      height:240,
		      modal: true,
		      buttons: {
			Cancel: function() {
			  $( this ).dialog( "close" );
			},
			"Start attacking": function() {
			  setMode('attack');
			  $( this ).dialog( "close" );
			}
		      },
		      close: function() {
			  $( "#zapHudAttackDialog" ).remove();
			  hideDisplay();
		      }
		    });
	} else {
		p.appendChild(document.createTextNode("Stop automatically attacking all pages in scope?"));
		$( "#zapHudAttackDialog" ).dialog({
		      resizable: false,
		      height:240,
		      modal: true,
		      buttons: {
			Cancel: function() {
			  $( this ).dialog( "close" );
			},
			"Stop attacking": function() {
			  setMode('standard');
			  $( this ).dialog( "close" );
			}
		      },
		      close: function() {
			  $( "#zapHudAttackDialog" ).remove();
			  hideDisplay();
		      }
		    });
	}
}

function setMode(mode) {
	var zapXmlHttp = new XMLHttpRequest();
	zapXmlHttp.open("GET", "<<ZAP_HUD_API>>JSON/core/action/setMode/?mode=" + mode + "&apikey=<<ZAP_HUD_API_KEY>>", true);// TODO
	zapXmlHttp.send();
}

function showScopeDialog(op){
	var frag = document.createDocumentFragment();
	var div1 = frag.appendChild(document.createElement("div"));
	div1.setAttribute("id", "zapHudScopeDialog");
	div1.setAttribute("title", "Scope");
	p = div1.appendChild(document.createElement("p"));

	document.body.appendChild(frag);

	if (op == 'add') {
		p.appendChild(document.createTextNode("Add this site to the scope? This will allow you to spider and scan it."));
		$( "#zapHudScopeDialog" ).dialog({
		      resizable: false,
		      height:240,
		      modal: true,
		      buttons: {
			Cancel: function() {
			  $( this ).dialog( "close" );
			},
			"Add": function() {
			  setScope(true);
			  $( this ).dialog( "close" );
			}
		      },
		      close: function() {
			  $( "#zapHudScopeDialog" ).remove();
			  hideDisplay();
		      }
		    });
	} else {
		p.appendChild(document.createTextNode("Remove this site from the scope? You will no longer be able to spider and scan it."));
		$( "#zapHudScopeDialog" ).dialog({
		      resizable: false,
		      height:240,
		      modal: true,
		      buttons: {
			Cancel: function() {
			  $( this ).dialog( "close" );
			},
			"Remove": function() {
			  setScope(false);
			  $( this ).dialog( "close" );
			},
		      },
		      close: function() {
			  $( "#zapHudScopeDialog" ).remove();
			  hideDisplay();
		      }
		    });
	}
}

function setScope(add) {
	var zapXmlHttp = new XMLHttpRequest();
	if (add) {
		zapXmlHttp.open("GET", "<<ZAP_HUD_API>>JSON/context/action/includeInContext/?contextName=Default%20Context&regex=" + parentSite + "/.*&apikey=<<ZAP_HUD_API_KEY>>", true);
	} else {
		zapXmlHttp.open("GET", "<<ZAP_HUD_API>>JSON/context/action/excludeFromContext/?contextName=Default%20Context&regex=" + parentSite + "/.*&apikey=<<ZAP_HUD_API_KEY>>", true);
	}
	zapXmlHttp.send();
}

function showSpiderDialog(op){
	var frag = document.createDocumentFragment();
	var div1 = frag.appendChild(document.createElement("div"));
	div1.setAttribute("id", "zapHudSpiderDialog");
	div1.setAttribute("title", "Spider Site");
	p = div1.appendChild(document.createElement("p"));

	document.body.appendChild(frag);
	if (op == 'start') {
		p.appendChild(document.createTextNode("Start spidering this site?"));
		$( "#zapHudSpiderDialog" ).dialog({
		      resizable: false,
		      height:240,
		      modal: true,
		      buttons: {
			Cancel: function() {
			  $( this ).dialog( "close" );
			},
			"Start Spider?": function() {
		          startSpider();
			  $( this ).dialog( "close" );
			}
		      },
		      close: function() {
			  $( "#zapHudSpiderDialog" ).remove();
			  hideDisplay();
		      }
		    });
	} else if (op == 'stop') {
		p.appendChild(document.createTextNode("Stop spidering this site? (WARNING - may well lock up ZAP due to a bug!)"));
		$( "#zapHudSpiderDialog" ).dialog({
		      resizable: false,
		      height:240,
		      modal: true,
		      buttons: {
			Cancel: function() {
			  $( this ).dialog( "close" );
			},
			"Stop Spider": function() {
		          stopSpider();
			  $( this ).dialog( "close" );
			}
		      },
		      close: function() {
			  $( "#zapHudSpiderDialog" ).remove();
			  hideDisplay();
		      }
		    });
	} else {
		p.appendChild(document.createTextNode("You can only spider sites that are in scope."));
		$( "#zapHudSpiderDialog" ).dialog({
		      resizable: false,
		      height:240,
		      modal: true,
		      buttons: {
			Close: function() {
			  $( this ).dialog( "close" );
			}
		      },
		      close: function() {
			  $( "#zapHudSpiderDialog" ).remove();
			  hideDisplay();
		      }
		    });
	}
}

function startSpider() {
	var zapXmlHttp = new XMLHttpRequest();
	zapXmlHttp.open("GET", "<<ZAP_HUD_API>>JSON/spider/action/scan/?url=" + parentSite + '/&apikey=<<ZAP_HUD_API_KEY>>', true);
	zapXmlHttp.send();
}

function stopSpider() {
	var zapXmlHttp = new XMLHttpRequest();
	// TODO ideally supply scanId
	zapXmlHttp.open("GET", "<<ZAP_HUD_API>>JSON/spider/action/stop?apikey=<<ZAP_HUD_API_KEY>>", true);
	zapXmlHttp.send();
}

function showRevealDialog(op){
	var frag = document.createDocumentFragment();
	var div1 = frag.appendChild(document.createElement("div"));
	div1.setAttribute("id", "zapHudRevealDialog");
	div1.setAttribute("title", "Reveal Tool");
	p = div1.appendChild(document.createElement("p"));

	document.body.appendChild(frag);
	if (op == 'start') {
		p.appendChild(document.createTextNode("Display hidden fields and enable disabled ones?"));
		$( "#zapHudRevealDialog" ).dialog({
			resizable: false,
			height:240,
			modal: true,
			buttons: {
				Cancel: function() {
					$( this ).dialog( "close" );
				},
				"Display/Enable": function() {
					setReveal(true);
					$( this ).dialog( "close" );
				}
			},
			close: function() {
				$( "#zapHudRevealDialog" ).remove();
				hideDisplay();
			}
		});
	} else {
		p.appendChild(document.createTextNode("Stop displaying hidden fields and re-disable the temporarily enabled fields?"));
		$( "#zapHudRevealDialog" ).dialog({
			resizable: false,
			height:240,
			modal: true,
			buttons: {
				Cancel: function() {
					$( this ).dialog( "close" );
				},
				"Hide/Disable": function() {
					setReveal(false);
					$( this ).dialog( "close" );
				}
			},
			close: function() {
				$( "#zapHudRevealDialog" ).remove();
				hideDisplay();
			}
		});
	}
}

function setReveal(isStart) {
	var zapXmlHttp = new XMLHttpRequest();
	zapXmlHttp.onreadystatechange = function() {
		if (zapXmlHttp.readyState == XMLHttpRequest.DONE) {
			parent.postMessage('refresh', parentUrl);
		}
	}

	zapXmlHttp.open("GET", "<<ZAP_HUD_API>>JSON/reveal/action/setReveal/?reveal=" + isStart + "&apikey=<<ZAP_HUD_API_KEY>>", true);
	zapXmlHttp.send();
}

function showAscanDialog(op){
	var frag = document.createDocumentFragment();
	var div1 = frag.appendChild(document.createElement("div"));
	div1.setAttribute("id", "zapHudAscanDialog");
	div1.setAttribute("title", "Acrive Scan Site");
	p = div1.appendChild(document.createElement("p"));

	document.body.appendChild(frag);
	if (op == 'start') {
		p.appendChild(document.createTextNode("Start active scanning this site?"));
		$( "#zapHudAscanDialog" ).dialog({
		      resizable: false,
		      height:240,
		      modal: true,
		      buttons: {
			Cancel: function() {
			  $( this ).dialog( "close" );
			},
			"Start Scanning?": function() {
		          startAscan();
			  $( this ).dialog( "close" );
			}
		      },
		      close: function() {
			  $( "#zapHudAscanDialog" ).remove();
			  hideDisplay();
		      }
		    });
	} else if (op == 'stop') {
		p.appendChild(document.createTextNode("Stop Active Scanning this site?"));
		$( "#zapHudAscanDialog" ).dialog({
		      resizable: false,
		      height:240,
		      modal: true,
		      buttons: {
			Cancel: function() {
			  $( this ).dialog( "close" );
			},
			"Stop Scanning": function() {
		          stopAscan();
			  $( this ).dialog( "close" );
			}
		      },
		      close: function() {
			  $( "#zapHudAscanDialog" ).remove();
			  hideDisplay();
		      }
		    });
	} else {
		p.appendChild(document.createTextNode("You can only Active Scan sites that are in scope."));
		$( "#zapHudAscanDialog" ).dialog({
		      resizable: false,
		      height:240,
		      modal: true,
		      buttons: {
			Close: function() {
			  $( this ).dialog( "close" );
			}
		      },
		      close: function() {
			  $( "#zapHudAscanDialog" ).remove();
			  hideDisplay();
		      }
		    });
	}
}

function startAscan() {
	var zapXmlHttp = new XMLHttpRequest();
	zapXmlHttp.open("GET", "<<ZAP_HUD_API>>JSON/ascan/action/scan/?url=" + parentSite + '/&apikey=<<ZAP_HUD_API_KEY>>', true);
	zapXmlHttp.send();
}

function stopAscan() {
	var zapXmlHttp = new XMLHttpRequest();
	// TODO actually need scanId?
	zapXmlHttp.open("GET", "<<ZAP_HUD_API>>JSON/ascan/action/stop?apikey=<<ZAP_HUD_API_KEY>>", true);
	zapXmlHttp.send();
}

function aboutDialog() {
	var frag = document.createDocumentFragment();
	var div1 = frag.appendChild(document.createElement("div"));
	div1.setAttribute("id", "zapHudAboutDialog");
	div1.setAttribute("title", "The ZAP HUD");
	var p = div1.appendChild(document.createElement("p"));
	p.appendChild(document.createTextNode('Welcome to the ZAP HUD!'));
	div1.appendChild(document.createElement("p")).appendChild(document.createTextNode('Please let Simon Bennetts know of any feedback you have'));
	document.body.appendChild(frag);
	$( "#zapHudAboutDialog" ).dialog();
}

function errorDialog(data) {
	var frag = document.createDocumentFragment();
	var div1 = frag.appendChild(document.createElement("div"));
	div1.setAttribute("id", "zapHudErrorDialog");
	div1.setAttribute("title", "HUD Error");
	var p = div1.appendChild(document.createElement("p"));
	p.appendChild(document.createTextNode('Details: ' + JSON.stringify(data)));
	document.body.appendChild(frag);
	$( "#zapHudErrorDialog" ).dialog();
}

function hideDisplay() {
	// Remove alert list div (if present)
	//$('#zapHudAlistList').remove();
	// Remove all hud related divs
	$('[id^=zapHud]').remove();
	
	parent.postMessage('zapHudHideMainDisplay', '*');		// TODO specify just domain
}

function receiveMessage(e) {
	// Just send to parent?
	parent.postMessage('zapHudDataX:' + e.data, '*');		// TODO specify just domain

}

document.addEventListener('DOMContentLoaded', function () {
	window.addEventListener("message", listener, false);

	document.getElementById('background-div').style.cssText = "position: absolute; position:fixed; top:0px; left:0px; width:100%; height:100%; background:grey; opacity: 0.5;";
	document.getElementById('background-link').style.cssText = "display:block; position: absolute; position:fixed; top:0px; left:0px; width:100%; height:100%;";
	//document.getElementById('layout').style.cssText = "width: 60%; height: 350px;";

	document.getElementById('background-link').addEventListener('click',  function(e) {hideDisplay();}, false);
	
	// Start worker
	zapHudWorker = new Worker('<<ZAP_HUD_API>>OTHER/hud/other/file/?name=zapHudWorker.js');
	zapHudWorker.onError = function(e) {
		alert('Got error ' + e);
		console.log('Got error ' + e);
	};

	// TODO Need to cope with malicious input!
	parentUrl = document.location.toString().split("url=")[1];
	console.log('hud parent url = ' + parentUrl);
	var parser = document.createElement('a');
	parser.href = parentUrl;
	parentSite = parser.protocol + '//' + parser.host;

	zapHudWorker.postMessage(parentUrl);

	zapHudWorker.addEventListener('message', function(e) {
		//console.log('hudStatus got msg from worker ' + e.data);
		receiveMessage(e);
		// This was just for info...
		//parent.postMessage(e.data, '*');	// TODO specify just domain

		//var zapHudAlerts = JSON.parse(e.data);
		//var itemsFrame=document.getElementById('zapHudStatusDisplayLhs');
		//itemsFrame.contentWindow.postMessage(e.data, '*');	// TODO change to real origin
	}, false);

});

