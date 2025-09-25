'use strict';

const path = require('path');
const {VueLoaderPlugin} = require('vue-loader');

module.exports = {
	resolve: {
    alias: {
      vue: '@vue/compat'
    }
  },
	mode: 'development',
	entry: [
		'./src/main/zapHomeFiles/hud/serviceworker.js',
		'./src/main/zapHomeFiles/hud/panel.js'
	],
	resolveLoader: {
		alias: {'zap-loader': path.join(__dirname, 'loaders/zap-loader.js')}
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				use: [
					'zap-loader'
				]
			},
			{
				test: /\.vue$/,
				use: [
					'vue-loader'
				]
			}
		]
	},
	plugins: [
		new VueLoaderPlugin()
	]
};
