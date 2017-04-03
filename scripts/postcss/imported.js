/* eslint-env node */

const loaded_externals = [];

module.exports = {
  get: () => loaded_externals,
  add: (path) => loaded_externals.push(path.startsWith('~') ? path.slice(1) : path),
  empty: () => loaded_externals.length = 0,
};
