/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

import ol from 'ol'
import $ from 'jquery';
import Viewer from '../viewer';
import utils from '../utils';
import style from '../style';
import numberFormatter from '../utils/numberformatter';

let map;
let $console;
let isActive;
let scaleText;
const scaleDropdownId = 'o-scale-dropdown';
const scaleDropdownCls = 'o-scale-dropdown-input';
const scaleDropdownIconCls = 'o-scale-dropdown-caret';
const scaleDropdownIconId = '#fa-caret-down';//From fa-icons-all.svg
let $scaleDropdown;
let $scaleDropdownInputField;
let dropdownlistShowing = false;

function init(opt_options) {
  var options = opt_options || {};
  map = Viewer.getMap();
  $console = $('#' + Viewer.getConsoleId());
  scaleText = options.scaleText || '1:';
  var initialState = options.hasOwnProperty('isActive') ? options.isActive : true;

  setActive(initialState);
  render();
  bindUIActions();

  return {
    setActive: setActive
  }
}
function render() {
  const sdb = utils.createInput({
    val: 50,
    id: scaleDropdownId,
    cls: scaleDropdownCls,
    iconCls: scaleDropdownIconCls + " o-toolbar-vertical o-toolbar-navigation",
    tooltipText: 'Välj skala från lista',
    includeDropdown: true,
    src: scaleDropdownIconId,
    listOptions: getScaleOptions()
  });

  $('#o-tools-top').prepend(sdb);
  $scaleDropdown = $(('#' + scaleDropdownId));
  $scaleDropdownInputField = $($scaleDropdown.find(('#' + scaleDropdownId + '-input')));

  {//Hide the dropdown list and use the tracking variable dropdownlistShowing to false. We use this instead of :visible for performance reasons
    toggleInputDropdownList('hide');
  }


  setScaleInputValue(Viewer.getScale(map.getView().getResolution()));
  $scaleDropdownInputField.attr('readonly', true);
}
function bindUIActions() {
  map.getView().on('propertychange', onZoomChange);

  $scaleDropdown.on('click', onScaleDropdownClick);

  $scaleDropdown.blur(function () {
    toggleInputDropdownList('hide');
  });

  $(window).on('click', function (e) {
    hideScaleDropdownOnWindowClickIfShowing();
  });
}
function onScaleDropdownClick(e) {
  let sameClick = true;
  if (dropdownlistShowing !== true && !(e.target == $scaleDropdown.find('.o-svg-container').get(0))) {
    toggleInputDropdownList('show');
  }

  if (e.target == $scaleDropdown.find('.o-svg-container').get(0)) {
    if (dropdownlistShowing === true) {
      toggleInputDropdownList('hide');
    } else {
      toggleInputDropdownList('show');
    }
  } else if ($.inArray(e.target, $scaleDropdown.find('.o-input-dropdown-list li').get()) >= 0) {
    var scaleValue = $(e.target).data('value');
    if (scaleValue) {
      {//Set the new resolution on the map and update the input field
        map.getView().setResolution(Viewer.scaleToResolution(scaleValue));
        setScaleInputValue(scaleValue);
      }
      $scaleDropdown.blur();
    }
  }
}

function hideScaleDropdownOnWindowClickIfShowing() {
  if (typeof e != 'undefined') {
    var targetIsNotScaleDropdown = e.target != $scaleDropdown.get(0);
    var parentIsNotScaleDropdown = (jQuery.inArray($scaleDropdown.get(0), $(e.target).parents().get())) == -1;
    if (targetIsNotScaleDropdown && parentIsNotScaleDropdown) {
      if (dropdownlistShowing == true) {
        toggleInputDropdownList('hide');
      }
    }
  }
}
function toggleInputDropdownList(desiredAction) {
  if (dropdownlistShowing === true || (desiredAction == 'hide')) {
    $scaleDropdown.find('.o-input-dropdown-list').addClass('o-hidden');
    dropdownlistShowing = false;

  } else if (dropdownlistShowing === false || desiredAction == 'show') {
    $scaleDropdown.find('.o-input-dropdown-list').removeClass('o-hidden');
    dropdownlistShowing = true;
  }
}
function setScaleInputValue(value) {
  if ($scaleDropdownInputField) {
    $scaleDropdownInputField.val('1:' + roundScale(value));
  }
}
function setActive(state) {
  if (state === true) {
    map.getView().on('change:resolution', onZoomChange);
    onZoomChange();
    isActive = true;
  } else if (state === false) {
    map.getView().un('change:resolution', onZoomChange);
    isActive = false;
  }
}

function onZoomChange(e) {
  setScaleInputValue(roundScale(Viewer.getScale(map.getView().getResolution())));
}

function roundScale(scale) {
  const differens = scale % 10; //is the number not even? 
  if (differens != 0) {
    scale = scale + (10 - differens);
  }
  return scale;
}

function getScaleOptions() {
  const scaleArray = (function () {
    const resolutions = Viewer.getResolutions();
    let resolutionsMappedToScale = [];
    if (resolutions && resolutions.length > 0) {
      resolutionsMappedToScale = resolutions.map(function (configResolution) {
        var scale = Viewer.getScale(configResolution);
        return roundScale(scale);
      }).reverse();
    }
    return resolutionsMappedToScale;
  })();
  const scaleOptions = scaleArray.map(function (scaleValue) {
    return {
      text: ("1:" + scaleValue),
      value: scaleValue
    }
  });
  return scaleOptions;
}

export default { init };
