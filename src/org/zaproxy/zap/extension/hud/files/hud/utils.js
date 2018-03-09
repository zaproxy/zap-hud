/*
 * Utility Functions
 *
 * Description goes here...
 */

var IS_HUD_CONFIGURED = "isHudConfigured";

var CLIENT_LEFT = "left";
var CLIENT_RIGHT = "right";

var BUTTON_HTML = '<div class="button" id="BUTTON_NAME-button">\n<div class="button-icon" id="BUTTON_NAME-button-icon"><img src="<<ZAP_HUD_FILES>>?image=IMAGE_NAME" alt="IMAGE_NAME" height="16" width="16"></div>\n<div class="button-data" id="BUTTON_NAME-button-data">BUTTON_DATA</div>\n<div class="button-label" id="BUTTON_NAME-button-label">BUTTON_LABEL</div>\n</div>\n';
var BUTTON_NAME = /BUTTON_NAME/g;
var BUTTON_DATA_DIV  = /<div class="button-data" id="BUTTON_NAME-button-data">BUTTON_DATA<\/div>/g;
var BUTTON_DATA = /BUTTON_DATA/g;
var BUTTON_LABEL = /BUTTON_LABEL/g;
var IMAGE_NAME = /IMAGE_NAME/g;

// default tools
var DEFAULT_TOOLS_LEFT = ["scope", "break", "site-alerts-high", "site-alerts-medium", "site-alerts-low", "site-alerts-informational"];
var DEFAULT_TOOLS_RIGHT = ["spider", "active-scan", "page-alerts-high", "page-alerts-medium", "page-alerts-low", "page-alerts-informational"];


/*
 * Given the text from an HTTP request header, returns a parsed object.
 */
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

/*
 * Given the text from an HTTP response header, returns a parsed object.
 */
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

/*
 * Checks whether a message is from the ZAP domain or is a worker.
 */
function isFromTrustedOrigin (message) {

	if (message.origin === "https://zap" || message.isTrusted) {
		return true;
	}

	return false;
}

/* 
 * Parses the domain from a uri string.
 */
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

//todo change to be sw agnostic
/* parses the path from a uri string */
function parsePathFromUrl(url) {
	var parser = document.createElement("a");

	parser.href = url;
	// todo: correct
	return parser.pathname;
}

/*
 * Return whether configureStorage has been run yet.
 */
function isStorageConfigured() {
	return localforage.getItem(IS_HUD_CONFIGURED);
}

/*
 * Initialize all of the info that will be stored in indexeddb.
 */
function configureStorage() {
	var promises = [];

	promises.push(localforage.setItem(IS_HUD_CONFIGURED, true));
		
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

		return saveFrame(panel);
	}));
	
	promises.push(loadFrame("display").then(function(oldFrame) {
		var frame = {};

		frame.key = "display";
		if (oldFrame) {
			frame.clientId = oldFrame.clientId;
		}

		return saveFrame(frame);
	}));

	promises.push(loadFrame("management").then(function(oldFrame) {
		var frame = {};

		frame.key = "management";
		if (oldFrame) {
			frame.clientId = oldFrame.clientId;
		}

		return saveFrame(frame);
	}));

	promises.push(loadFrame("growlerAlerts").then(function(oldFrame) {
		var frame = {};

		frame.key = "growlerAlerts";
		if (oldFrame) {
			frame.clientId = oldFrame.clientId;
		}

		return saveFrame(frame);
	}));

	promises.push(loadFrame("timelinePane").then(function(oldFrame) {
		var frame = {};

		frame.key = "timelinePane";
		if (oldFrame) {
			frame.clientId = oldFrame.clientId;
		}

		return saveFrame(frame);
	}));

	return Promise.all(promises)
		.catch(errorHandler);
}

/*
 * Add the default tools to the panels.
 */
function setDefaultTools() {

	return new Promise(function(resolve) {
		var promises = [];

		DEFAULT_TOOLS_LEFT.forEach(function(toolName) {
			promises.push(function() { return addToolToPanel(toolName, "leftPanel");});
		});

		DEFAULT_TOOLS_RIGHT.forEach(function(toolName) {
			promises.push(function() { return addToolToPanel(toolName, "rightPanel");});
		});

		return promises.reduce(function(pacc, fn) {
			return pacc.then(fn);
		}, Promise.resolve());
	});
}

/*
 * Loads information about a frame as a blob from indexeddb.
 */
function loadFrame(key) {
	return localforage.getItem(key)
		.catch(errorHandler);
}

/*
 * Save information about a frame as a blob in indexeddb.
 */
function saveFrame(frame) {
	return localforage.setItem(frame.key, frame)
		.catch(errorHandler);
}

/*
 * Add a singletoolname to the "tools" list in indexeddb.
 */
function registerTool(toolname) {
	return localforage.getItem("tools")
		.then(function(tools) {
			tools.push(toolname);

			return localforage.setItem("tools", tools);
		})
		.catch(errorHandler);
}

/*
 * Add a list of toolnames to the "tools" list in indexeddb.
 */
function registerTools(toolnames) {
	return localforage.getItem("tools")
		.then(function(tools) {
			tools = tools.concat(toolnames);

			return localforage.setItem("tools", tools);
		})
		.catch(errorHandler);
}

/* 
 * loads the tool blob from indexeddb using the tool's name
 */
function loadTool(name) {
	return localforage.getItem(name);
}

/* 
 * saves the tool blob to indexeddb
 */
function saveTool(tool) {
	return localforage.setItem(tool.name, tool)
		.then(function(tool) {
			// Notify Panel of Updated Data
			if (tool.isSelected) {
				messageFrame(tool.panel, {action:"updateData", tool:tool});
			}

			return tool;
		})
		.catch(errorHandler);
}

/*
 * Return all tools currently selected in a panel.
 */
function loadPanelTools(panelKey) {
	return loadFrame(panelKey)
		.then(function(panel) {
			var toolPromises = [];

			panel.tools.forEach(function(toolname) {
				var p = loadTool(toolname);
				toolPromises.push(p);
			});

			return Promise.all(toolPromises);
		})
		.catch(errorHandler);
}

/*
 * Return all tools from indexdb.
 */
function loadAllTools() {
	return localforage.getItem("tools")
		.then(function(toolnames) {
			var toolPromises = [];

			toolnames.forEach(function(toolname) {
				var p = loadTool(toolname);
				toolPromises.push(p);
			})

			return Promise.all(toolPromises);
		})
		.catch(errorHandler);
}


/* 
 * Add a tool to a specific panel using the tool and panel keys.
 */
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
		})
		.catch(errorHandler);
}

/*
 * Remove a tool from a panel using the tool key.
 */
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
		.catch(errorHandler);
}

/*
 * Send a postMessage to an iframe window using the custom stored frame key in indexdb.
 */
function messageFrame(key, message) {
	return loadFrame(key)
			.then(getWindowFromFrame)
			.then(function(window) {
				return messageWindow(window, message);
			})
			.catch(errorHandler);
}

/*
 *	Get the window object from a stored frame blob.
 */
function getWindowFromFrame(frame) {
	return clients.get(frame.clientId)
		.then(function(client) {
			if (client !== undefined) {
				return client;
			}
			else {
				throw new Error('No client with id: ' + frame.clientId + ' found.');
			}
		});
}

/*
 * Send a postMessage to a window. 
 */
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
		
		if (origin) {
			window.postMessage(message, origin, [channel.port2]);
		}
		else {
			window.postMessage(message, [channel.port2]);
		}
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

/*
 * Uses search and replace to construct the html for a tool's button.
 */
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

// todo: maybe needed instead of passing info through postmessage
function getTargetDomain() {
	return messageFrame("management", {action:"getTargetDomain"});
}

/*
 * Log an error in a human readable way with a stack trace.
 */
function errorHandler(err) {
	var message = err.toString() + '\n';

	message += '\t' + err.stack.substring(0, err.stack.indexOf('/')) + ' (' + err.stack.substring(err.stack.indexOf('name=') + 5, err.stack.length - 1) + ')';

	console.log(message);
}