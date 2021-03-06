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
    'visual-rlg': './app/visual-rlg.js',
    'lexical-analysis': './app/lexical-analysis.js',
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
      {
        test: /\.inline\.worker\.js$/,
        use: {
          loader: 'worker-loader',
          options: {
            inline: true,
            fallback: false,
          }
        }
      },
      {
        test: /\.worker\.js$/,
        use: {
          loader: 'worker-loader',
          options: {}
        }
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
