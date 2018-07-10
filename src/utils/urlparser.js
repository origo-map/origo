const urlparser = {};

urlparser.objectify = function func(objString, opt) {
  const options = opt || {};
  const delimeter = options.delimeter || '/';
  const topmost = options.topmost || 'name';
  const parts = objString.split(delimeter);
  const obj = {};
  if (options.topmost) {
    if (parts[0] === '') {
      console.log('Topmost value is missing');
    } else {
      obj[topmost] = parts[0];
    }
  }
  if (parts.length > 1) {
    for (let i = 1, ii = parts.length; i < ii; i += 2) {
      obj[parts[i]] = parts[i + 1];
    }
  }
  return obj;
};
urlparser.stringify = function func(obj, opt) {
  const options = opt || {};
  const delimeter = options.delimeter || '/';
  const topmost = options.topmost || undefined;
  let objString = topmost ? obj[topmost] : '';
  for (const key in obj) {
    if (key !== topmost) { objString += delimeter + key + delimeter + obj[key]; }
  }
  return objString;
};
urlparser.arrStringify = function func(arr, opt) {
  const options = opt || {};
  const delimeter = options.delimeter || '/';
  const topmost = options.topmost || '';
  let arrString = topmost ? topmost + delimeter : '';
  if (typeof arr[0][0] === 'undefined') {
    arrString += arr.join(',');
  } else {
    const outer = arr.map((inner) => {
      const res = inner.map(innerpart => innerpart.join('!'));
      return res.join(',');
    });
    arrString += outer.join(options.delimeter);
  }
  return arrString;
};
urlparser.strArrayify = function func(str, opt) {
  const options = opt || {};
  const delimeter = options.delimeter || '/';
  const topmostName = options.topmostName || 'topmost';
  const arrName = options.arrName || 'arr';
  const topmost = str.substring(0, str.indexOf(delimeter));
  const arrStr = str.substring(str.indexOf(delimeter) + 1);
  const arr = arrStr.split(delimeter).map(el => el.split('!'));
  const obj = {};
  obj[topmostName] = topmost;
  obj[arrName] = arr;
  return obj;
};
urlparser.strIntify = function func(str, opt) {
  const options = opt || {};
  const delimiter = options.delimiter || ',';
  const arr = str.split(delimiter);
  const strToInt = arr.map(el => parseInt(el, 10));
  return strToInt;
};
urlparser.strBoolean = function func(str) {
  if (str === '1') {
    return true;
  } else if (str === '0') {
    return false;
  }
  console.log('String is not 1 or 0');
  return false;
};
urlparser.formatUrl = function func(obj) {
  const url = Object.getOwnPropertyNames(obj).reduce((prev, current) => {
    const curr = prev ? `&${current}=${obj[current]}` : `${current}=${obj[current]}`;
    return prev + curr;
  }, '');
  return url;
};

export default urlparser;
