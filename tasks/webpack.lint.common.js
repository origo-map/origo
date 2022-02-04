const webpack = require('webpack');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
  entry: [
    './origo.js'
  ],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        enforce: 'pre',
        use: ['source-map-loader']
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js']
  },
  plugins: [
    new webpack.ProvidePlugin({
      proj4: 'proj4'
    }),
    new ESLintPlugin({
      fix: true,
      emitError: true
    })
  ]
};
