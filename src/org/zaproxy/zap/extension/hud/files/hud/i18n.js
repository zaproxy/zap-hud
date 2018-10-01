var I18n = (function() {

	var messages = {
		en_GB: {
			message: {
				alerts_page_high_tool: 'Page Alerts',
				alerts_page_info_tool: 'Page Alerts',
				alerts_page_low_tool: 'Page Alerts',
				alerts_page_medium_tool: 'Page Alerts',
				alerts_risk_high: 'High',
				alerts_risk_info: 'Info',
				alerts_risk_low: 'Low',
				alerts_risk_medium: 'Medium',
				alerts_site_high_tool: 'Site Alerts',
				alerts_site_info_tool: 'Site Alerts',
				alerts_site_low_tool: 'Site Alerts',
				alerts_site_medium_tool: 'Site Alerts',
				ascan_start: 'Start actively scanning this site?',
				ascan_start_scope: 'This site is not in scope.\nIn order to Active Scan the site you must add it to the scope.\nAdd the site to the scope and start Active Scanning it?',
				ascan_stop: 'The active scanner is currently running. Would you like to stop it?',
				ascan_tool: 'Active Scan',
				attack_start: 'Turn off Attack Mode?',
				attack_stop: 'Turn on Attack Mode?\nThis will cause ZAP to automatically attack all pages in scope.',
				attack_tool: 'Attack Mode',
				break_tool: 'Break',
				common_cancel: 'Cancel',
				common_in: 'In',
				common_off: 'Off',
				common_on: 'On',
				common_out: 'Out',
				common_remove: 'Remove',
				common_request: 'Request',
				common_response: 'Response',
				common_save: 'Save',
				common_start: 'Start',
				common_stop: 'Stop',
				history_tool: 'History',
				scope_tool: 'Scope',
				show_tool: 'Show / Enable',
				sites_status: 'Sites',
				sites_tool: 'Sites Tree',
				spider_start: 'Start spidering this site?',
				spider_start_scope: 'This site is not in scope.\nIn order to spider the site you must add it to the scope.\nAdd the site to the scope and start spidering it?',
				spider_stop: 'The spider is currently running. Would you like to stop it?',
				spider_tool: 'Spider',
			}
		},
		fr_FR: {
			message: {
				alerts_page_high_tool: 'Alertes de Page',
				alerts_page_info_tool: 'Alertes de Page',
				alerts_page_low_tool: 'Alertes de Page',
				alerts_page_medium_tool: 'Alertes de Page',
				alerts_risk_high: 'Haut',
				alerts_risk_info: 'Info',
				alerts_risk_low: 'Bas',
				alerts_risk_medium: 'Moyen',
				alerts_site_high_tool: 'Alertes de Site',
				alerts_site_info_tool: 'Alertes de Site',
				alerts_site_low_tool: 'Alertes de Site',
				alerts_site_medium_tool: 'Alertes de Site',
				ascan_start: 'Start actively scanning this site?',
				ascan_start_scope: 'This site is not in scope.\nIn order to Active Scan the site you must add it to the scope.\nAdd the site to the scope and start Active Scanning it?',
				ascan_stop: 'The active scanner is currently running. Would you like to stop it?',
				ascan_tool: 'Balayage Actif',
				attack_start: 'Turn off Attack Mode?',
				attack_stop: 'Turn on Attack Mode?\nThis will cause ZAP to automatically attack all pages in scope.',
				attack_tool: 'Mode d\'Attaque',
				break_tool: 'Arrêt',
				common_cancel: 'Annuler',
				common_in: 'Dedans',
				common_off: 'Off',
				common_on: 'En',
				common_out: 'Dehors',
				common_remove: 'Supprimer',
				common_request: 'Requête',
				common_response: 'Résponse',
				common_save: 'Sauvegarder',
				common_start: 'Début',
				common_stop: 'Arrête',
				history_tool: 'Historique',
				scope_tool: 'Périmètre',
				show_tool: 'Montrer / Activer',
				sites_status: 'Sites',
				sites_tool: 'Arbre des Sites',
				spider_start: 'Start spidering this site?',
				spider_start_scope: 'This site is not in scope.\nIn order to spider the site you must add it to the scope.\nAdd the site to the scope and start spidering it?',
				spider_stop: 'The spider is currently running. Would you like to stop it?',
				spider_tool: 'Indexer',
			}
		},
	};

	Vue.use(VueI18n);
	var i18n = new VueI18n({
		locale: '<<ZAP_LOCALE>>',
		fallbackLocalelocale: 'en_GB',
		messages: messages
	});
	new Vue({ i18n: i18n });

	function i18nt (key) {
		return i18n.t("message." + key);
	};

	function setLocale (locale) {
		i18n.locale = locale;
	};

	return {
		i18n: i18n,
		t: i18nt,
		setLocale: setLocale
	};
})();
