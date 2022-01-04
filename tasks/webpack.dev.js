const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  output: {
    publicPath: '/js',
    filename: 'origo.js',
    libraryTarget: 'var',
    libraryExport: 'default',
    library: 'Origo'
  },
  devServer: {
    contentBase: './',
    port: 9966,
    disableHostCheck: true
  },
  node: {
    fs: 'empty'
  }
});
