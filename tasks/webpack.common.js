const webpack = require('webpack');

module.exports = {
  entry: [
    './origo.js'
  ],
  module: {
    rules: [
      {
        test: /\.(js)$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          cacheDirectory: false,
          presets: [
            ['env', {
              targets: {
                browsers: ['ie >= 11']
              },
              modules: false
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
