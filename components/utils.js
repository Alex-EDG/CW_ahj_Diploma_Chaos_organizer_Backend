function by(keyFn) {
  return (x, y) => {
    const keyX = keyFn(x);
    const keyY = keyFn(y);
    return keyX > keyY ? 1 : keyX < keyY ? -1 : 0;
  };
}

function descendingBy(keyFn) {
  return (x, y) => {
    const keyX = keyFn(x);
    const keyY = keyFn(y);
    return keyX > keyY ? -1 : keyX < keyY ? 1 : 0;
  };
}

module.exports = {by, descendingBy};
