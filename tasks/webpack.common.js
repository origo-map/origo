const webpack = require('webpack');

module.exports = {
  entry: [
    'core-js/stable',
    './origo.js'
  ],
  resolve: {
    extensions: ['*', '.js']
  },
  plugins: [
    new webpack.ProvidePlugin({
      proj4: 'proj4'
    })
  ]
};
