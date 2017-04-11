/* eslint-env node */

const path = require('path');
const resolveId = require('postcss-import/lib/resolve-id');
const externals = require('./scripts/externals').getExternals();
const webpackIntegration = require('./scripts/postcss/imported');

const stub = path.resolve(__dirname, './config/empty.css');

module.exports = (ctx) => ({
  plugins: {
    'postcss-import': {
      resolve: (id, basedir, options) => {
        let [first_part] = id.split('/');
        if (first_part.startsWith('~')) {
          first_part = first_part.slice(1);
        }
        if (first_part in externals) {
          webpackIntegration.add(id);
          return stub;
        }
        return resolveId(id, basedir, options);
      }
    },
    'postcss-cssnext': {
      browsers: [
        '>1%',
        'last 4 versions',
        'Firefox ESR',
        'not ie < 9',
      ],
    },
    'postcss-reporter': {},
  },
});
