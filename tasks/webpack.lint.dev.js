const { merge } = require('webpack-merge');
const common = require('./webpack.lint.common.js');

module.exports = merge(common, {
  output: {
    publicPath: '/js',
    filename: 'origo.js',
    libraryTarget: 'var',
    libraryExport: 'default',
    library: 'Origo'
  },
  devtool: 'source-map',
  devServer: {
    contentBase: './',
    port: 9966
  },
  optimization: {
    nodeEnv: 'development',
    runtimeChunk: false,
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false
  }
});
