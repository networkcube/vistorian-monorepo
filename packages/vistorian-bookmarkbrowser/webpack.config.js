const path = require("path");
const CircularDependencyPlugin = require("circular-dependency-plugin");
const TerserPlugin = require("terser-webpack-plugin");

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
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true
            }
          }
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    library: "bookmarkbrowser",
    libraryTarget: "umd",
    filename: "index.js",
    path: path.resolve(__dirname, "lib"),
    //hashFunction: 'xxhash64' // see https://stackoverflow.com/a/73027407
  },
  optimization: {
    minimizer: [new TerserPlugin()],
    },
};
