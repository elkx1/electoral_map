// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/app.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/build'),
  },
  devServer: {
    // contentBase: path.join(__dirname, 'src'),
    port: 8000,
    // watchFiles: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader', // You may need to install babel-loader and configure Babel
        },
      },
    //   {
    //     test: /\.css$/,
    //     loaders: [
    //         'style-loader',
    //         'css-loader',
    //     ]
    //   }
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      filename: 'index.html', // Output HTML filename
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/data', // Source directory
          to: 'data',       // Target directory in the output
        },
      ],
    }),
  ],
};