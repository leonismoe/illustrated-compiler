/* eslint-env node */

function isPlainObject(object) {
  if (!object) return false;
  const proto = Object.getPrototypeOf(object);
  return proto == Object.prototype || proto == null;
}

function clone(target, source) {
  for (let k in source) {
    if (!source.hasOwnProperty(k)) continue;

    const value = source[k];
    if (typeof value == 'object') {
      if (isPlainObject(value)) {
        target[k] = {};
        clone(target[k], value);

      } else if (Array.isArray(value)) {
        target[k] = value.slice();

      } else {
        target[k] = value;
      }

    } else {
      target[k] = value;
    }
  }

  return target;
}

function update(target, source) {
  for (let k in source) {
    if (!source.hasOwnProperty(k)) continue;

    if (!target.hasOwnProperty(k)) {
      target[k] = source[k];

    } else if (isPlainObject(target[k]) && isPlainObject(source[k])) {
      update(target[k], source[k]);

    } else if (Array.isArray(target[k]) && Array.isArray(source[k])) {
      target[k] = target[k].concat(source[k]);

    } else {
      target[k] = source[k];
    }
  }
  return target;
}

module.exports = function(source, config) {
  const result = clone({}, source);
  update(result, config || {});
  return result;
};
