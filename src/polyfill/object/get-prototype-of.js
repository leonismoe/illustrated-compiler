if (!Object.getPrototypeOf) {
  Object.getPrototypeOf = function (obj) {
    const t = typeof obj;
    if (!obj || (t !== 'object' && t !== 'function')) {
      throw new TypeError('not and object');
    }
    return obj.__proto__;
  };
}
