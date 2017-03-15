/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var viewer = require('./viewer');
var utils = require('./utils');
var modal = require('./modal');
var validateUrl = require('./utils/validateurl');

var symbolSize = 20;
var styleSettings;
var baseUrl;
var hasMapLegend;

function init(opt_options) {
  var options = opt_options || {};

  baseUrl = viewer.getBaseUrl();
  hasMapLegend = options.hasOwnProperty('hasMapLegend') ? options.hasMapLegend : true;
  styleSettings = viewer.getStyleSettings();

  render();
  addLegend(viewer.getGroups('top'));
}

function render() {
  $('#o-menutools').append('<li class="o-menu-item"><div class="o-menu-item-divider"></div><li>');
}

function getSymbol(style) {
  var symbol='';
  var s = style[0];
  if (s[0].hasOwnProperty('icon')) {
    var src = validateUrl(s[0].icon.src, baseUrl);
    // var scale = style.icon.scale || undefined;
    var format = s[0].format || 'png';
    if (format == 'png') {
      symbol = '<div class="o-legend-item-img"><img style="width: auto; height: 20px;" src="' + src + '"></div>'
    }
    else if (format == 'svg') {
      var o = '<object type="image/svg+xml" data="' + src + '" style="width: 20px;"></object>';
      var inlineStyle = 'background: url(' + src + ') no-repeat;width: 20px; height: 20px;background-size: 20px;';
      symbol = '<div class="o-legend-item-img">' + o + '</div>';
    }
  }
  else if (s[0].hasOwnProperty('fill')) {
    var fill = '';
    for(var i=0; i<s.length; i++) {
      fill += createFill(s[i]);
    }
    symbol += '<div class="o-legend-item-img"><svg height="' + symbolSize + '" width="' + symbolSize + '">';
    symbol += fill;
    symbol += '</svg></div>';
  }
  else if (s[0].hasOwnProperty('stroke')) {
    var stroke = '';
    for(var i=0; i<s.length; i++) {
      stroke += createStroke(s[i]);
    }
    symbol += '<div class="o-legend-item-img"><svg height="' + symbolSize + '" width="' + symbolSize + '">';
    symbol += stroke;
    symbol += '</svg></div>';
  }
  else if (s[0].hasOwnProperty('circle')) {
    var circle = '';
    for(var i=0; i<s.length; i++) {
      circle += createCircle(s[i]);
    }
    symbol += '<div class="o-legend-item-img"><svg height="' + symbolSize + '" width="' + symbolSize + '">';
    symbol += circle;
    symbol += '</svg></div>';
  }
  else if (s[0].hasOwnProperty('image')) {
    var src = validateUrl(s[0].image.src, baseUrl);
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

function addAbstractButton(item) {
  var infoTextButton =  '<div class="o-legend-item-info o-abstract" id="o-legend-item-info-' + item + '">' +
                          '<svg class="o-icon-fa-info-circle"><use xlink:href="#fa-info-circle"></use></svg>' +
                        '</div>';
  return infoTextButton;
}

function createLegendItem(layerid, layerStyle, inSubgroup) {
  var layername = layerid.split('o-legend-').pop();
  var layer = viewer.getLayer(layername);
  var subClass = inSubgroup ? ' o-legend-subitem' : '';
  var legendItem = '';

  if (layerStyle && layerStyle[0][0].hasOwnProperty('filter')) {

    if (layerStyle[0][0].hasOwnProperty('legend')) {
      legendItem += '<li class="o-legend ' + layername + '">';
      legendItem += '<ul id="o-group-' + layername + '" class="o-legend-group o-ul-expand-false"><li class="' + layername + '" id="' + layerid + '">';
    } else {
      legendItem += '<li class="o-legend ' + layername + '" id="' + layerid + '">';
    }

    legendItem += '<div class ="o-legend-item' + subClass + '"><div class="o-checkbox">' +
                    '<svg class="o-icon-fa-square-o"><use xlink:href="#fa-square-o"></use></svg>' +
                    '<svg class="o-icon-fa-check-square-o"><use xlink:href="#fa-check-square-o"></use></svg>' +
                  '</div>';
    legendItem += '<div class="o-legend-item-title o-truncate">' + layer.get('title') + '</div>';

    if(layer.get('abstract')){
      legendItem += addAbstractButton(layername);
    }

    if (layerStyle[0][0].hasOwnProperty('legend')) {
      legendItem += '<div class="o-icon-expand o-icon-expand-false">' +
                      '<svg class="o-icon-fa-chevron-right">' +
                        '<use xlink:href="#fa-angle-double-right"></use>' +
                      '</svg>' +
                      '<svg class="o-icon-fa-chevron-down">' +
                        '<use xlink:href="#fa-angle-double-down"></use>' +
                      '</svg>' +
                    '</div>';
      legendItem += '</div></li>';

      layerStyle.forEach(function (styleArray) {
        legendItem += '<li class="o-legend ' + layername + '" id="' + layername + '"><div class ="o-legend-subitem">';
        legendItem += '<div class="o-checkbox o-checkbox-false"></div>';
        legendItem += layer.get('styleName') ? getSymbol([styleArray]) : '';
        legendItem += '<div class="o-legend-subitem-title">' + styleArray[0].legend + '</div></div></li>';
      });

      legendItem += '</ul></li>'
    }
  } else {
    legendItem += '<li class="o-legend ' + layername + '" id="' + layerid + '"><div class ="o-legend-item' + subClass + '"><div class="o-checkbox">' +
                    '<svg class="o-icon-fa-square-o"><use xlink:href="#fa-square-o"></use></svg>' +
                    '<svg class="o-icon-fa-check-square-o"><use xlink:href="#fa-check-square-o"></use></svg>' +
                  '</div>';
    legendItem +=  layer.get('styleName') ? getSymbol(styleSettings[layer.get('styleName')]) : '';
    legendItem += '<div class="o-legend-item-title o-truncate">' + layer.get('title') + '</div>';

    if(layer.get('abstract')){
      legendItem += addAbstractButton(layername);
    }

    legendItem += '</div></li>';
  }

  return legendItem;
}

function createGroup(group, parentGroup) {
  var legendGroup;
  var overlayGroup;
  var abstract = '';

  if (group.hasOwnProperty('overlayGroup')) {
    overlayGroup = group.name;
  }

  if (group.abstract) {
    abstract += addAbstractButton(group.name);
  }

  if (parentGroup) {
    var indent = $(parentGroup).parent().closest('ul').hasClass('o-legend-group') ? 'o-legend-indent' : '';

    legendGroup = '<li class="o-legend ' + group.name + ' o-top-item" id="' + group.name + '">' +
                    '<ul id="o-group-' + group.name + '" class="o-legend-group o-legend-subgroup ' + indent +'">' +
                      '<li class="o-legend-header o-legend-subheader ' + group.name + '" id="' + group.name + '"><div class="o-legend-item">' +
                        '<div class="o-checkbox">' +
                          '<svg class="o-icon-fa-square-o"><use xlink:href="#fa-square-o"></use></svg>' +
                          '<svg class="o-icon-fa-check-square-o"><use xlink:href="#fa-check-square-o"></use></svg>' +
                        '</div>' +
                        '<div class="o-legend-subgroup-title o-truncate">' +
                          group.title +
                        '</div>' +
                        '<div class="o-icon-expand">' +
                          '<svg class="o-icon-fa-chevron-right"><use xlink:href="#fa-angle-double-right"></use></svg>' +
                          '<svg class="o-icon-fa-chevron-down"><use xlink:href="#fa-angle-double-down"></use></svg>' +
                        '</div>' + abstract +
                      '</div></li>' +
                    '</ul>' +
                  '</li>';
    parentGroup.append(legendGroup);
  } else {
    legendGroup = '<li>' +
                    '<ul id="o-group-' + group.name + '" class="o-legend-group">' +
                      '<li class="o-legend-header"><div class="o-legend-item">' + group.title +
                        '<div class="o-icon-expand">' +
                          '<svg class="o-icon-fa-chevron-right"><use xlink:href="#fa-chevron-right"></use></svg>' +
                          '<svg class="o-icon-fa-chevron-down"><use xlink:href="#fa-chevron-down"></use></svg>' +
                        '</div>' + abstract +
                      '</div></li>' +
                    '</ul>' +
                  '</li>';
    $('#o-legendlist .o-legendlist').append(legendGroup);
  }

  if (group.expanded == true) {
    $('#o-group-' + group.name +' .o-icon-expand').addClass('o-icon-expand-true');
    $('#o-group-' + group.name +' .o-checkbox').addClass('o-checkbox-false');
  } else {
    $('#o-group-' + group.name +' .o-icon-expand').addClass('o-icon-expand-false');
    $('#o-group-' + group.name +' .o-checkbox').addClass('o-checkbox-false');
    $('#o-group-' + group.name).addClass('o-ul-expand-false');
  }

  $('#o-group-' + group.name + ' .o-legend-header').on('click', function(evt) {

    if ($(evt.target).closest('div').hasClass('o-checkbox')) {
      toggleSubGroupCheck($(this).parent(), true);
    } else if ($(evt.target).closest('div').hasClass('o-abstract')) {

    } else {
      toggleGroup($(this));
    }

    evt.preventDefault();
  });

  if (group.hasOwnProperty('groups')) {
    group.groups.forEach(function(subgroup) {
      createGroup(subgroup, $('#o-group-' + group.name));
    });
  }
}

function addLegend(groups) {
  var layers = viewer.getMap().getLayers().getArray();
  var overlayGroup;
  var item = '';

  //Add legend groups
  var legend = '<div id="o-legendlist"><ul class="o-legendlist"></ul></div>';
  $('#o-mapmenu').append(legend);

  groups.forEach(function(group) {
    createGroup(group);
  });

  //Add map legend unless set to false
  if(hasMapLegend) {
    var mapLegend = '<div id="o-map-legend"><ul id="o-legend-overlay"><li class="o-legend o-hidden"><div class ="o-toggle-button o-toggle-button-max">' +
                        '<svg class="o-icon-fa-angle-double-down"><use xlink:href="#fa-angle-double-down"></use></svg>' +
                        '<svg class="o-icon-fa-angle-double-up"><use xlink:href="#fa-angle-double-up"></use></svg>' +
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
    //Check if layer belongs to subgroup
    var inSubgroup = $('#o-group-' + layer.get('group')).closest('ul').parent().closest('ul').hasClass('o-legend-group');
    var title = '<div class="o-legend-item-title o-truncate">' + layer.get('title') + '</div>';

    //Add abstract button
    if(layer.get('abstract')){
      title += addAbstractButton(name);
    }
    title += '</div></li>';

    //Append layer to group in legend. Add to default group if not defined.
    if(layer.get('group') == 'background') {

      //Append background layers to menu
      item = '<li class="o-legend ' + name + '" id="' + name + '"><div class ="o-legend-item"><div class="o-checkbox"><svg class="o-icon-fa-check"><use xlink:href="#fa-check"></use></svg></div>';
      item += title;
      $('#o-group-background .o-legend-header').after(item);

      //Append background layers to map legend
      item = '<li class="o-legend ' + name + '" id="o-legend-' + name + '"><div class ="o-legend-item">'
      item += layer.get('styleName') ? getSymbol(styleSettings[layer.get('styleName')]) : '';
      item += '</div>';
      $('#o-map-legend-background').prepend(item);

    } else if(layer.get('group') && ((layer.get('group') != 'none'))) {

      //Append layer to group
      item = createLegendItem(name, layerStyle, inSubgroup);
      if ($('#o-group-' + layer.get('group')).find('li.o-top-item:last').length) {
        $('#o-group-' + layer.get('group')).find('li.o-top-item:last').after(item);
      } else {
        $('#o-group-' + layer.get('group') + ' .o-legend-header').after(item);
      }

      if(layer.get('legend') == true || layer.getVisible(true)) {
        //Append to map legend
        item = '<li class="o-legend ' + name + '" id="o-legend-' + name + '"><div class ="o-legend-item"><div class="o-checkbox">' +
                  '<svg class="o-icon-fa-square-o"><use xlink:href="#fa-square-o"></use></svg>' +
                  '<svg class="o-icon-fa-check-square-o"><use xlink:href="#fa-check-square-o"></use></svg>' +
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

        if (inSubgroup) {
          var parentGroups = $('#' + name).parents('ul [id^=o-group-]');
          [].forEach.call(parentGroups, function(el) {
            toggleGroup($(el).find('li:first'));
          });

          toggleSubGroupCheck($('#' + name).parents('ul').has('.o-legend-header').first(), false);
        } else {
          $('#o-group-' + layer.get('group') +' .o-icon-expand').removeClass('o-icon-expand-false');
          $('#o-group-' + layer.get('group') +' .o-icon-expand').addClass('o-icon-expand-true');
          $('#o-group-' + layer.get('group')).removeClass('o-ul-expand-false');
        }

      } else {
        $('.' + name + ' .o-checkbox').addClass('o-checkbox-false');
      }
    }

    //Event listener for tick layer
    $('#' + name).on('click', function(evt) {
      if ($(evt.target).closest('div').hasClass('o-icon-expand')) {
        toggleGroup($(this));
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
  });

  $('.o-abstract').on('click', function(evt) {
    $(this).each(function() {
      var that = this;
      showAbstract($(that));
    });

    evt.preventDefault();
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
  var groupicon = $('#' + group.attr('id') + ' .o-icon-expand:first');

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

//Toggle subgroups
function toggleSubGroupCheck(subgroup, toggleAll) {
  var subGroup = $(subgroup);
  var subLayers = subGroup.find('.o-legend-item.o-legend-subitem');
  var groupList = $('.o-legend-group');

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
      toggleSubGroupCheck($('#' + layername).parents('ul').has('.o-legend-header').first(), false);
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
function showAbstract($abstractButton) {
  var layer;
  var $item = $abstractButton.closest('li');
  var layername = $abstractButton.attr('id').split('o-legend-item-info-').pop();
  var abstract = {
    title: '',
    content: ''
  };

  //If info button is connected group
  if ($item.hasClass('o-legend-header')) {
    var groups = viewer.getGroups();

    var group = $.grep(groups, function(obj) {
      return (obj.name == layername);
    });

    abstract.title = group[0].title;
    abstract.content = group[0].abstract
  } else { // If info button is connected to layer
    layer = viewer.getLayer(layername);
    abstract.title = layer.get('title');
    abstract.content = layer.get('abstract');
  }

  modal.createModal('#o-map', {title: abstract.title, content: abstract.content});
  modal.showModal();
}

module.exports.init = init;
