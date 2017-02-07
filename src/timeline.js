"use strict"

var $ = require('jquery');
var ol = require('openlayers');
var Viewer = require('./viewer');
var Legend = require('./legend');
var utils = require('./utils');
var stylefunctions = require('./style/stylefunctions');
require('../externs/jquery-ui.min');
require('../externs/jquery.ui.labeledslider');
require('../externs/jquery.ui.touch-punch.min');

var layers, settings, check, timelineLayers, utilSettings;
var br = '<br class="rwd-break" />';

function init() {

	utilSettings = {
			range: true,
			min: 1865,
			max: 2017,
			values: [1865,2017],
			step: 1,
      tickArray: [1865,2017],
      tickLabels_h: {1865: 'Före 1865', 2017: '2017'},
      tickLabels_v: {1865: 'Före 1865', 2017: '2017'}
			
	}
		
	$('#o-map').append('<div class="wrapper-vertical"><div id="slider-labeled-v"></div></div>');
	$('#o-map').append('<div class="wrapper-horizontal"><div id="slider-labeled-h"></div></div>');

	timelineLayers = Viewer.getLayers().filter(function(l) { 
		return l.get('timeline') == 'byggnadsar';
	});
  
  if (timelineLayers.length > 0) {
    timelineLayers[0].on('change:visible', function(evt) {
      if (evt.oldValue) {
        $('.wrapper-vertical').addClass('timeline-hide');
        $('.wrapper-horizontal').addClass('timeline-hide');
        $("#slider-labeled-h").labeledslider('destroy');
        $("#slider-labeled-v").labeledslider('destroy');
      }
      else {
        $('.wrapper-vertical').removeClass('timeline-hide');
        $('.wrapper-horizontal').removeClass('timeline-hide');
        timeline();
      }
    });
  
    loadCss();
    initTimeline();
  }
};
function loadCss() {
	var cssUrls = ['timeline.css', 'jquery-ui.css', 'jquery-ui.structure.css', 'jquery-ui.theme.css', 'jquery.ui.labeledslider.css'];
	for (var i = 0; i < cssUrls.length; i++) {
		var head = document.getElementsByTagName('head')[0]; 
		var link = document.createElement('link');
		link.href = 'css/' + cssUrls[i];
		link.rel = 'stylesheet'; 
		head.appendChild(link);
	}
};

// Create timeline if any timeline layer is checked on load
function initTimeline() {
  if (timelineLayers[0].getVisible()) {
		$('.wrapper-vertical').removeClass('timeline-hide');
		$('.wrapper-horizontal').removeClass('timeline-hide');
		timeline();
	}
};
function timeline() {
	
	var prevLayer = [];
	
	//Labeled slider (vertical)
	$("#slider-labeled-v").labeledslider({ 
		orientation: "vertical",
		animate: true,
		range: utilSettings.range,
		min: utilSettings.min,
		max: utilSettings.max,
		value: utilSettings.value,
		values: utilSettings.values,
		step: utilSettings.step,
		tickLabels: utilSettings.tickLabels_v,
    tickInterval: utilSettings.tickInterval,
    tickArray: utilSettings.tickArray,
		slide: function(event, ui) { 
			$( "#slider-labeled-h" ).labeledslider('value', ui.value );
			$( "#slider-labeled-h" ).labeledslider('values', ui.values );
			slideEvent(event, ui, $("#slider-labeled-v"));
		}
	});
	
	//Labeled slider (horizontal)
	$("#slider-labeled-h").labeledslider({
		orientation: "horizontal",
		animate: true,
		range: utilSettings.range,
		min: utilSettings.min,
		max: utilSettings.max,
		value: utilSettings.value,
		values: utilSettings.values,
		step: utilSettings.step,
		tickLabels: utilSettings.tickLabels_h,
    tickInterval: utilSettings.tickInterval,
    tickArray: utilSettings.tickArray,
		slide: function(event, ui) { 
			$( "#slider-labeled-v" ).labeledslider('value', ui.value );
			$( "#slider-labeled-v" ).labeledslider('values', ui.values );
			slideEvent(event, ui, $("#slider-labeled-h"));
		},
		create: function(event, ui) {
      var val = utilSettings.range ? $( "#slider-labeled-h" ).labeledslider( "values" ) : $( "#slider-labeled-h" ).labeledslider( "value" );
			var val = utilSettings.range ? $( "#slider-labeled-v" ).labeledslider( "values" ) : $( "#slider-labeled-v" ).labeledslider( "value" );

      timelineLayers[0].setStyle(stylefunctions('byggnadsar', val));

      $('#slider-labeled-h.ui-widget-content').addClass('ui-bg-byggnadsar-h');
      $('#slider-labeled-v.ui-widget-content').addClass('ui-bg-byggnadsar-v');

      $( '.ui-widget.horizontal .ui-slider-labels' ).append('<div class="ui-slider-label-min ui-slider-label-ticks horizontal"><span>'+val[0]+'</span></div>');
      $( '.ui-widget.horizontal .ui-slider-labels' ).append('<div class="ui-slider-label-max ui-slider-label-ticks horizontal"><span>'+val[1]+'</span></div>');

      $( '.ui-widget.vertical .ui-slider-labels' ).append('<div class="ui-slider-label-min ui-slider-label-ticks vertical"><span>'+val[0]+'</span></div>');
      $( '.ui-widget.vertical .ui-slider-labels' ).append('<div class="ui-slider-label-max ui-slider-label-ticks vertical"><span>'+val[1]+'</span></div>');
      
      setHandleLabelValue(val);
      setHandleLabelPosition(val);
		}
	});
	
	function slideEvent(event, ui, target) {
    var dir = target.labeledslider( 'option', 'orientation') == 'horizontal' ? 'left' : 'bottom';
    $('.ui-slider-label-min').css( dir, (Math.round( ( (ui.values[0]-utilSettings.min) / (utilSettings.max-utilSettings.min) ) * 10000 ) / 100) + '%' );
    $('.ui-slider-label-max').css( dir, (Math.round( ( (ui.values[1]-utilSettings.min) / (utilSettings.max-utilSettings.min) ) * 10000 ) / 100) + '%' );

    setHandleLabelValue(ui.values);
    setHandleLabelPosition(ui.values);
    timelineLayers[0].setStyle(stylefunctions('byggnadsar', ui.values));
	}
};

function setHandleLabelValue(val) {
  if (utilSettings.tickArray.includes(val[0])) {
    $('.ui-slider-label-min').addClass('o-hidden');
  } else {
    $('.ui-slider-label-min').removeClass('o-hidden');
    $('.ui-slider-label-min > span').text(val[0]);
  }

  if (utilSettings.tickArray.includes(val[1])) {
    $('.ui-slider-label-max').addClass('o-hidden');
  } else {
    $('.ui-slider-label-max').removeClass('o-hidden');
    $('.ui-slider-label-max > span').text(val[1]);      
  }

}

function setHandleLabelPosition(val) {
  $('.ui-slider-label-min').each(function() {
    var dir = $(this).hasClass('horizontal')? 'left' : 'bottom';
    $(this).css( dir, (Math.round( ( (val[0]-utilSettings.min) / (utilSettings.max-utilSettings.min) ) * 10000 ) / 100) + '%' );
  });

  $('.ui-slider-label-max').each(function() {
    var dir = $(this).hasClass('horizontal')? 'left' : 'bottom';
    $(this).css( dir, (Math.round( ( (val[1]-utilSettings.min) / (utilSettings.max-utilSettings.min) ) * 10000 ) / 100) + '%' );
  });

}

module.exports.init = init;