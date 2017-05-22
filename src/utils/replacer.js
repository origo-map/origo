"use strict";

var Replacer = function() {

  var start = undefined;
  var end = undefined;
  var helper = undefined;
  var helperNS = undefined;
  var helperArg = undefined;

  function replace(name, obj, options) {
      start = options.start || '{{';
      end = options.end || '}}';
      helper = options.helper || {};
      helperNS = options.helperNS || '@';
      helperArg = [options.helperArg] || [];

      var result = searchAndReplace(name, obj);
      return result;
  }

  function searchAndReplace(name, obj) {
      var regex = new RegExp(start + '(.*?)' +  end, "g");
      var matches = regex.exec(name);
      if(matches) {
          var val = obj.hasOwnProperty(matches[1]) ? obj[matches[1]] : '';
          if (!val) {
            var nsIndex = matches[0].indexOf(helperNS);
            if (nsIndex) {
              var helperParts = getArgs(matches[1]);
              var helperName = helperParts[1].substring(nsIndex - 1);
              var args = helperArg.concat(helperParts[0]);
              val = helper.hasOwnProperty(helperName) ? helper[helperName].apply(null, args).toString() : '';
            }
          }
          return searchAndReplace(name.replace(matches[0], val), obj);
      }
      else {
          return name;
      }
  }

  function getArgs(str) {
    var args = str.match(/\((.*?)\)/);
    if (args) {
      return [args[1].split(','), str.substring(0, args.index)];
    } else {
      return ['',str];
    }
  }

	return {
  		replace: function(name, obj, options) {
          var opt = options || {};
          return (replace(name, obj, opt));
  		}
	};

}

module.exports = Replacer();
