const path = require("path");

module.exports = {
  entry: "./src/Ubidots.js",
  output: {
    path: path.resolve(__dirname, "build"),
    filename: "ubidots-html-canvas.js",
    library: "Ubidots",
    libraryTarget: "umd",
    libraryExport: "default",
  },
  resolve: { extensions: [".js"] },
  mode: "production",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
  stats: {
    colors: true,
  },
  devtool: "source-map",
  watchOptions: {
    ignored: /node_modules/,
    aggregateTimeout: 300,
    poll: 1000,
  },
  devServer: {
    static: [
      {
        directory: path.join(__dirname, 'build'),
      },
      {
        directory: path.join(__dirname, 'public'),
      }
    ],
    compress: true,
    port: 9100,
    hot: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
    },
  },
};
