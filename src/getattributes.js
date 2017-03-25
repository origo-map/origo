/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";
var $ = require('jquery');
var featureinfotemplates = require('./featureinfotemplates');
var replacer = require('../src/utils/replacer');
var runfunction = require('../src/utils/runfunction');
var geom = require('./geom');

module.exports = function(feature, layer) {
    var content = '<div><ul>';
    var attribute, li = '', title, val;
    //If layer is configured with attributes
    if(layer.get('attributes')) {
          //If attributes is string then use template named with the string
          if(typeof layer.get('attributes') === 'string') {
              //Use attributes with the template
              li = featureinfotemplates(layer.get('attributes'),feature.getProperties());
          }
          else {
              for(var i=0; i<layer.get('attributes').length; i++) {
                attribute = layer.get('attributes')[i];
                title = '';
                val = '';
                if (attribute['name']) {
                  if(feature.get(attribute['name'])) {
                      val = feature.get(attribute['name']);
                      if (attribute['title']) {
                        title = '<b>' + attribute['title'] + '</b>';
                      }
                      if (attribute['url']) {
                        if(feature.get(attribute['url'])) {
                        var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], replacer.replace(feature.get(attribute['url']), feature.getProperties()));
                        val = '<a href="' + url + '" target="_blank">' +
                              feature.get(attribute['name']) +
                              '</a>';
                        }
                      }
                      if (attribute['runFunction']) {
                        var title;
                        if (feature.get(attribute['functionParam'])) {	
                          var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], feature.get(attribute['functionParam']));								
                          val = '<a id="colorbox-link" href="#" ' + attribute['runFunction'] + '(\'' + url + '\');return false;">' + 
                                      feature.get(attribute['name']) +
                                      '</a>';
                        }
                        else if (feature.get(attribute['functionParam']) === undefined) {
                          var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], attribute['functionParam']);
                          val = '<a id="colorbox-link" href="#" ' + attribute['runFunction'] + '(\'' + url + '\');return false;">' + 
                                      feature.get(attribute['name']) +
                                      '</a>';
                        }
                        
                        $('body').on('click', '#colorbox-link', function() {
                          runfunction[attribute['runFunction']](url);
                        });
                      }
                  }
                }
                else if (attribute['url']) {
                    if(feature.get(attribute['url'])) {
                        var text = attribute['html'] || attribute['url'];
                        var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], replacer.replace(feature.get(attribute['url']), feature.getProperties()));
                        val = '<a href="' + url + '" target="_blank">' +
                              text +
                              '</a>';
                    }
                }
                else if (attribute['img']) {
                    if(feature.get(attribute['img'])) {
                        var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], replacer.replace(feature.get(attribute['img']), feature.getProperties()));
                        var attribution = attribute['attribution'] ? '<div class="o-image-attribution">' + attribute['attribution'] + '</div>' : '';
                        val = '<div class="o-image-container">' +
                                  '<img src="' + url + '">' + attribution +
                              '</div>';
                    }
                }
                else if (attribute['html']) {
                  if (attribute['runFunction'] && attribute['functionParam']) {
                    var title;
                    if (feature.get(attribute['functionParam'])) {	
                      var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], feature.get(attribute['functionParam']));								
                      val = '<a id="colorbox-link" href="#" ' + attribute['runFunction'] + '(\'' + url + '\');return false;">' + 
                                  attribute['html'] +
                                  '</a>';
                    }
                    else if (feature.get(attribute['functionParam']) === undefined) {
                      var url = createUrl(attribute['urlPrefix'], attribute['urlSuffix'], attribute['functionParam']);
                      val = '<a id="colorbox-link" href="#" ' + attribute['runFunction'] + '(\'' + url + '\');return false;">' + 
                                  attribute['name'] +
                                  '</a>';
                    }
                    
                    $('body').on('click', '#colorbox-link', function() {
                      runfunction[attribute['runFunction']](url);
                    });
                  } else {
                    val = replacer.replace(attribute['html'], feature.getProperties(), {
                      helper: geom,
                      helperArg: feature.getGeometry()
                    });
                  }
                }

                var cls = ' class="' + attribute['cls'] + '" ' || '';

                li += '<li' + cls +'>' + title + val + '</li>';
              }
        }
    }
    else {
      //Clean feature attributes from non-wanted properties
      var attributes = filterObject(feature.getProperties(), ['FID_', 'geometry']);
      //Use attributes with the template
      li = featureinfotemplates('default',attributes);
    }
    content += li + '</ul></div>';
    return content;
}
function filterObject(obj, excludedKeys) {
    var result = {}, key;
    for (key in obj) {
        if(excludedKeys.indexOf(key) === -1) {
            result[key] = obj[key];
        }
    }
    return result;
}
function createUrl(prefix, suffix, url) {
    var p = prefix || '';
    var s = suffix || '';
    return p + url + s;
}
