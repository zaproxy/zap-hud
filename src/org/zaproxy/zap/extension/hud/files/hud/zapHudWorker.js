var url = null;

function zapRecurse(){

	if (url != null) {
		var zapXmlHttp = new XMLHttpRequest();

		zapXmlHttp.onreadystatechange = function() {
			if (zapXmlHttp.readyState == 4 ) {
			   if(zapXmlHttp.status == 200){
				self.postMessage(zapXmlHttp.responseText);

			   } else if(zapXmlHttp.status == 400) {
			      //alert('There was an error 400')
			   } else {
			      //alert('something else other than 200 was returned')
			   }
			}
		}

		// TODO how to find url??
		zapXmlHttp.open("GET", "<<ZAP_HUD_API>>JSON/hud/view/hudData/?url=" + url, true);
		zapXmlHttp.send();
		setTimeout(function() {
			zapRecurse();
		}, 2000);
	} else {
		console.log('hudWorker url is null');
		setTimeout(function() {
			zapRecurse();
		}, 200);
	}

}

self.addEventListener("message", function(e) {
	// the passed-in data is available via e.data
	url = e.data;
	console.log('hudWorker url set to ' + url);
}, false);

//self.postMessage('Worker started!');
zapRecurse();


