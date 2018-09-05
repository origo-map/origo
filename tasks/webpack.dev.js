const merge = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  output: {
    path: `${__dirname}/../js`,
    publicPath: '/js',
    filename: 'origo.js',
    libraryTarget: 'var',
    libraryExport: 'default',
    library: 'origo'
  },
  devServer: {
    contentBase: './',
    port: 9966,
    proxy: {
      '/api': {
        target: 'http://kartportal.vasteras.se/services/gisela/v2/objects/',
        pathRewrite: { '^/api': '' },
        changeOrigin: true,
        secure: false
      },
      '/objects': {
        target: 'http://kartportal.vasteras.se/services/gisela/v2/',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
