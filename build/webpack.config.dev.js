'use strict'

const path = require('path')
const { VueLoaderPlugin } = require('vue-loader')

module.exports = {
  mode: 'development',
  entry: [
    './src/org/zaproxy/zap/extension/hud/files/hud/serviceworker.js',
    './src/org/zaproxy/zap/extension/hud/files/hud/panel.js'
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
}
