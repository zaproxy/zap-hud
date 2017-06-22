/*
 * Page Alerts Tool
 *
 * Description goes here...
 */

var PageAlerts = (function() {

	// Constants
	// todo: could probably switch this to a config file?
	var NAME = "page-alerts";
	var LABEL = "Page Alerts";
	var DATA = {};
		DATA.NONE = "0";
	var ICONS = {};
		ICONS.RED = "flag-red.png";

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

	function showAlerts(url) {
		var config = {};

		loadTool(NAME).then(function(tool) {
			config.alerts = tool.alerts[url];

			messageFrame("mainDisplay", {action:"showAlertsDialog", config:config}).then(function(response) {

				// Handle button choice
				if (response.id) {
					fetch("<<ZAP_HUD_API>>JSON/core/view/alert/?id=" + response.id + "&apikey=<<ZAP_HUD_API_KEY>>").then(function(response) {
						response.json().then(function(json) {
							var details = JSON.parse(data).alert;

							showAlertDetails(details);
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
		console.log(details);
	}

	function updateAlertCount(url) {
		return loadTool(NAME).then(function(tool) {
			if (tool.alerts[url]) {
				var count = 0;
				for (var key in tool.alerts[url]) {
					count += Object.keys(tool.alerts[url][key]).length;
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
		return updateAlertCount(data.url);
	}

	function onPollData(url, alerts) {
		loadTool(NAME).then(function(tool) {
			tool.alerts[url] = formatAlerts(alerts);

			saveTool(tool);
			return url;
		}).then(function(url) {
			updateAlertCount(url);
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
				onPollData(message.targetUrl, message.pollData.pageAlerts);
				break;

			default:
				break;
		}

		// Directed
		if (message.tool === NAME) {
			switch(message.action) {
				case "buttonClicked":
					showAlerts(message.url);
					break;

				default:
					break;
			}
		}
	});

	return {
		name: NAME,
		onPanelLoad: onPanelLoad
	};
})();

self.tools[PageAlerts.name] = PageAlerts;