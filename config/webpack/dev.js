/* eslint-env node */

const extend = require('../../scripts/webpack/extend');

module.exports = extend(require('./base'), {
  devtool: 'source-map',
});
