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
};
