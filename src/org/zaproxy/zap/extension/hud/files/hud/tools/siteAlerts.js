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
		ICONS.RED = "site-alerts.png";

	//todo: change this to a util function that reads in a config file (json/xml)
	function initializeStorage() {
		var tool = {};
		tool.name = NAME;
		tool.label = LABEL;
		tool.data = DATA.NONE;
		tool.icon = ICONS.RED;
		tool.isSelected = false;
		tool.panel = "";
		tool.alerts = {};

		saveTool(tool);
	}

	function formatAlerts (alerts) {
		var formatted = {};
		var risks = ["Low", "Medium", "High", "Informational"];
		var alertTypes = [];

		for (var i=0; i<risks.length; i++) {
			var risk = risks[i];
			var riskAlerts = alerts.filter(function(alert) {return alert.risk === risk; });

			formatted[risk] = {};
			for (var j=0; j<riskAlerts.length; j++) {
				var alert = riskAlerts[j];
				if (alert.alert in formatted[risk]) {
					formatted[risk][alert.alert].push(alert);
				}
				else {
					formatted[risk][alert.alert] = [];
					formatted[risk][alert.alert].push(alert);
				}
			}
		}

		return formatted;
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

	function onPollData(domain, alerts) {
		loadTool(NAME).then(function(tool) {
			tool.alerts[domain] = formatAlerts(alerts);

			saveTool(tool);
			return domain;
		}).then(function(domain) {
			updateAlertCount(domain);
		});
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