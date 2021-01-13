const TerserPlugin = require('terser-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  optimization: {
    nodeEnv: 'production',
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
        extractComments: false
      })]
  },
  performance: { hints: false },
  output: {
    path: `${__dirname}/../dist`,
    filename: 'origo.min.js',
    libraryTarget: 'var',
    libraryExport: 'default',
    library: 'Origo'
  },
  devtool: false,
  mode: 'production'
});
