/* eslint-env node */

const postcssPresetEnv = require('postcss-preset-env');

module.exports = {
  plugins: [
    postcssPresetEnv({
      features: {
        'nesting-rules': true,
      },
    }),
  ],
};
