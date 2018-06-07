const merge = require('webpack-merge');
const CompressionPlugin = require('compression-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const prod = require('./webpack.prod.js');

module.exports = merge(prod, {
  performance: { hints: 'warning' },
  plugins: [
    new CompressionPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip'
    }),
    new BundleAnalyzerPlugin()
  ]
});
