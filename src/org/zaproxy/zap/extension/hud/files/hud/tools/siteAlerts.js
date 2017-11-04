/*
 * Site Alerts Tool
 *
 * Description goes here...
 */

var SiteAlerts = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "site-alerts";
	var LABEL = "Site Alerts";
	var DATA = {};
		DATA.NONE = "0";
	var ICONS = {};
		ICONS.SA = "site-alerts.png";

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.NONE;
		tool.icon = ICONS.SA;
		tool.isSelected = false;
		tool.panel = "";
		tool.alerts = {};
		tool.cache = {};

		saveTool(tool);
	}

	function showAlerts(domain) {
		var config = {};

		loadTool(NAME).then(function(tool) {
			config.alerts = tool.alerts[domain];

			messageFrame("mainDisplay", {action:"showAlerts", config:config}).then(function(response) {
				// Handle button choice
				if ("id" in response) {
					fetch("<<ZAP_HUD_API>>JSON/core/view/alert/?id=" + response.id + "&apikey=<<ZAP_HUD_API_KEY>>").then(function(response) {
						response.json().then(function(json) {
							showAlertDetails(json.alert);
						});
					});
				}
				else {
					//cancel
				}
			});
		});
	}

	function showAlertDetails(details) {
		var config = {};
		config.details = details;

		messageFrame("mainDisplay", {action: "showAlertDetails", config: config});
	}

	function updateAlertCount(domain) {
		return loadTool(NAME).then(function(tool) {
			if (tool.alerts[domain]) {
				var count = 0;
				for (var key in tool.alerts[domain]) {
					count += Object.keys(tool.alerts[domain][key]).length;
				}
				tool.data = count.toString();
			}
			else {
				tool.data = "0";
			}
			saveTool(tool);
		});
	}


	function onPanelLoad(data) {
		return updateAlertCount(data.domain);
	}

	function onPollData(domain, data) {
		loadTool(NAME).then(function(tool) {

			data.forEach(function(alert) {
				// not in cache
				if (tool.cache[alert.id] === undefined) {
					// add to cache
					tool.cache[alert.id] = alert;

					// if domain not initialized
					if (tool.alerts[domain] === undefined) {
						tool.alerts[domain] = {};
						tool.alerts[domain].Low = {};
						tool.alerts[domain].Medium = {};
						tool.alerts[domain].High = {};
						tool.alerts[domain].Informational = {};
					}

					// add to alerts for the page
					if (tool.alerts[domain][alert.risk][alert.alert] === undefined) {
						tool.alerts[domain][alert.risk][alert.alert] = [];

						// send growler alert (fine with it being async, can change later if its an issue)
						showGrowlerAlert(alert);
					}
					tool.alerts[domain][alert.risk][alert.alert].push(alert);
				}
			});

			return saveTool(tool);
		})
		.then(function() {
			return updateAlertCount(domain);
		})
		.catch(function(err) {
			console.log(Error(err));
		});
	}

	function showGrowlerAlert(alert) {
		return messageFrame("growlerAlerts", {action: "showGrowlerAlert", alert: alert});
	}

	function showOptions() {
		var config = {};

		config.tool = NAME;
		config.toolLabel = LABEL;
		config.options = {opt1: "Option 1", opt2: "Option 2", remove: "Remove"};

		messageFrame("mainDisplay", {action:"showButtonOptions", config:config}).then(function(response) {
			// Handle button choice
			if (response.id == "opt1") {
				console.log("Option 1 chosen");
			}
			else if (response.id == "opt2") {
				console.log("Option 2 chosen");
			}
			else if (response.id == "remove") {
				removeToolFromPanel(NAME);
			}
			else {
				//cancel
			}
		});
	}

	self.addEventListener("activate", function(event) {
		initializeStorage();
	});

	self.addEventListener("message", function(event) {
		var message = event.data;

		// Broadcasts
		switch(message.action) {
			case "initializeTools":
				initializeStorage();
				break;

			case "pollData":
				onPollData(message.targetDomain, message.pollData.siteAlerts);
				break;

			default:
				break;
		}

		// Directed
		if (message.tool === NAME) {
			switch(message.action) {
				case "buttonClicked":
					showAlerts(message.domain);
					break;

				case "buttonMenuClicked":
					showOptions();
					break;

				default:
					break;
			}
		}
	});

	return {
		name: NAME,
		onPanelLoad: onPanelLoad,
		initialize: initializeStorage
	};
})();

self.tools[SiteAlerts.name] = SiteAlerts;