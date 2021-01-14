const webpack = require('webpack');

module.exports = {
  entry: [
    'babel-polyfill',
    'core-js/stable',
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
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
      proj4: 'proj4'
    })
  ]
};
