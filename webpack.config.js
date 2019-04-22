var path = require('path');
var webpack = require('webpack');

module.exports = {
  entry: './src/Ubidots.js',
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'ubidots-html-canvas.js',
    library: 'Ubidots',
    libraryTarget: 'umd',
    libraryExport: 'default',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['@babel/preset-env'],
          plugins: ['@babel/plugin-proposal-class-properties']
        },
      },
    ],
  },
  stats: {
    colors: true,
  },
  devtool: 'source-map',
};