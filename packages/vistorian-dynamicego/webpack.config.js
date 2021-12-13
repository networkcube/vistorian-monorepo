const path = require("path");
const CircularDependencyPlugin = require("circular-dependency-plugin");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");

module.exports = {
  mode: "production",
  entry: "./src/index.ts",
  devtool: "inline-source-map",
  externals: {
    science: "science",
  },
  plugins: [
    new CircularDependencyPlugin({
      exclude: /a\.js|node_modules/,
      failOnError: true,
      cwd: process.cwd(),
    }),
  ],
  module: {
    rules: [
      {
        test: /\.ts|\.tsx$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  devServer: {
    contentBase: "./",
  },
  output: {
    library: "dynamicego",
    libraryTarget: "umd",
    filename: "index.js",
    path: path.resolve(__dirname, "lib"),
  },
  optimization: {
    minimizer: [new UglifyJsPlugin()],
  },
};
