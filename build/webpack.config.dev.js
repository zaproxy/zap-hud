'use strict'

const path = require('path')
const { VueLoaderPlugin } = require('vue-loader')

const config = {
  devtool: 'source-map',
  mode: 'development'
};

const exampleConfig = Object.assign({}, config, {
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
});

const injectConfig = Object.assign({}, config, {
  entry: [
    './src/org/zaproxy/zap/extension/hud/files/hud/target/inject.js'
  ],
  output: {
    path: path.resolve(__dirname, '../src/org/zaproxy/zap/extension/hud/files/hud/target/'),
    filename: 'inject.bundle.js'
  }
});

module.exports = [
  exampleConfig, injectConfig
];
