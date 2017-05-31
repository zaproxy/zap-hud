/*
 * Utility Functions
 *
 * Description goes here...
 */

var CLIENT_LEFT = "left";
var CLIENT_RIGHT = "right";
var CLIENT_MAIN = "main.html";

var BUTTON_HTML = '<div class="button" id="BUTTON_NAME-button">\n<div class="button-icon" id="BUTTON_NAME-button-icon"><img src="<<ZAP_HUD_API>>OTHER/hud/other/image/?name=IMAGE_NAME" alt="IMAGE_NAME" height="16" width="16"></div>\n<div class="button-data" id="BUTTON_NAME-button-data">BUTTON_DATA</div>\n<div class="button-label" id="BUTTON_NAME-button-label">BUTTON_LABEL</div>\n</div>\n';
var BUTTON_NAME = /BUTTON_NAME/g;
var BUTTON_DATA_DIV  = /<div class="button-data" id="BUTTON_NAME-button-data">BUTTON_DATA<\/div>/g;
var BUTTON_DATA = /BUTTON_DATA/g;
var BUTTON_LABEL = /BUTTON_LABEL/g;
var IMAGE_NAME = /IMAGE_NAME/g;


/* given the text from an HTTP request header, returns a parsed object */
function parseRequestHeader(headerText) {
	var header = {};

	header.method = headerText.substring(0, headerText.indexOf(" "));
	headerText = headerText.substring(headerText.indexOf(" ") + 1);

	header.uri = headerText.substring(0, headerText.indexOf(" "));
	headerText = headerText.substring(headerText.indexOf(" ") + 1);

	header.version = headerText.substring(0, headerText.indexOf("\r"));
	headerText = headerText.substring(headerText.indexOf("\n") + 1);

	header.fields = {};
	while (headerText !== "") {
		var field = headerText.substring(0, headerText.indexOf(":"));
		headerText = headerText.substring(headerText.indexOf(":") + 2);

		var value = headerText.substring(0, headerText.indexOf("\n"));
		headerText = headerText.substring(headerText.indexOf("\n") + 1);

		header.fields[field] = value;
	}

	return header;
}

/* given the text from an HTTP response header, returns a parsed object */
// todo: write this function
function parseResponseHeader(headerText) {
	var header = {};

	header.version = headerText.substring(0, headerText.indexOf(" "));
	headerText = headerText.substring(headerText.indexOf(" ") + 1);

	header.status = headerText.substring(0, headerText.indexOf(" "));
	headerText = headerText.substring(headerText.indexOf(" ") + 1);

	header.reason = headerText.substring(0, headerText.indexOf(" "));
	headerText = headerText.substring(headerText.indexOf(" ") + 1);

	header.fields = {};
	while (headerText !== "") {
		var field = headerText.substring(0, headerText.indexOf(":"));
		headerText = headerText.substring(headerText.indexOf(":") + 2);

		var value = headerText.substring(0, headerText.indexOf("\n"));
		headerText = headerText.substring(headerText.indexOf("\n") + 1);

		header.fields[field] = value;
	}

	return header;
}

/* returns the send() function on xmlRequest object initialized to the given 
   restString and can handle return data with the callback function*/
//todo: using fetch from SW instead
function buildApiCall(restString, callback) {
	var xmlRequest = new XMLHttpRequest();

	if (callback) {
		xmlRequest.onreadystatechange = function() {
			if (xmlRequest.readyState === XMLHttpRequest.DONE && xmlRequest.status === 200) {
				callback(xmlRequest.responseText);
			}
			else {
				// error handling
			}
		};
	}

	xmlRequest.open("GET", "<<ZAP_HUD_API>>JSON/"+restString, true);
	
	return xmlRequest.send();
}

/* checks whether a message is from the ZAP domain or is a worker */
function isFromTrustedOrigin (message) {

	if (message.origin === "https://zap" || message.isTrusted) {
		return true;
	}

	return false;
}

// These functions don't work in SW - no document
/* parses the domain from a uri string */
function parseDomainFromUrl(url) {
	var parser = document.createElement("a");
	parser.href = url;

	return parser.protocol + "//" + parser.host;
}

/* parses the path from a uri string */
function parsePathFromUrl(url) {
	var parser = document.createElement("a");

	parser.href = url;
	// todo: correct
	return parser.pathname;
}

/* loads and returns HTML template, if templateLocation is included it will
   look in a location other than document (i.e. nested templates) */
function loadTemplate(templateId, templateLocation) {
	var template;

	if (templateLocation) {
		template = templateLocation.getElementById(templateId);
	}
	else {
		template = document.getElementById(templateId);
	}
	
	return document.importNode(template.content, true);
}

/* checks wheher a frame on a sitecan be accessed */
function checkFrame(frame, name) {
	try {
		return frame.name === name;
	}
	catch( e ) {
		return false;
	}
}

/* */
function updateProgress(toolName, progress) {
	if (progress !== "100") {
		updateToolData(toolName, progress);
	}
	else if (progress === "100") {
		updateToolData(toolName, "Start");
		utils.setToolField(toolName, "isRunning", false);
	}
}


/* STORAGE */
var KEY_IS_CONFIG = "isHudConfigured";

function isStorageConfigured() {
	return localforage.getItem(KEY_IS_CONFIG);
}

//todo: could just be named "conigureFrames" 
function configureStorage() {
	return new Promise(function(resolve) {
		localforage.setItem(KEY_IS_CONFIG, true).catch(function(err) {
			console.log(Error(err));
		});

		// Configure Panels
		loadFrame("leftPanel").then(function(oldPanel) {
			var panel = {};

			panel.key = "leftPanel";
			panel.orientation = "left";
			panel.tools = [];
			if (oldPanel) {
				panel.clientId = oldPanel.clientId;
			}

			saveFrame(panel);
		});
		
		loadFrame("rightPanel").then(function(oldPanel) {
			var panel = {};

			panel.key = "rightPanel";
			panel.orientation = "right";
			panel.tools = [];
			if (oldPanel) {
				panel.clientId = oldPanel.clientId;
			}

			saveFrame(panel);
		});
		
		//todo; hacky
		loadFrame("mainDisplay").then(function(oldFrame) {
			var frame = {};

			frame.key = "mainDisplay";
			if (oldFrame) {
				frame.clientId = oldFrame.clientId;
			}

			saveFrame(frame);
		});

		resolve();
	});
}

/* loads and saves the "frame" object from local storage */
function loadFrame(key) {
	return new Promise(function(resolve, reject) {
		localforage.getItem(key).then(function(frame) {
			resolve(frame);
		}).catch(function(err) {
			console.log(Error(err).stack);
		});
	});
}

function saveFrame(frame) {
	localforage.setItem(frame.key, frame).catch(function(err) {
		console.log(Error(err).stack);
	});
}

function registerTool(toolname) {
	localforage.getItem("tools").then(function(tools) {
		tools.push(toolname);

		localforage.setItem("tools", tools);
	});
}

/* loads and saves the "tool" object from local storage */
function loadTool(key) {
	return new Promise(function(resolve) {
		localforage.getItem(key).then(function(value) {
			resolve(value);
		}).catch(function(err) {
			console.log(Error(err).stack);
		});
	});
}

function saveTool(tool) {

	localforage.setItem(tool.name, tool).then(function(tool) {
		// Notify Panel of Updated Data
		if (tool.isSelected) {
			messageFrame(tool.panel, {action:"updateData", tool:tool});
		}
	}).catch(function(err) {
		console.log(Error(err));
	});
}

function loadPanelTools(panelKey) {
	return new Promise(function(resolve) {
		loadFrame(panelKey).then(function(panel) {
			var toolPromises = [];

			panel.tools.forEach(function(toolKey) {
				
				var p = new Promise(function(resolve) {
					loadTool(toolKey).then(function(tool) {
						resolve(tool);
					});
				});
				toolPromises.push(p);
			});

			Promise.all(toolPromises).then(function(tools) {
				resolve(tools);
			});
		});
	});
}

function loadAllTools() {
	return new Promise(function(resolve) {
		

		localforage.getItem("tools").then(function(toolnames) {
			var toolPromises = [];

			toolnames.forEach(function(toolname) {
				var p = new Promise(function(resolve) {
					loadTool(toolname).then(function(tool) {
 						resolve(tool);
					});
				});
				toolPromises.push(p);
			});

			Promise.all(toolPromises).then(function(tools) {
				resolve(tools);
			});
		});
	});
}


/* adds a tool to specific panel */
function addToolToPanel(frameKey, toolKey) {
	loadTool(toolKey).then(function(tool) {
		tool.isSelected = true;
		tool.panel = orientation;

		saveTool(tool);
	});

	messageFrame(frameKey, {action:"addButton", toolName:toolKey});
}

function messageFrame(key, message) {
	return new Promise(function(resolve, reject) {
		loadFrame(key).then(function(frame) {
			clients.get(frame.clientId).then(function(client) {

				var channel = new MessageChannel();

				channel.port1.onmessage = function(event) {
					if (event.data.error) {
						reject(event.data.error);
					}
					else {
						resolve(event.data);
					}
				};

				client.postMessage(message, [channel.port2]);
			}).catch(function(err) {
				console.log(Error(err));
			});
		});
	});
}

function messageWindow(window, message, origin) {
	return new Promise(function(resolve, reject) {
		var channel = new MessageChannel();

		channel.port1.onmessage = function(event) {
			if (event.data.error) {
				reject(event.data.error);
			}
			else {
				resolve(event.data);
			}
		};

		window.postMessage(message, origin, [channel.port2]);
	});
}

function configureButtonHtml(tool) {
	var html = BUTTON_HTML;

	if (!tool.data) {
		html = html.replace(BUTTON_DATA_DIV, " ");
	}	

	html = html.
		replace(BUTTON_NAME, tool.name).
		replace(BUTTON_LABEL, tool.label).
		replace(BUTTON_DATA, tool.data).
		replace(IMAGE_NAME, tool.icon);	

	return html;
}

function utilCheck() {
	console.log("LOADED FROM UTILS");
}


// todo: maybe needed instead of passing info through postmessage
function getTargetDomain() {

}