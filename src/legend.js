/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var viewer = require('./viewer');
var utils = require('./utils');

var symbolSize = 20;
var styleSettings;
var dragging = false;

var mapMenu;
var hasMapLegend;

function init(opt_options) {
    var options = opt_options || {};

    hasMapLegend = options.hasOwnProperty('hasMapLegend') ? options.hasMapLegend : true;

    styleSettings = viewer.getStyleSettings();

    mapMenu = $('#mapmenu');
    $('#menutools').append('<li class="menu-item"><div class="menu-item-divider"></div><li>');
    addLegend(viewer.getGroups());

    mapMenu.on("touchmove", function() {
       dragging = true;
     });
     mapMenu.on("touchstart", function() {
       dragging = false;
     });
}
function getSymbol(style) {
    var symbol='';
    var s = style[0];
    if (s[0].hasOwnProperty('icon')) {
        var src = s[0].icon.src;
        // var scale = style.icon.scale || undefined;
        var format = s[0].format || 'png';
        if (format == 'png') {
            symbol = '<div class="legend-item-img"><img style="width: auto; height: 20px;" src="' + src + '"></div>'
        }
        else if (format == 'svg') {
            var o = '<object type="image/svg+xml" data="' + src + '" style="width: 20px;"></object>';
            var inlineStyle = 'background: url(' + src + ') no-repeat;width: 20px; height: 20px;background-size: 20px;';
            symbol = '<div class="legend-item-img">' + o + '</div>';
        }
    }
    else if (s[0].hasOwnProperty('fill')) {
        var fill = '';
        for(var i=0; i<s.length; i++) {
          fill += createFill(s[i]);
        }
        symbol += '<div class="legend-item-img"><svg height="' + symbolSize + '" width="' + symbolSize + '">';
        symbol += fill;
        symbol += '</svg></div>';
    }
    else if (s[0].hasOwnProperty('stroke')) {
        var stroke = '';
        for(var i=0; i<s.length; i++) {
          stroke += createStroke(s[i]);
        }
        symbol += '<div class="legend-item-img"><svg height="' + symbolSize + '" width="' + symbolSize + '">';
        symbol += stroke;
        symbol += '</svg></div>';
    }
    else if (s[0].hasOwnProperty('circle')) {
        var circle = '';
        for(var i=0; i<s.length; i++) {
          circle += createCircle(s[i]);
        }
        symbol += '<div class="legend-item-img"><svg height="' + symbolSize + '" width="' + symbolSize + '">';
        symbol += circle;
        symbol += '</svg></div>';
    }
    else if (s[0].hasOwnProperty('image')) {
        var src = s[0].image.src;
        var inlineStyle = 'background: url(' + src + ') no-repeat;width: 30px; height: 30px;background-size: 30px;';
        symbol = '<div class="legend-item-img" style="' + inlineStyle +'"></div>';
    }
    return symbol;
}
function createFill(fillProperties) {
        var f = fillProperties;
        var strokeWidth = 0;
        if(f.hasOwnProperty('stroke')) {
            strokeWidth = f.stroke.width >=3 ? 3 : f.stroke.width;
            var stroke = 'stroke:' + f.stroke.color + ';' || 'stroke:none;';
            stroke += 'stroke-width:' + strokeWidth + ';' || '';
            stroke += 'stroke-dasharray:' + f.stroke.lineDash + ';' || '';
        }
        var fillSize = symbolSize - 4; //-2-2
        var fill = '<rect x="2" y="2" rx="2" ry="2" width="' + fillSize + '" height="' + fillSize + '" ';
        fill += f.hasOwnProperty('fill') ? 'style="fill:' + f.fill.color + ';' : 'style="fill:none;';
        fill += stroke;
        fill += '"></rect>';
        return fill;
}
function createCircle(circleProperties) {
    var c = circleProperties.circle;
    var strokeWidth = 0;
    if(c.hasOwnProperty('stroke')) {
        strokeWidth = c.stroke.width >=3 ? 3 : c.stroke.width;
        var stroke = 'stroke:' + c.stroke.color + ';' || 'stroke:none;';
        stroke += 'stroke-width:' + strokeWidth + ';' || '';
    }
    var size = symbolSize/2;
    var fill = '<circle cx="' + size + '" cy="' + size + '" r="' + c.radius + '" ';
    fill += c.hasOwnProperty('fill') ? 'style="fill:' + c.fill.color + ';' : 'style="fill:none;';
    fill += stroke;
    fill += '"></circle>';
    return fill;
}
function createStroke(strokeProperties) {
    var s = strokeProperties;
    var strokeWidth = s.stroke.width > 4 ? 4 : s.stroke.width;
    strokeWidth = s.stroke.width < 2 ? 2 : strokeWidth;
    var stroke = '<line x1 = "2" y1= "' + (symbolSize-4).toString() + '" x2="' + (symbolSize-4).toString() + '" y2="2" ';
    stroke += 'style="';
    stroke += 'stroke:' + s.stroke.color + ';' || 'stroke:none;';
    stroke += 'stroke-width:' + strokeWidth + ';' || '';
    stroke += 'stroke-dasharray:' + s.stroke.lineDash + ';' || '';
    stroke += '"/>';
    return stroke;
}
function createLegendItem(layerid) {
    var layername = layerid.split('legend-').pop();
    var layer = viewer.getLayer(layername);
    var legendItem = '<li class="legend ' + layername + '" id="' + layerid + '"><div class ="legend-item"><div class="checkbox">' +
                        '<svg class="mdk-icon-fa-square-o"><use xlink:href="css/svg/fa-icons.svg#fa-square-o"></use></svg>' +
                        '<svg class="mdk-icon-fa-check-square-o"><use xlink:href="css/svg/fa-icons.svg#fa-check-square-o"></use></svg>' +
                    '</div>';
    legendItem +=  layer.get('styleName') ? getSymbol(styleSettings[layer.get('styleName')]) : '';
    var title = '<div class="legend-item-title">' + layer.get('title') + '</div></div></li>';
    legendItem += title;
    return legendItem;
}
function addLegend(groups) {
      var layers = viewer.getLayers();
      var legendGroup;
      var item = '';

      //Add legend groups
      var legend = '<div id="legendlist"><ul class="legendlist"></ul></div>';
      $('#mapmenu').append(legend);
      for (var i=0; i < groups.length; i++) {
          legendGroup ='<li>' +
                         '<ul id="group-' + groups[i].name + '" class="legend-group">' +
                            '<li class="legend-header"><div class="legend-item">' + groups[i].title +
                                    '<div class="icon-expand">' +
                                        '<svg class="mdk-icon-fa-chevron-right">' +
                                            '<use xlink:href="css/svg/fa-icons.svg#fa-chevron-right"></use>' +
                                        '</svg>' +
                                        '<svg class="mdk-icon-fa-chevron-down">' +
                                            '<use xlink:href="css/svg/fa-icons.svg#fa-chevron-down"></use>' +
                                        '</svg>' +
                                    '</div>' +
                                '</div></li>' +
                         '</ul>' +
                       '</li>';
          $('#legendlist .legendlist').append(legendGroup);
          if(groups[i].expanded == true) {
              $('#group-' + groups[i].name +' .icon-expand').addClass('icon-expand-true');
          }
          else{
              $('#group-' + groups[i].name +' .icon-expand').addClass('icon-expand-false');
              $('#group-' + groups[i].name).addClass('ul-expand-false');
          }
          //Event listener for tick layer
          $('#group-' + groups[i].name + ' .legend-header').on('touchend click', function(evt) {
              if (dragging){return;}
              toggleGroup($(this));
              evt.preventDefault();
          });
      }

      //Add map legend unless set to false
      if(hasMapLegend) {
          var mapLegend = '<div id="map-legend"><ul id="legend-overlay"><li class="legend hidden"><div class ="toggle-button toggle-button-max">' +
                              '<svg class="mdk-icon-fa-angle-double-down"><use xlink:href="css/svg/fa-icons.svg#fa-angle-double-down"></use></svg>' +
                              '<svg class="mdk-icon-fa-angle-double-up"><use xlink:href="css/svg/fa-icons.svg#fa-angle-double-up"></use></svg>' +
                          '</div></li><li><ul id="overlay-list"></li></ul></ul><ul id="map-legend-background"></ul></div>';
          $('#map').append(mapLegend);
      }


      //Add layers to legend
      for (var i=layers.length-1; i>=0; i--) {

        var name = (layers[i].get('name'));
        var title = '<div class="legend-item-title">' + layers[i].get('title') + '</div></div></li>';

        //Append layer to group in legend. Add to default group if not defined.
        if(layers[i].get('group') == 'background') {
          //Append background layers to menu
          item = '<li class="legend ' + name + '" id="' + name + '"><div class ="legend-item"><div class="checkbox"><svg class="mdk-icon-fa-check"><use xlink:href="css/svg/fa-icons.svg#fa-check"></use></svg></div>';
          item += title;
          $('#group-' + layers[i].get('group')).append(item);
          //Append background layers to map legend
          item = '<li class="legend ' + name + '" id="legend-' + name + '"><div class ="legend-item">'
          item += layers[i].get('styleName') ? getSymbol(styleSettings[layers[i].get('styleName')]) : '';
          item += '</div>';
          $('#map-legend-background').append(item);

        }
        else if(layers[i].get('group') && ((layers[i].get('group') != 'none'))) {
          item = '<li class="legend ' + name + '" id="' + name + '"><div class ="legend-item"><div class="checkbox">' +
                  '<svg class="mdk-icon-fa-square-o"><use xlink:href="css/svg/fa-icons.svg#fa-square-o"></use></svg>' +
                  '<svg class="mdk-icon-fa-check-square-o"><use xlink:href="css/svg/fa-icons.svg#fa-check-square-o"></use></svg>' +
                '</div>';
          item +=  layers[i].get('styleName') ? getSymbol(styleSettings[layers[i].get('styleName')]) : '';
          item += title;
          $('#group-' + layers[i].get('group')).append(item);
        }

        //Append class according to visiblity and if group is background
        if(layers[i].get('group') == 'background') {
          if(layers[i].getVisible()==true) {
            $('#' + name + ' .checkbox').addClass('check-true');
            $('#legend-' + name).addClass('check-true-img');
          }
          else {
            $('#' + name + ' .checkbox').addClass('check-false');
            $('#legend-' + name).addClass('check-false-img');
          }
        }
        else {
          if(layers[i].getVisible()==true) {
            $('.' + name + ' .checkbox').addClass('checkbox-true');
          }
          else {
            $('.' + name + ' .checkbox').addClass('checkbox-false');
          }
        }

        //Event listener for tick layer
        $('#' + name).on('touchend click', function(evt) {
          if (dragging){return;}
          $(this).each(function() {
            var that = this;
            toggleCheck($(that).attr("id"));
          });
          evt.preventDefault();
        });
        $('#legend-' + name).on('touchend click', function(evt) {
          $(this).each(function() {
            var that = this;
            toggleCheck($(that).attr("id"));
          });
          evt.preventDefault();
        });
      }
      //Toggle map legend
      $('#legend-overlay .toggle-button').on('touchend click', function(evt) {
        toggleOverlay();
        evt.preventDefault();
      });
}
function onToggleCheck(layername) {
    //Event listener for tick layer
    $('#' + layername).on('touchend click', function(evt) {
      $(this).each(function() {
        var that = this;
        toggleCheck($(that).attr("id"));
      });
      evt.preventDefault();
    });
}
function offToggleCheck(layername) {
    //Event listener for tick layer
    $('#' + layername).off('touchend click', function(evt) {
      $(this).each(function() {
        var that = this;
        toggleCheck($(that).attr("id"));
      });
      evt.preventDefault();
    });
}
    //Expand and minimize group
function toggleGroup(groupheader) {
    var group = groupheader.parent('.legend-group');
    var groupicon = $('#' + group.attr('id') + ' .icon-expand');
    if (groupicon.hasClass('icon-expand-false')) {
      groupicon.removeClass('icon-expand-false');
      groupicon.addClass('icon-expand-true');
      group.removeClass('ul-expand-false');
    }
    else {
      groupicon.removeClass('icon-expand-true');
      groupicon.addClass('icon-expand-false');
      group.addClass('ul-expand-false');
    }
}
//Toggle layers
function toggleCheck(layerid) {
    var layername = layerid.split('legend-').pop();
    var layer = viewer.getLayer(layername);
    //Radio toggle for background
    if(layer.get('group') == 'background') {
        var group = viewer.getGroup('background');
        for(var i=0; i<group.length; i++) {
            group[i].setVisible(false);
            $('#' + group[i].get('name') + ' .checkbox').removeClass('check-true');
            $('#' + group[i].get('name') + ' .checkbox').addClass('check-false');
            //map legend
            $('#legend-' + group[i].get('name')).removeClass('check-true-img');
            $('#legend-' + group[i].get('name')).addClass('check-false-img');
        }
        layer.setVisible(true);
        $('#' + layername + ' .checkbox').removeClass('check-false');
        $('#' + layername + ' .checkbox').addClass('check-true');
        //map legend
        $('#legend-' + layername).removeClass('check-false-img');
        $('#legend-' + layername).addClass('check-true-img');
    }
    //Toggle check for all groups except background
    else {
        if($('.' + layername + ' .checkbox').hasClass('checkbox-true')) {
            $('.' + layername + ' .checkbox').removeClass('checkbox-true');
            $('.' + layername + ' .checkbox').addClass('checkbox-false');
          layer.setVisible(false);
        }
        else {
            $('.' + layername + ' .checkbox').removeClass('checkbox-false');
            $('.' + layername + ' .checkbox').addClass('checkbox-true');
            layer.setVisible(true);
            layer.set('legend', true);
        }
    }
}
module.exports.init = init;
