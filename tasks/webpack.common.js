const webpack = require('webpack');

module.exports = {
  entry: [
    'whatwg-fetch',
    './origo.js'
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader']
      },
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          cacheDirectory: false,
          presets: [
            ['@babel/preset-env', {
              targets: {
                browsers: ['chrome >= 39']
              },
              modules: false,
              useBuiltIns: 'entry',
              corejs: 3
            }]
          ],
          plugins: [
            ['@babel/plugin-transform-runtime', {
              regenerator: true
            }]
          ]
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
