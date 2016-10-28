/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var viewer = require('./viewer');
var utils = require('./utils');
var modal = require('./modal');

var symbolSize = 20;
var styleSettings;

var mapMenu;
var hasMapLegend;

function init(opt_options) {
    var options = opt_options || {};

    hasMapLegend = options.hasOwnProperty('hasMapLegend') ? options.hasMapLegend : true;

    styleSettings = viewer.getStyleSettings();

    mapMenu = $('#o-mapmenu');
    $('#o-menutools').append('<li class="o-menu-item"><div class="o-menu-item-divider"></div><li>');
    addLegend(viewer.getGroups());
}

function getSymbol(style) {
  var symbol='';
  var s = style[0];

  if (s[0].hasOwnProperty('icon')) {
    var src = s[0].icon.src;
    // var scale = style.icon.scale || undefined;
    var format = s[0].format || 'png';
    if (format == 'png') {
      symbol = '<div class="o-legend-item-img"><img style="width: auto; height: 20px;" src="' + src + '"></div>'
    } else if (format == 'svg') {
      var o = '<object type="image/svg+xml" data="' + src + '" style="width: 20px;"></object>';
      var inlineStyle = 'background: url(' + src + ') no-repeat;width: 20px; height: 20px;background-size: 20px;';
      symbol = '<div class="o-legend-item-img">' + o + '</div>';
    }
  } else if (s[0].hasOwnProperty('fill')) {
    var fill = '';

    s.forEach(function(style){
      fill += createFill(style);
    });

    symbol += '<div class="o-legend-item-img"><svg height="' + symbolSize + '" width="' + symbolSize + '">';
    symbol += fill;
    symbol += '</svg></div>';
  } else if (s[0].hasOwnProperty('stroke')) {
    var stroke = '';

    s.forEach(function(style){
      stroke += createStroke(style);
    });

    symbol += '<div class="o-legend-item-img"><svg height="' + symbolSize + '" width="' + symbolSize + '">';
    symbol += stroke;
    symbol += '</svg></div>';
  } else if (s[0].hasOwnProperty('circle')) {
    var circle = '';

    s.forEach(function(style){
      circle += createCircle(style);
    });

    symbol += '<div class="o-legend-item-img"><svg height="' + symbolSize + '" width="' + symbolSize + '">';
    symbol += circle;
    symbol += '</svg></div>';
  } else if (s[0].hasOwnProperty('image')) {
    var src = s[0].image.src;
    var inlineStyle = 'background: url(' + src + ') no-repeat;width: 30px; height: 30px;background-size: 30px;';
    symbol = '<div class="o-legend-item-img" style="' + inlineStyle +'"></div>';
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

function addInfoTextButton(item) {
  var infoTextButton =  '<div class="o-legend-item-info o-infotext" id="o-legend-item-info-' + item + '">' +
                          '<svg class="o-icon-fa-info-circle"><use xlink:href="css/svg/fa-icons.svg#fa-info-circle"></use></svg>' +
                        '</div>';
  return infoTextButton;
}

function createLegendItem(layerid, layerStyle, inSubgroup) {
  var layername = layerid.split('o-legend-').pop();
  var layer = viewer.getLayer(layername);
  var subClass = inSubgroup ? ' o-legend-subitem' : '';
  var legendItem = '';

  if (layerStyle && layerStyle[0][0].hasOwnProperty('filter')) {
    legendItem += '<li class="o-legend ' + layername + '">' +
                    '<ul id="o-subgroup-' + layername + '" class="o-legend-subgroup o-ul-expand-false">' +
                      '<li class="' + layername + '" id="' + layerid + '">';
    legendItem += '<div class ="o-legend-item' + subClass + '"><div class="o-checkbox">' +
                    '<svg class="o-icon-fa-square-o"><use xlink:href="css/svg/fa-icons.svg#fa-square-o"></use></svg>' +
                    '<svg class="o-icon-fa-check-square-o"><use xlink:href="css/svg/fa-icons.svg#fa-check-square-o"></use></svg>' +
                  '</div>';
    legendItem += '<div class="o-legend-item-title">' + layer.get('title') + '</div>';

    if(layer.get('infotext')){
      legendItem += addInfoTextButton(layername);
    }

    if (layerStyle[0][0].hasOwnProperty('legend')) {
      legendItem += '<div class="o-subicon-expand o-subicon-expand-false">' +
                      '<svg class="o-icon-fa-chevron-right">' +
                        '<use xlink:href="css/svg/fa-icons.svg#fa-angle-double-right"></use>' +
                      '</svg>' +
                      '<svg class="o-icon-fa-chevron-down">' +
                        '<use xlink:href="css/svg/fa-icons.svg#fa-angle-double-down"></use>' +
                      '</svg>' +
                    '</div>';
      legendItem += '</div></li>';

      layerStyle.forEach(function (styleArray) {
        legendItem += '<li class="o-legend ' + layername + '" id="o-subgroup-' + layername + '"><div class ="o-legend-subitem">';
        legendItem += '<div class="o-checkbox o-checkbox-false"></div>';
        legendItem += layer.get('styleName') ? getSymbol([styleArray]) : '';
        legendItem += '<div class="o-legend-subitem-title">' + styleArray[0].legend + '</div></div></li>';
      });
    }

    legendItem += '</ul></li>'
  } else {
    legendItem += '<li class="o-legend ' + layername + '" id="' + layerid + '"><div class ="o-legend-item' + subClass + '"><div class="o-checkbox">' +
                    '<svg class="o-icon-fa-square-o"><use xlink:href="css/svg/fa-icons.svg#fa-square-o"></use></svg>' +
                    '<svg class="o-icon-fa-check-square-o"><use xlink:href="css/svg/fa-icons.svg#fa-check-square-o"></use></svg>' +
                  '</div>';
    legendItem +=  layer.get('styleName') ? getSymbol(styleSettings[layer.get('styleName')]) : '';
    legendItem += '<div class="o-legend-item-title">' + layer.get('title') + '</div>';

    if(layer.get('infotext')){
      legendItem += addInfoTextButton(layername);
    }

    legendItem += '</div></li>';
  }

  return legendItem;
}

function createSubGroup(subgroups, parentGroup, subIndent, n) {
  if (n >= subgroups.length) {
    return;
  } else {
    var infotext = '';
    var subGroupName=subgroups[n].name;

    if (subgroups[n].infotext) {
      infotext += addInfoTextButton(name);
    }

    var legendSubGroup = '<li class="o-legend ' + subGroupName + ' o-top-item" id="' + subGroupName + '">' +
                          '<ul id="o-subgroup-' + subGroupName + '" class="o-legend-subgroup '+ subIndent + '">' +
                            '<li class="o-legend-subheader ' + subGroupName + '" id="' + subGroupName + '"><div class="o-legend-item">' +
                              '<div class="o-checkbox">' +
                                '<svg class="o-icon-fa-square-o"><use xlink:href="css/svg/fa-icons.svg#fa-square-o"></use></svg>' +
                                '<svg class="o-icon-fa-check-square-o"><use xlink:href="css/svg/fa-icons.svg#fa-check-square-o"></use></svg>' +
                              '</div>' + subgroups[n].title +
                              '<div class="o-subicon-expand">' +
                                '<svg class="o-icon-fa-chevron-right"><use xlink:href="css/svg/fa-icons.svg#fa-angle-double-right"></use></svg>' +
                                '<svg class="o-icon-fa-chevron-down"><use xlink:href="css/svg/fa-icons.svg#fa-angle-double-down"></use></svg>' +
                              '</div>' +  infotext +
                            '</div></li>' +
                          '</ul>' +
                        '</li>';
    parentGroup.append(legendSubGroup);

    if (subgroups[n].expanded == true) {
      $('#o-subgroup-' + subGroupName +' .o-subicon-expand').addClass('o-subicon-expand-true');
      $('#o-subgroup-' + subGroupName +' .o-checkbox').addClass('o-checkbox-false');
    } else {
      $('#o-subgroup-' + subGroupName +' .o-subicon-expand').addClass('o-subicon-expand-false');
      $('#o-subgroup-' + subGroupName +' .o-checkbox').addClass('o-checkbox-false');
      $('#o-subgroup-' + subGroupName).addClass('o-ul-expand-false');
    }

    $('#o-subgroup-' + subGroupName + ' .o-legend-subheader').on('click', function(evt) {

      if ($(evt.target).closest('div').hasClass('o-checkbox')) {
        toggleSubGroupCheck($(this).parent(), true);
      } else if ($(evt.target).closest('div').hasClass('o-infotext')) {

        $(this).each(function() {
          var that = this;
          showInfoText($(that).attr("id"));
        });

      } else {
        toggleSubGroup($(this));
      }

      evt.preventDefault();
    });

    if (subgroups[n].hasOwnProperty('subgroups')) {
      createSubGroup(subgroups[n].subgroups, $('#o-subgroup-' + subgroups[n].name), 'o-sub-indent', 0);
    }

    createSubGroup(subgroups, parentGroup, subIndent, n+1);
  }
}

function addLegend(groups) {
  var layers = viewer.getMap().getLayers().getArray();
  var legendGroup;
  var overlayGroup;
  var item = '';

  //Add legend groups
  var legend = '<div id="o-legendlist"><ul class="o-legendlist"></ul></div>';
  $('#o-mapmenu').append(legend);

  groups.forEach(function(group) {

    if (group.hasOwnProperty('overlayGroup')) {
      overlayGroup = group.name;
    }

    legendGroup = '<li>' +
                    '<ul id="o-group-' + group.name + '" class="o-legend-group">' +
                      '<li class="o-legend-header"><div class="o-legend-item">' + group.title +
                        '<div class="o-icon-expand">' +
                          '<svg class="o-icon-fa-chevron-right">' +
                            '<use xlink:href="css/svg/fa-icons.svg#fa-chevron-right"></use>' +
                          '</svg>' +
                          '<svg class="o-icon-fa-chevron-down">' +
                            '<use xlink:href="css/svg/fa-icons.svg#fa-chevron-down"></use>' +
                          '</svg>' +
                        '</div>' +
                      '</div></li>' +
                    '</ul>' +
                  '</li>';
    $('#o-legendlist .o-legendlist').append(legendGroup);

    if(group.expanded == true) {
      $('#o-group-' + group.name +' .o-icon-expand').addClass('o-icon-expand-true');
    } else {
      $('#o-group-' + group.name +' .o-icon-expand').addClass('o-icon-expand-false');
      $('#o-group-' + group.name).addClass('o-ul-expand-false');
    }

    //Event listener for tick layer
    $('#o-group-' + group.name + ' .o-legend-header').on('click', function(evt) {
      toggleGroup($(this));
      evt.preventDefault();
    });

    if (group.hasOwnProperty('subgroups')) {
      createSubGroup(group.subgroups, $('#o-group-' + group.name), '', 0);
    }
  });

  //Add map legend unless set to false
  if(hasMapLegend) {
    var mapLegend = '<div id="o-map-legend"><ul id="o-legend-overlay"><li class="o-legend o-hidden"><div class ="o-toggle-button o-toggle-button-max">' +
                        '<svg class="o-icon-fa-angle-double-down"><use xlink:href="css/svg/fa-icons.svg#fa-angle-double-down"></use></svg>' +
                        '<svg class="o-icon-fa-angle-double-up"><use xlink:href="css/svg/fa-icons.svg#fa-angle-double-up"></use></svg>' +
                    '</div></li><li><ul id="o-overlay-list"></li></ul></ul><ul id="o-map-legend-background"></ul></div>';
    $('#o-map').append(mapLegend);

    //Add divider to map legend if not only background
    if(overlayGroup) {
      $('#o-map-legend-background').prepend('<div class="o-legend-item-divider"></div>');
    };
  }

  //Add layers to legend
  layers.forEach(function(layer) {

    var name = (layer.get('name'));
    var layerStyle = styleSettings[layer.get('styleName')];
    var title = '<div class="o-legend-item-title">' + layer.get('title') + '</div>';

    //Add infotext button
    if(layer.get('infotext')){
      title += addInfoTextButton(name);
    }
    title += '</div></li>';

    //Append layer to group in legend. Add to default group if not defined.
    if(layer.get('group') == 'background') {

      //Append background layers to menu
      item = '<li class="o-legend ' + name + '" id="' + name + '"><div class ="o-legend-item"><div class="o-checkbox"><svg class="o-icon-fa-check"><use xlink:href="css/svg/fa-icons.svg#fa-check"></use></svg></div>';
      item += title;
      $('#o-group-background .o-legend-header').after(item);

      //Append background layers to map legend
      item = '<li class="o-legend ' + name + '" id="o-legend-' + name + '"><div class ="o-legend-item">'
      item += layer.get('styleName') ? getSymbol(styleSettings[layer.get('styleName')]) : '';
      item += '</div>';
      $('#o-map-legend-background').prepend(item);

    } else if(layer.get('group') && ((layer.get('group') != 'none'))) {

      //Append layer to subgroup
      if (layer.get('subgroup')) {
        item = createLegendItem(name, layerStyle, true);
        if ($('#o-subgroup-' + layer.get('subgroup')).find('li.o-top-item:last').length) {
          $('#o-subgroup-' + layer.get('subgroup')).find('li.o-top-item:last').after(item);
        } else {
          $('#o-subgroup-' + layer.get('subgroup') + ' .o-legend-subheader').after(item);
        }
      } else { //Append layer to group
        item = createLegendItem(name, layerStyle, false);
        if ($('#o-group-' + layer.get('group')).find('li.o-top-item:last').length) {
          $('#o-group-' + layer.get('group')).find('li.o-top-item:last').after(item);
        } else {
          $('#o-group-' + layer.get('group') + ' .o-legend-header').after(item);
        }
      }

      if(layer.get('legend') == true || layer.getVisible(true)) {
        //Append to map legend
        item = '<li class="o-legend ' + name + '" id="o-legend-' + name + '"><div class ="o-legend-item"><div class="o-checkbox">' +
                '<svg class="o-icon-fa-square-o"><use xlink:href="css/svg/fa-icons.svg#fa-square-o"></use></svg>' +
                '<svg class="o-icon-fa-check-square-o"><use xlink:href="css/svg/fa-icons.svg#fa-check-square-o"></use></svg>' +
              '</div>';
        item += layer.get('styleName') ? getSymbol(styleSettings[layer.get('styleName')]) : '';
        item += title;
        $('#o-overlay-list').append(item);
      }
    }

    //Check map legend to make sure minimize button appears
    checkToggleOverlay();

    //Append class according to visiblity and if group is background
    if (layer.get('group') == 'background') {
      if (layer.getVisible()==true) {
        $('#' + name + ' .o-checkbox').addClass('o-check-true');
        $('#o-legend-' + name).addClass('o-check-true-img');
      } else {
        $('#' + name + ' .o-checkbox').addClass('o-check-false');
        $('#o-legend-' + name).addClass('o-check-false-img');
      }
    } else {
      if (layer.getVisible()==true) {
        $('.' + name + ' .o-checkbox').addClass('o-checkbox-true');

        $('#o-group-' + layer.get('group') +' .o-icon-expand').removeClass('o-icon-expand-false');
        $('#o-group-' + layer.get('group') +' .o-icon-expand').addClass('o-icon-expand-true');
        $('#o-group-' + layer.get('group')).removeClass('o-ul-expand-false');

        if (layer.get('subgroup')) {
          var subGroupName = layer.get('subgroup');
          $('#o-subgroup-' + subGroupName +' li#' + subGroupName).find('.o-subicon-expand').removeClass('o-subicon-expand-false');
          $('#o-subgroup-' + subGroupName +' li#' + subGroupName).find('.o-subicon-expand').addClass('o-subicon-expand-true');
          $('#o-subgroup-' + subGroupName).removeClass('o-ul-expand-false');

          $('#o-subgroup-' + subGroupName).parents('ul .o-legend-subgroup li:first').find('.o-subicon-expand').removeClass('o-subicon-expand-false');
          $('#o-subgroup-' + subGroupName).parents('ul .o-legend-subgroup li:first').find('.o-subicon-expand').addClass('o-subicon-expand-true');
          $('#o-subgroup-' + subGroupName).parents('ul .o-legend-subgroup').removeClass('o-ul-expand-false');

          toggleSubGroupCheck($('#' + name).parents('ul').has('.o-legend-subheader').first(), false);
        }

      } else {
        $('.' + name + ' .o-checkbox').addClass('o-checkbox-false');
      }
    }

    //Event listener for tick layer
    $('#' + name).on('click', function(evt) {
      if ($(evt.target).closest('div').hasClass('o-subicon-expand')) {
        toggleSubGroup($(this));
      } else {
        $(this).each(function() {
          var that = this;
          toggleCheck($(that).attr("id"));
        });

        evt.preventDefault();
      }
    });

    $('#o-legend-' + name).on('click', function(evt) {
      $(this).each(function() {
        var that = this;
        toggleCheck($(that).attr("id"));
      });

      evt.preventDefault();
    });

    if(layer.get('infotext')){
      $('#' + name + ' .o-infotext').on('click', function(evt) {
        $(this).each(function() {
          var that = this;
          showInfoText($(that).attr("id"));
        });

        evt.preventDefault();
        evt.stopPropagation();
      });
    };
  });

  //Toggle map legend
  $('#o-legend-overlay .o-toggle-button').on('click', function(evt) {
    toggleOverlay();
    evt.preventDefault();
  });
}

function onToggleCheck(layername) {
  //Event listener for tick layer
  $('#' + layername).on('click', function(evt) {
    $(this).each(function() {
      var that = this;
      toggleCheck($(that).attr("id"));
    });
    evt.preventDefault();
  });
}

function offToggleCheck(layername) {
  //Event listener for tick layer
  $('#' + layername).off('click', function(evt) {
    $(this).each(function() {
      var that = this;
      toggleCheck($(that).attr("id"));
    });

    evt.preventDefault();
  });
}

//Expand and minimize group
function toggleGroup(groupheader) {
  var group = groupheader.parent('.o-legend-group');
  var groupicon = $('#' + group.attr('id') + ' .o-icon-expand');

  if (groupicon.hasClass('o-icon-expand-false')) {
    groupicon.removeClass('o-icon-expand-false');
    groupicon.addClass('o-icon-expand-true');
    group.removeClass('o-ul-expand-false');
  } else {
    groupicon.removeClass('o-icon-expand-true');
    groupicon.addClass('o-icon-expand-false');
    group.addClass('o-ul-expand-false');
  }
}

//Expand and minimize subgroup
function toggleSubGroup(subgroupheader) {
  var subgroup = subgroupheader.parent('.o-legend-subgroup');
  var subgroupicon = $('#' + subgroup.attr('id') + ' .o-subicon-expand:first');

  if (subgroup.hasClass('o-ul-expand-false')) {
    subgroupicon.removeClass('o-subicon-expand-false');
    subgroupicon.addClass('o-subicon-expand-true');
    subgroup.removeClass('o-ul-expand-false');
  } else {
    subgroupicon.removeClass('o-subicon-expand-true');
    subgroupicon.addClass('o-subicon-expand-false');
    subgroup.addClass('o-ul-expand-false');
  }
}

//Toggle subgroups
function toggleSubGroupCheck(subgroup, toggleAll) {
  var subGroup = $(subgroup);
  var subLayers = subGroup.find('.o-legend-item.o-legend-subitem');
  var groupList = $('.o-legend-subgroup');

  if (toggleAll) {

    subLayers.each(function() {
      var layername = $(this).parent().attr('id');
      var layer = viewer.getLayer(layername);
      var layerid = $(this).parent().attr('class');
      var inMapLegend = layerid.split('o-legend-').length > 1 ? true : false;

      if (subGroup.children().first().find('.o-checkbox').hasClass('o-checkbox-true')) {
        $('.' + layername + ' .o-checkbox').removeClass('o-checkbox-true');
        $('.' + layername + ' .o-checkbox').addClass('o-checkbox-false');

        if (inMapLegend == false) {
          offToggleCheck('o-legend-' + layername);
          $('#o-legend-' + layername).remove();
          layer.set('legend', false);
          checkToggleOverlay();
        }

        layer.setVisible(false);
      } else {

        if (inMapLegend == false && $('#o-legend-' + layername).length == 0) {
          $('#o-overlay-list').append(createLegendItem('o-legend-' + layername));
          onToggleCheck('o-legend-' + layername);
          checkToggleOverlay();
        }

        $('.' + layername + ' .o-checkbox').removeClass('o-checkbox-false');
        $('.' + layername + ' .o-checkbox').addClass('o-checkbox-true');
        layer.setVisible(true);
        layer.set('legend', true);
      }
    });
  }

  groupList.each(function() {
    var subList = $(this).find('.o-legend-item.o-legend-subitem').has('.o-checkbox');
    var subListChecked = $(this).find('.o-legend-item.o-legend-subitem').has('.o-checkbox.o-checkbox-true');

    if (subListChecked.length) {
      $(this).children().first().find('.o-checkbox').removeClass('o-checkbox-false');
      $(this).children().first().find('.o-checkbox').addClass('o-checkbox-true');

      if (subList.length != subListChecked.length) {
        $(this).children().first().find('.o-checkbox').addClass('o-checkbox-semi');
      } else {
        $(this).children().first().find('.o-checkbox').removeClass('o-checkbox-semi');
      }

    } else {
      $(this).children().first().find('.o-checkbox').removeClass('o-checkbox-true');
      $(this).children().first().find('.o-checkbox').removeClass('o-checkbox-semi');
      $(this).children().first().find('.o-checkbox').addClass('o-checkbox-false');
    }
  });
}

//Toggle layers
function toggleCheck(layerid) {
  var layername = layerid.split('o-legend-').pop();
  var inMapLegend = layerid.split('o-legend-').length > 1 ? true : false;
  var layer = viewer.getLayer(layername);

  //Radio toggle for background
  if (layer.get('group') == 'background') {
    var groups = viewer.getGroup('background');

    groups.forEach(function(group) {
      group.setVisible(false);
      $('#' + group.get('name') + ' .o-checkbox').removeClass('o-check-true');
      $('#' + group.get('name') + ' .o-checkbox').addClass('o-check-false');
      //map legend
      $('#o-legend-' + group.get('name')).removeClass('o-check-true-img');
      $('#o-legend-' + group.get('name')).addClass('o-check-false-img');
    });

    layer.setVisible(true);
    $('#' + layername + ' .o-checkbox').removeClass('o-check-false');
    $('#' + layername + ' .o-checkbox').addClass('o-check-true');
    //map legend
    $('#o-legend-' + layername).removeClass('o-check-false-img');
    $('#o-legend-' + layername).addClass('o-check-true-img');
  } else { //Toggle check for all groups except background

    if ($('.' + layername + ' .o-checkbox').hasClass('o-checkbox-true')) {
      $('.' + layername + ' .o-checkbox').removeClass('o-checkbox-true');
      $('.' + layername + ' .o-checkbox').addClass('o-checkbox-false');

      if (inMapLegend == false) {
        offToggleCheck('o-legend-' + layername);
        $('#o-legend-' + layername).remove();
        layer.set('legend', false);
        checkToggleOverlay();
      }

      layer.setVisible(false);
    } else {

      if (inMapLegend == false && $('#o-legend-' + layername).length == 0) {
        $('#o-overlay-list').append(createLegendItem('o-legend-' + layername));
        onToggleCheck('o-legend-' + layername);
        checkToggleOverlay();
      }

      $('.' + layername + ' .o-checkbox').removeClass('o-checkbox-false');
      $('.' + layername + ' .o-checkbox').addClass('o-checkbox-true');
      layer.setVisible(true);
      layer.set('legend', true);
    }

    if ($('#' + layername).find('.o-legend-subitem').length > 0) {
      toggleSubGroupCheck($('#' + layername).parents('ul').has('.o-legend-subheader').first(), false);
    }
  }
}

function checkToggleOverlay() {
  if($('#o-overlay-list li').length > 1 && $('#o-legend-overlay >li:first-child').hasClass('o-hidden')) {
    $('#o-legend-overlay > li:first-child').removeClass('o-hidden');
  } else if($('#o-overlay-list li').length < 2) {
    $('#o-legend-overlay > li:first-child').addClass('o-hidden');

    if($('#o-overlay-list').length == 1 && $('#o-overlay-list').hasClass('o-hidden')) {
      $('#o-overlay-list').removeClass('o-hidden');
      toggleOverlay();
    }
  }
}

function toggleOverlay() {
  if($('#o-legend-overlay .o-toggle-button').hasClass('o-toggle-button-max')) {
    $('#o-legend-overlay .o-toggle-button').removeClass('o-toggle-button-max');
    $('#o-legend-overlay .o-toggle-button').addClass('o-toggle-button-min');
    $('#o-overlay-list').addClass('o-hidden');
  } else {
    $('#o-legend-overlay .o-toggle-button').removeClass('o-toggle-button-min');
    $('#o-legend-overlay .o-toggle-button').addClass('o-toggle-button-max');
    $('#o-overlay-list').removeClass('o-hidden');
  }
}

//Set content for info button popup
function showInfoText(layerid) {
  var layer;
  var layername = layerid.split('o-legend-item-info-').pop();
  var infotext = {
    title: '',
    content: ''
  };

  //If info button is connected to layer
  if (viewer.getLayer(layername)) {
    layer = viewer.getLayer(layername);
    infotext.title = layer.get('title');
    infotext.content = layer.get('infotext');
  } else { // If info button is connected to subgroup
    var subgroups = viewer.getSubgroups();

    var group = $.grep(subgroups, function(obj) {
      return (obj.name == layername);
    });

    infotext.title = group[0].title;
    infotext.content = group[0].infotext
  }

  modal.createModal('#o-map', {title: infotext.title, content: infotext.content});
  modal.showModal();
}

module.exports.init = init;
