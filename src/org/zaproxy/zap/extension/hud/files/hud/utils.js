/*
 * Utility Functions
 *
 * Description goes here...
 */

var CLIENT_LEFT = "left";
var CLIENT_RIGHT = "right";

var BUTTON_HTML = '<div class="button" id="BUTTON_NAME-button">\n<div class="button-icon" id="BUTTON_NAME-button-icon"><img src="<<ZAP_HUD_FILES>>?image=IMAGE_NAME" alt="IMAGE_NAME" height="16" width="16"></div>\n<div class="button-data" id="BUTTON_NAME-button-data">BUTTON_DATA</div>\n<div class="button-label" id="BUTTON_NAME-button-label">BUTTON_LABEL</div>\n</div>\n';
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

	xmlRequest.open("GET", "<<ZAP_HUD_API>>/"+restString, true);
	
	return xmlRequest.send();
}

/* checks whether a message is from the ZAP domain or is a worker */
function isFromTrustedOrigin (message) {

	if (message.origin === "https://zap" || message.isTrusted) {
		return true;
	}

	return false;
}

/* parses the domain from a uri string */
function parseDomainFromUrl(url) {
	var hostname;
	var protocol;

	var hasProtocol = url.indexOf("://");

	if (hasProtocol > -1) {
		protocol = url.substring(0, hasProtocol + 3);
		hostname = url.split('/')[2];
	}
	else {
		protocol = "http://";
		hostname = url.split('/')[0];
	}

	//find & remove port number
	//hostname = hostname.split(':')[0];
	
	//find & remove "?" & "#"
	hostname = hostname.split('?')[0];
	hostname = hostname.split('#')[0];

	return protocol + hostname;
}

// These functions don't work in SW - no document
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
	var promises = [];


	promises.push(localforage.setItem(KEY_IS_CONFIG, true));
		
	// Configure Panels
	promises.push(loadFrame("rightPanel").then(function(oldPanel) {
		var panel = {};

		panel.key = "rightPanel";
		panel.orientation = "right";
		panel.tools = [];
		if (oldPanel) {
			panel.clientId = oldPanel.clientId;
		}

		return saveFrame(panel);
	}));

	promises.push(loadFrame("leftPanel").then(function(oldPanel) {
		var panel = {};

		panel.key = "leftPanel";
		panel.orientation = "left";
		panel.tools = [];
		if (oldPanel) {
			panel.clientId = oldPanel.clientId;
		}

		saveFrame(panel);
	}));
	
	promises.push(loadFrame("display").then(function(oldFrame) {
		var frame = {};

		frame.key = "display";
		if (oldFrame) {
			frame.clientId = oldFrame.clientId;
		}

		saveFrame(frame);
	}));

	promises.push(loadFrame("management").then(function(oldFrame) {
		var frame = {};

		frame.key = "management";
		if (oldFrame) {
			frame.clientId = oldFrame.clientId;
		}

		saveFrame(frame);
	}));

	promises.push(loadFrame("growlerAlerts").then(function(oldFrame) {
		var frame = {};

		frame.key = "growlerAlerts";
		if (oldFrame) {
			frame.clientId = oldFrame.clientId;
		}

		saveFrame(frame);
	}));

	promises.push(loadFrame("timelinePane").then(function(oldFrame) {
		var frame = {};

		frame.key = "timelinePane";
		if (oldFrame) {
			frame.clientId = oldFrame.clientId;
		}

		saveFrame(frame);
	}));

	return Promise.all(promises)
		.catch(function(err) {
			console.log(Error(err));
		});
}

function setDefaultTools() {
	// default tools
	var leftTools = ["scope", "break", "site-alerts-high", "site-alerts-medium", "site-alerts-low", "site-alerts-informational"];
	var rightTools = ["spider", "active-scan", "page-alerts-high", "page-alerts-medium", "page-alerts-low", "page-alerts-informational"];

	return new Promise(function(resolve) {
		var promises = [];

		leftTools.forEach(function(toolName) {
			promises.push(function() { return addToolToPanel(toolName, "leftPanel");});
		});

		rightTools.forEach(function(toolName) {
			promises.push(function() { return addToolToPanel(toolName, "rightPanel");});
		});

		return promises.reduce(function(pacc, fn) {
			return pacc.then(fn);
		}, Promise.resolve());
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
	return localforage.setItem(frame.key, frame)
		.catch(function(err) {
			console.log(Error(err).stack);
		});
}

function registerTool(toolname) {
	localforage.getItem("tools").then(function(tools) {
		tools.push(toolname);

		localforage.setItem("tools", tools);
	});
}

function registerTools(toolnames) {
	localforage.getItem("tools").then(function(tools) {
		tools = tools.concat(toolnames);

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
	return localforage.setItem(tool.name, tool).then(function(tool) {
		// Notify Panel of Updated Data
		if (tool.isSelected) {
			messageFrame(tool.panel, {action:"updateData", tool:tool});
		}

		return tool;
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
function addToolToPanel(toolKey, panelKey) {

	var promises = [loadTool(toolKey), loadFrame(panelKey)];
	
	return Promise.all(promises)
		.then(function(results) {
			var tool = results[0];
			var panel = results[1];

			tool.isSelected = true;
			tool.panel = panelKey;
			tool.position = panel.tools.length;

			panel.tools.push(tool.name);

			return Promise.all([saveTool(tool), saveFrame(panel)]);
		});
}

function removeToolFromPanel(toolKey) {

	return loadTool(toolKey)
		.then(function(tool) {
			return Promise.all([tool, loadFrame(tool.panel), loadPanelTools(tool.panel)]);
		})
		.then(function(results) {
			var removedTool = results[0];
			var panel = results[1];
			var panelTools = results[2];

			var promises = [];

			// update tool
			removedTool.isSelected = false;
			removedTool.panel = "";

			promises.push(saveTool(removedTool));

			// update panel
			panel.tools.splice(panel.tools.indexOf(removedTool.name), 1);
			
			promises.push(saveFrame(panel));

			// update all panel tool positions
			panelTools.forEach(function(tool) {
				if (tool.position > removedTool.position) {
					tool.position = tool.position - 1;

					promises.push(saveTool(tool));
				}
			});

			return Promise.all(promises);
		})
		.then(function(results) {
   			var tool = results[0];
			var panel = results[1];

			return messageFrame(panel.key, {action:"removeTool", tool:tool});
		})
		.catch(function(err) {
			console.log(Error(err));
		});
}

// maybe add another function "messageFrameWithoutRespone" or something that doesn't depend on a repsonse
// to the postMessage
function messageFrame(key, message) {
	return new Promise(function(resolve, reject) {
		loadFrame(key).then(function(frame) {
			clients.get(frame.clientId).then(function(client) {
				if (client !== undefined) {

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
				}
				else {
					console.log("info: client: " + key + " is unavailable. This is not an error.");
				}
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

/*
 * Sorts an array of tool objects by their position property
 */
function sortToolsByPosition(tools) {
	return tools.sort(function (a, b) {
		if (a.position < b.position) {
			return 1;
		}
		else if (a.position > b.position) {
			return -1;
		}
		else {
			return 0;
		}
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
	return messageFrame("management", {action:"getTargetDomain"});
}
