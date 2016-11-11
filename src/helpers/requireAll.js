const getDepth = key => key.match(/\//g).length;

const requireAll = (_require, depth) => {
  let keys = _require.keys();

  if (depth) {
    keys = keys.filter(
      typeof depth === 'function' ?
        key => depth(getDepth(key)) :
        key => getDepth(key) === depth + 1
    );
  }

  return keys.reduce((result, key) => {
    const name = /([^/]+)\..+$/.exec(key)[1];

    try {
      result[name] = _require(key);
    } catch (err) {
      console.warn('Import error', key, err);
    }

    return result;
  }, {});
};

export default requireAll;
