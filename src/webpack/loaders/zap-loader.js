module.exports = function zapLoader(source) {
	source = source.replace('<<ZAP_HUD_FILES>>', 'https://zap');
	source = source.replace('<<ZAP_HUD_URL>>', 'https://targetdomain.com');
	source = source.replace('<<ZAP_HUD_API>>', 'https://zap/api');
	source = source.replace('<<ZAP_HUD_WS>>', 'https://zap/websocket');
	source = source.replace('<<ZAP_HUD_TOOLS>>', 'http://zap/to/some/tool');
	source = source.replace('<<ZAP_SHARED_SECRET>>', 'sometestsecret');

	return source;
};
