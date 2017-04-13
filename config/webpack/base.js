/* eslint-env node */

const path = require('path');
const Externals = require('../../scripts/externals');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ExternalsPlugin = require('../../scripts/webpack/externals-plugin');

const externals = {};
Object.entries(Externals.getExternals()).forEach(([k, v]) => {
  if (v) externals[k] = v;
});

module.exports = {
  context: path.resolve(__dirname, '../../src'),
  entry: {
    app: './app.js',
    'visual-rlg': './visual-rlg.js',
  },
  externals,
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ExtractTextPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: { sourceMap: true },
            },
            'postcss-loader',
          ],
        }),
      },
    ],
  },
  output: {
    filename: 'assets/[name].bundle.js',
    path: path.resolve(__dirname, '../../build'),
    publicPath: '/',
  },
  plugins: [
    new ExtractTextPlugin('assets/[name].bundle.css'),
    new ExternalsPlugin(),
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: 'commons',
    //   filename: 'commons.js',
    //   minChunks: 2,
    // }),
  ],
};
