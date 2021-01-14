const config = require("./base.config");
const HtmlWebpackPlugin = require("html-webpack-plugin");
module.exports = {
  entry: {
    main: config.mainPath,
  },
  output: {
    path: config.appPath,
  },
  resolve: {
    extensions: [".js", ".json", ".jsx", ".ts", ".tsx", ".less"],
  },
  module: {
    rules: [
      {
        test: /\.((j|t)sx?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-react"],
              plugins: ["@babel/plugin-proposal-class-properties"],
            },
          },
          {
            loader: "awesome-typescript-loader",
            options: {
              silent: true,
              configFileName: config.tsConfigPath,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        include: config.srcPath,
        exclude: /node_modules/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.less$/,
        use: ["style-loader", "css-loader", "less-loader"],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: config.templatePath,
      showErrors: true,
    }),
  ],
};
