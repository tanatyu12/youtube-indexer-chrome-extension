const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: {
    popup: path.join(__dirname, './src/js/popup.js'),
    background: path.join(__dirname, './src/js/background.js'),
    content: path.join(__dirname, './src/js/content.js'),
  },
  output: {
    path: path.join(__dirname, './dist'),
    filename: '[name].js'
  },
  optimization : {
    runtimeChunk : false,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env',
                {
                  "targets": {
                    "node": true
                  }
                }]
              ]
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: { url: false }
          }
        ]
      }
    ]
  },
  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: './src/manifest.json',
          to: path.join(__dirname, './dist')
        },
        {
          from: './src/images/shimarin_icon.png',
          to: path.join(__dirname, './dist')
        },
        {
          from: './src/html/popup.html',
          to: path.join(__dirname, './dist')
        }
      ]
    }),
  ]
}