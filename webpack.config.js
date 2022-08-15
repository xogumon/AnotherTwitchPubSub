const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  mode: "production", // "production" | "development" | "none"
  entry: {
    bundle: "./src/index.ts",
    "bundle.min": "./src/index.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: `[name].js`,
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  target: "web",
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        minify: TerserPlugin.uglifyJsMinify,
        exclude: /node_modules/,
        include: /\.min\.js$/,
        terserOptions: {
          mangle: {
            toplevel: true,
          }
        },
      }),
    ],
  },
};
