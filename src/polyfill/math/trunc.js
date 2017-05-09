if (!Math.trunc) {
  Math.trunc = function(x) {
    return x - x % 1;
  };
}
