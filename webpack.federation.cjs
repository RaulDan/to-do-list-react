const path = require('node:path');
const webpack = require('webpack');
const { ModuleFederationPlugin } = webpack.container;

module.exports = {
  entry: {},
  output: {
    path: path.resolve(__dirname, 'build/federation'),
    publicPath: 'auto',
    uniqueName: 'todo_list',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: { loader: 'babel-loader', options: { presets: [['@babel/preset-react', { runtime: 'automatic' }]] } },
      },
      { test: /\.css$/, use: { loader: 'css-loader', options: { exportType: 'string' } } },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.REACT_APP_TODO_API_URL': JSON.stringify(process.env.REACT_APP_TODO_API_URL || 'http://localhost:7000'),
    }),
    new ModuleFederationPlugin({
      name: 'todo_list',
      filename: 'remoteEntry.js',
      exposes: { './mount': './src/federation/mount.js' },
      shared: {},
    }),
  ],
  devServer: {
    port: 3000,
    host: '0.0.0.0',
    headers: { 'Access-Control-Allow-Origin': '*' },
    allowedHosts: ['localhost', '127.0.0.1'],
    hot: false,
    open: false,
    liveReload: false,
    client: false,
  },
};
