importScripts("<<ZAP_HUD_API>>OTHER/hud/other/file/?name=libraries/localforage.min.js");
importScripts("<<ZAP_HUD_API>>OTHER/hud/other/file/?name=utils.js");
 
var CACHE_NAME = "hud-cache-1.0";
var BUTTON_HTML = '<div class="button" id="BUTTON_NAME-button">\n<div class="button-icon" id="BUTTON_NAME-button-icon"><img src="<<ZAP_HUD_API>>OTHER/hud/other/image/?name=IMAGE_NAME" alt="IMAGE_NAME" height="16" width="16"></div>\n<div class="button-data" id="BUTTON_NAME-button-data">BUTTON_DATA</div>\n<div class="button-label" id="BUTTON_NAME-button-label">BUTTON_LABEL</div>\n</div>\n';
var BUTTON_LIST_HTML = '<div class="buttons-list">';
var PARAM_ORIENATATION = "orientation=";
var BUTTON_NAME = /BUTTON_NAME/g;
var BUTTON_DATA = /BUTTON_DATA/g;
var BUTTON_LABEL = /BUTTON_LABEL/g;
var ORIENTATION = /ORIENTATION/g;
var IMAGE_NAME = /IMAGE_NAME/g;
 
var urlsToCache = [
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=libraries/jquery-1.12.0.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=libraries/jquery-ui.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=libraries/jquery-ui.css",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=libraries/jquery-ui.theme.css",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=panel.html",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=panel.css",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=panel.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=main.html",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=main.js",
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=inject.js"
];

//todo: replace with config file
var toolScripts = [
	"<<ZAP_HUD_API>>OTHER/hud/other/file/?name=tools/scope.js"
];

// Load Tool Scripts
//todo: read in config file (json/xml)
toolScripts.forEach(function(script) {
	importScripts(script); 
});
 

/* Listeners */  
self.addEventListener("install", function(event) {
	console.log("installing...");

	// Cache Files
	event.waitUntil(
		caches.open(CACHE_NAME).then(function(cache) {
			console.log("caching urls...");
			return cache.addAll(urlsToCache);
		})
	);
});
 
self.addEventListener("activate", function(event) {
	console.log("activating...");

	// Check Storage & Initiate
	event.waitUntil(		
		isStorageConfigured().then(function(isConfigured) {

			if (!isConfigured) {
				console.log("initializing indexdb...");
				configureStorage();
			}
		}).catch(function(err) {
			console.log(Error(err));
		})
	); 
});

self.addEventListener("fetch", function(event) {
	// Check Cache
	event.respondWith(
		caches.match(event.request).then(function(response) {  
			var reqUrl = event.request.url;

			if (reqUrl.startsWith("<<ZAP_HUD_API>>OTHER/hud/other/file/?name=panel.html")) {
				// Modify Panel HTML
				return handlePanelHtmlFetch(reqUrl);
			}
			else if (reqUrl.startsWith("<<ZAP_HUD_API>>OTHER/hud/other/file/?name=panel.css")) {
				// Modify Panel CSS
				return handlePanelCssFetch(reqUrl);
			}
			else if (response) {
				// Record Client ID
				if (reqUrl.endsWith(".js")) {
					saveFrameId(event);
				}

				// Cache Hit
				return response;
			}
			else {
				return fetch(event.request);
			}
		}).catch(function() {
			console.log(Error("Could not handle response from: " + event.request.url));
			return caches.match("<<ZAP_HUD_API>>OTHER/hud/other/file/?name=panel.html");
		})
	);
});

self.addEventListener("message", function(event) {
	if (!isFromTrustedOrigin(event)) {
		return;
	}

	var message = event.data;
 
	switch(message.action) {
		case "":
			break;

		default:
			break;
	}
});


/* Helper Methods */
function handlePanelHtmlFetch(reqUrl) {
	return caches.match("<<ZAP_HUD_API>>OTHER/hud/other/file/?name=panel.html").then(function(resp) {
		var orientation = reqUrl.substring(reqUrl.indexOf(PARAM_ORIENATATION) + PARAM_ORIENATATION.length);
		return buildPanelHtml(resp, orientation);
	});
}

function handlePanelCssFetch(reqUrl) {
	return caches.match("<<ZAP_HUD_API>>OTHER/hud/other/file/?name=panel.css").then(function(resp) {
		var orientation = reqUrl.substring(reqUrl.indexOf(PARAM_ORIENATATION) + PARAM_ORIENATATION.length);
		return buildPanelCss(resp, orientation);
	});
}

function saveFrameId(event) {
	clients.matchAll().then(function(clients) {
		clients.forEach(function(item) {
			var client = item;

			if (client.id === event.clientId) {
				if (client.url.endsWith("left")) {
					loadFrame("leftPanel").then(function(panel) {
						panel.clientId = client.id;
					
						saveFrame(panel);
					});
				}
				else if (client.url.endsWith("right")) {
					loadFrame("rightPanel").then(function(panel) {
						panel.clientId = client.id;
					
						saveFrame(panel);
					});
				}
				else if (client.url.endsWith("main.html")) {
					loadFrame("mainDisplay").then(function(panel) {
						panel.clientId = client.id;
					
						saveFrame(panel);
					});
				}
			}
		});
    });
}

function buildPanelHtml(response, orientation) {

	var key = orientation + "Panel";
	return loadPanelTools(key).then(function(tools) {

		return response.text().then(function(text) {
			var init = buildInit(response);
			var body = text.replace(ORIENTATION, orientation);

			tools.forEach(function(tool) {
				body = addButtonToBody(body, tool);
			});

			return new Response(body, init);
		}).catch(function(error) {
			console.log(Error("Could not get text for response. " + error));
		});
	});
}

function buildPanelCss(response, orientation) {

	return response.text().then(function(text) {
		var init = buildInit(response);
		var body = text.replace(ORIENTATION, orientation);

		return new Response(body, init);
	}).catch(function(error) {
		console.log(Error("Could not get text for response. " + error));
	});
}

function buildInit(response) {
	var init = {
		status: response.status,
		statusText: response.statusText,
		headers: {}
	};

	response.headers.forEach(function(v,k) {
		init.headers[k] = v;
	});

	return init;
}

//todo: home made parsing for now
function addButtonToBody(body, tool) {
	var insertAt = body.indexOf(BUTTON_LIST_HTML) + BUTTON_LIST_HTML.length;

	var newBody = body.substring(0, insertAt) + configureButtonHtml(tool) + body.substring(insertAt, body.length);

	return newBody;
}

function configureButtonHtml(tool) {
	var html = BUTTON_HTML;

	html = html.
		replace(BUTTON_NAME, tool.name).
		replace(BUTTON_LABEL, tool.label).
		replace(BUTTON_DATA, tool.data).
		replace(IMAGE_NAME, tool.icon);

	return html;
}