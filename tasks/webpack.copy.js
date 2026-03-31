const { merge } = require('webpack-merge');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const common = require('./webpack.common');

module.exports = merge(common, {
  context: `${__dirname}/../`,
  output: {
    path: `${__dirname}/../build`,
    filename: 'js/origo.js',
    libraryTarget: 'var',
    libraryExport: 'default',
    library: 'Origo',
    chunkLoading: false
  },
  devtool: false,
  mode: 'development',
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        { from: 'dist/origo.min.js', to: 'js/origo.min.js' },
        'css/**',
        'examples/**',
        'data/*',
        'index.html',
        'index.json',
        'img/**',
        'guide.json'
      ]
    })
  ]
});
