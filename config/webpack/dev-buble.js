/* eslint-env node */

const extend = require('../../scripts/webpack/extend');

module.exports = extend(require('./base'), {
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'buble-loader',
        options: {
          transforms: {
            modules: false,
            dangerousForOf: true,
          },
        }
      },
    ],
  },
});
