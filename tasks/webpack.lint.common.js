const webpack = require('webpack');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
  entry: [
    'whatwg-fetch',
    './origo.js'
  ],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        enforce: 'pre',
        use: ['source-map-loader']
      },
      {
        test: /\.(js)$/,
        exclude: {
          test: /node_modules/,
          not: [
            /@mapbox/,
            /@glidejs/
          ]
        },
        use: {
          loader: 'babel-loader'
        }
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
