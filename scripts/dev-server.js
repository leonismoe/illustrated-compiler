/* eslint-env node */

const path = require('path');

const express = require('express');
const webpack = require('webpack');
const webpackMiddleware = require('webpack-dev-middleware');

require('./object-polyfill');

const transpiler = (() => {
  if (process.argv.includes('--no-transpiler')) {
    return '';
  }
  let result = 'buble';
  const offset = process.argv.indexOf('--transpiler');
  if (offset > -1) {
    switch (process.argv[offset]) {
      case 'buble': result = 'buble'; break;
      case 'babel': result = 'babel'; break;
      case 'none':  result = ''; break;
      default: process.stderr.write('transpiler is unspecified of unknown\n'); process.exit(-1);
    }
  }
  return result;
})();

const compiler = webpack(require('../config/webpack/dev' + (transpiler ? '-' + transpiler : '')));

const app = express();
app.use(express.static(path.resolve(__dirname, '../public')));
app.use('/node_modules', express.static(path.resolve(__dirname, '../node_modules')));
app.use(webpackMiddleware(compiler, {
  stats: {
    colors: true,
  },
}));
app.use(express.static(path.resolve(__dirname, '../src')));

app.listen(3000);
process.stderr.write('Listening at http://localhost:3000/\n');
