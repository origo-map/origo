
/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var urlparser = {};

urlparser.objectify = function(objString, opt_options) {
    var options = opt_options || {};
    var delimeter = options.delimeter || '/';
    var topmost = options.topmost || 'name';
    var parts = objString.split(delimeter);
    var obj = {};
    if(options.topmost) {
        if(parts[0]  === '') {
            console.log('Topmost value is missing');
        }
        else {
            obj[topmost] = parts[0];
        }
    }
    if(parts.length > 1) {
        for (var i = 1, ii = parts.length; i < ii; i += 2) {
            obj[parts[i]] = parts[i + 1];
        }
    }
    return obj;
}
urlparser.stringify = function(obj, opt_options) {
    var options = opt_options || {};
    var delimeter = options.delimeter || '/';
    var topmost = options.topmost || undefined;
    var objString = topmost ? obj[topmost] : '';
    for (var key in obj) {
        if(key !== topmost)
        objString += delimeter + key + delimeter + obj[key];
    }
    return objString;
}
urlparser.arrStringify = function(arr, opt_options) {
   var options = opt_options || {};
   var delimeter = options.delimeter || '/';
   var topmost = options.topmost || '';
   var arrString = topmost ? topmost + delimeter : '';
   if(typeof arr[0][0] === 'undefined') {
      arrString += arr.join(',');
   }
   else {
      var outer = arr.map(function(inner) {
          var res = inner.map(function(innerpart) {
              return innerpart.join('!');
          })
          return res.join(',');
      });
      arrString += outer.join(options.delimeter);
   }
   return arrString;
}
urlparser.strArrayify = function(str, opt_options) {
   var options = opt_options || {};
   var delimeter = options.delimeter || '/';
   var topmostName = opt_options.topmostName || 'topmost';
   var arrName = opt_options.arrName || 'arr';
   var topmost = str.substring(0, str.indexOf(delimeter));
   var arrStr = str.substring(str.indexOf(delimeter) + 1);
   var arr = arrStr.split(delimeter).map(function(el) {
        return el.split('!');
   });
   var obj = {};
   obj[topmostName] = topmost;
   obj[arrName] = arr;
   return obj;
}
urlparser.strIntify = function(str, opt_options) {
    var options = opt_options || {};
    var delimiter = options.delimiter || ',';
    var arr = str.split(delimiter);
    var strToInt = arr.map(function(el) {
        return parseInt(el);
    });
    return strToInt;
}
urlparser.strBoolean = function(str) {
    if(str === "1") {
        return true;
    }
    else if(str === "0") {
        return false;
    }
    else {
        console.log("String is not 1 or 0");
        return false;
    }
}
urlparser.formatUrl = function(obj) {
    var url = Object.getOwnPropertyNames(obj).reduce(function(prev, current) {
        current = prev ? "&" + current + "=" + obj[current] : current + "=" + obj[current];
        return prev + current;
    }, "");
    return url;
}

module.exports = urlparser;
