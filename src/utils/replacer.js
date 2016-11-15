/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var Replacer = function() {

  var defaultOptions = {
      start: '{{',
      end: '}}'
  }

  function replace(name, obj, options) {
      var start = options.start || defaultOptions.start;
      var end = options.end || defaultOptions.end;

      var result = searchAndReplace(name, obj, start, end);
      return result;
  }

  function searchAndReplace(name, obj, start, end) {
      var regex = new RegExp(start + '(.*?)' +  end, "g");
      var matches = regex.exec(name);
      if(matches) {
          var val = obj.hasOwnProperty(matches[1]) ? obj[matches[1]] : '';
          return searchAndReplace(name.replace(matches[0], val), obj, start, end);
      }
      else {
          return name;
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
