const { merge } = require('webpack-merge');
const common = require('./webpack.lint.common');

module.exports = merge(common, {
  output: {
    publicPath: '/js',
    filename: 'origo.js',
    library: {
      type: 'var',
      export: 'default',
      name: 'Origo'
    }
  },
  devtool: 'source-map',
  devServer: {
    static: {
      directory: './'
    },
    port: 9967
  }
});
