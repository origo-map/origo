const replacer = function replacer() {
  let start;
  let end;
  let helper;
  let helperNS;
  let helperArg;

  function getArgs(str) {
    const args = str.match(/\((.*?)\)/);
    if (args) {
      return [args[1].split(','), str.substring(0, args.index)];
    }
    return ['', str];
  }

  function searchAndReplace(name, obj, map) {
    const regex = new RegExp(`${start}(.*?)${end}`, 'g');
    const matches = regex.exec(name);
    let object;
    if (matches) {
      let val = Object.prototype.hasOwnProperty.call(obj, matches[1]) ? obj[matches[1]] : '';
      if (val === '') {
        const nsIndex = matches[0].indexOf(helperNS);
        if (nsIndex) {
          const helperParts = getArgs(matches[1]);
          const helperName = helperParts[1].substring(nsIndex - 1);
          const args = helperArg.concat(helperParts[0], map);
          val = Object.prototype.hasOwnProperty.call(helper, helperName) ? helper[helperName].apply(null, args).toString() : '';
        }
        if (matches[1].indexOf('.') > 0) {
          const splitMatch = matches[1].split('.');
          object = obj[splitMatch.shift()];
          val = `${start}${splitMatch.join('.')}${end}`;
        } else {
          object = obj;
        }
      } else {
        object = obj;
      }
      return searchAndReplace(name.replace(matches[0], val), object, map);
    }
    return name;
  }

  function replace(name, obj, options, map) {
    start = options.start || '{{';
    end = options.end || '}}';
    helper = options.helper || {};
    helperNS = options.helperNS || '@';
    helperArg = [options.helperArg] || [];

    const result = searchAndReplace(name, obj, map);
    return result;
  }

  return {
    replace(name, obj, options, map) {
      const opt = options || {};
      return (replace(name, obj, opt, map));
    }
  };
};

export default replacer();
