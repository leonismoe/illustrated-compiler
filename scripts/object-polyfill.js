if (!Object.entries) {
  Object.entries = function(object) {
    const result = [];
    for (let k in object) {
      if (object.hasOwnProperty(k)) {
        result.push([ k, object[k] ]);
      }
    }
    return result;
  };
}

if (!Object.keys) {
  Object.keys = function(object) {
    const result = [];
    for (let k in object) {
      if (object.hasOwnProperty(k)) {
        result.push(k);
      }
    }
    return result;
  };
}

if (!Object.values) {
  Object.values = function(object) {
    const result = [];
    for (let k in object) {
      if (object.hasOwnProperty(k)) {
        result.push(object[k]);
      }
    }
    return result;
  };
}
