const webpack = require('webpack');
const nodeSass = require('node-sass');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
  entry: [
    'whatwg-fetch',
    './origo.js'
  ],
  module: {
    rules: [
      {
        test: /\.m?js$/,
        enforce: 'pre',
        use: ['source-map-loader']
      },
      {
        test: /\.(js)$/,
        exclude: {
          test: /node_modules/,
          not: [
            /@mapbox/,
            /@glidejs/
          ]
        },
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              implementation: nodeSass,
              sassOptions: {
                fiber: false
              }
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js']
  },
  plugins: [
    new webpack.ProvidePlugin({
      proj4: 'proj4'
    }),
    new ESLintPlugin({
      fix: true,
      emitError: true
    }),
    new webpack.DefinePlugin({
      'process.env.import_sass': 'true'
    })
  ]
};
