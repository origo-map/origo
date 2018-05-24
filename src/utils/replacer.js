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

  function searchAndReplace(name, obj) {
    const regex = new RegExp(`${start}(.*?)${end}`, 'g');
    const matches = regex.exec(name);
    if (matches) {
      let val = Object.prototype.hasOwnProperty.call(obj, matches[1]) ? obj[matches[1]] : '';
      if (!val) {
        const nsIndex = matches[0].indexOf(helperNS);
        if (nsIndex) {
          const helperParts = getArgs(matches[1]);
          const helperName = helperParts[1].substring(nsIndex - 1);
          const args = helperArg.concat(helperParts[0]);
          val = Object.prototype.hasOwnProperty.call(helper, helperName) ? helper[helperName].apply(null, args).toString() : '';
        }
      }
      return searchAndReplace(name.replace(matches[0], val), obj);
    }
    return name;
  }

  function replace(name, obj, options) {
    start = options.start || '{{';
    end = options.end || '}}';
    helper = options.helper || {};
    helperNS = options.helperNS || '@';
    helperArg = [options.helperArg] || [];

    const result = searchAndReplace(name, obj);
    return result;
  }

  return {
    replace(name, obj, options) {
      const opt = options || {};
      return (replace(name, obj, opt));
    }
  };
};

export default replacer();
