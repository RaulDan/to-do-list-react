const path = require('node:path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (_env, argv) => ({
  entry: './src/federation/standalone.js',
  output: {
    path: path.resolve(__dirname, 'dist/federation'),
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
    uniqueName: 'todo_list',
    publicPath: 'auto',
    clean: true,
  },
  resolve: { extensions: ['.js', '.jsx'] },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: { presets: [['@babel/preset-react', { runtime: 'automatic' }]] },
        },
      },
      { test: /\.css$/, type: 'asset/source' },
    ],
  },
  optimization: { runtimeChunk: false },
  plugins: [
    new webpack.container.ModuleFederationPlugin({
      name: 'todo_list',
      filename: 'remoteEntry.js',
      library: { type: 'var', name: 'todo_list' },
      exposes: { './mount': './src/federation/mount.js' },
      shared: {},
    }),
    new webpack.DefinePlugin({
      'process.env.REACT_APP_TODO_API_URL': JSON.stringify(
        process.env.REACT_APP_TODO_API_URL || 'http://localhost:7000'
      ),
    }),
    new HtmlWebpackPlugin({ template: 'src/federation/index.html' }),
  ],
  devtool: argv.mode === 'development' ? 'source-map' : false,
  devServer: {
    port: 3000,
    allowedHosts: ['localhost', '127.0.0.1'],
    headers: { 'Access-Control-Allow-Origin': '*' },
    hot: false,
    client: false,
    webSocketServer: false,
  },
});
