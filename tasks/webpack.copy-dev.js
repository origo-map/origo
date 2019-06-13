const merge = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  context: `${__dirname}/../`,
  output: {
    path: `${__dirname}/../build-dev`,
    filename: 'js/origo.js',
    libraryTarget: 'var',
    libraryExport: 'default',
    library: 'Origo'
  },
  mode: 'development',
  plugins: [
    new CopyWebpackPlugin([
      { from: 'dist/origo.min.js', to: 'js/origo.min.js' },
      'css/**',
      'examples/**',
      'data/*',
      'index.html',
      'index.json',
      'img/**'
    ])
  ]
});
