const merge = require('webpack-merge');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  optimization: {
    nodeEnv: 'production',
    minimize: true
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
  mode: 'production',
  plugins: [
    new UglifyJSPlugin({
      uglifyOptions: {
        output: {
          beautify: false
        }
      }
    })
  ]
});
