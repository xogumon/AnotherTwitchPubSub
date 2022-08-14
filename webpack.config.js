const path = require("path");
const isMinify = process.env.MINIFY === "true";

module.exports = {
  mode: "production", // "production" | "development" | "none"
  entry: {
    bundle: "./src/index.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: `[name].${isMinify ? "min." : ""}js`,
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
    minimize: isMinify,
  },
};
