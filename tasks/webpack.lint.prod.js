const TerserPlugin = require('terser-webpack-plugin');
const { merge } = require('webpack-merge');
const common = require('./webpack.lint.common');

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
    library: {
      type: 'var',
      export: 'default',
      name: 'Origo'
    }
  },
  devtool: false,
  mode: 'production'
});
