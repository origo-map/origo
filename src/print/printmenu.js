"use strict";

var $ = require('jquery');
var utils = require('../utils');
var options = require('./../../conf/printSettings');
var config = require('../../conf/origoConfig');
var print = require('./print');
var printarea = require('./printarea');
var Viewer = require('../viewer');
var ol = require('openlayers');

var mapfishConfig;
var $printButton, $printButtonTool, $printselect, vector, $scaleselect, $orientationselect, $clearButton, $layoutselect;

function init() {
	$.getJSON(config.printInfo, function(data) {
		buildPanel(data);
		mapfishConfig = data;
	});

	function buildPanel(config) {
		var outputFormats = config.outputFormats.map(function(format) {
			return format.name.toUpperCase();
		});
		
		
		var layoutNames = config.layouts.map(function(layout) {
			return layout.name.split('-')[0];
		});
		//Populera mall-lista med endast ett entry per "layout" i config.yaml. Enligt kravspec
		var layouts = layoutNames.filter(function (layoutName) {
			if (!this.has(layoutName)) {
				this.set(layoutName, true);
				return true;
			}
		}, new Map);

		var scales = config.scales.map(function(scale) {
			return scale.value;
		});

		var dpis = config.dpis.map(function(dpi) {
			return dpi.value;
		});

		var menuEl = '<form type="submit">' +
			'<div id="o-printmenu" class="o-printmenu">' +
				'<h5 id="o-main-setting-heading">Skriv ut karta</h5>' +
				'<div class="o-block">' +
					'<span class="o-setting-heading">Format</span>' +
					'<select id="o-format-dd" class="o-dd-input">' +
						utils.createDdOptions(outputFormats) +
					'</select>' +
				'</div>' +
				'<div class="o-block">' +
					'<span class="o-setting-heading">Mall</span>' +
					'<select id="o-layout-dd" class="o-dd-input">' +
					utils.createDdOptions(layouts) +
					'</select>' +
				'</div>' +
				'<div class="o-block">' +
					'<span class="o-setting-heading">Orientering</span>' +
					'<select id="o-orientation-dd" class="o-dd-input">' +
						utils.createDdOptions(options.orientation) +
					'</select>' +
				'</div>' +
				'<div class="o-block">' +
					'<span class="o-setting-heading">Storlek</span>' +
					'<select id="o-size-dd" class="o-dd-input">' +
					utils.createDdOptions(options.sizes) +
					'</select>' +
				'</div>' +
				'<div class="o-block">' +
					'<span class="o-setting-heading">Skala</span>' +
					'<select id="o-scale-dd" class="o-dd-input">' +
					utils.createDdOptions(scales) +
					'</select>' +
				'</div>' +
				'<div class="o-block">' +
					'<span class="o-setting-heading">Upplösning</span>' +
					'<select id="o-resolution-dd" class="o-dd-input">' +
					utils.createDdOptions(dpis) +
					'</select>' +
				'</div>' +
				'<br />' +
				'<div class="o-block">' +
					'<span class="o-setting-heading">Titel<span><br />' +
					'<input id="o-title-input" class="o-text-input" type="text" />' +
				'</div>' +
				'<br />' +
				'<div class="o-block">' +
					'<input type="checkbox" id="o-legend-input" />' +
					'<label for="o-legend-input">Teckenförklaring</label>' +
				'</div>' +
					
				'<br />' +
					'<div class="o-block">' +
					'<button id="o-print-create-button" class="btn" type="button">Skapa</button>' +
					'<button id="o-print-clear-button" class="btn" type="button" style="margin:5px">Avbryt</button>' +
				'</div>' +
				'<br />' +
				'<div class="o-block">' +
					'<span id="o-dl-progress">Skapar... <img src="../../img/spinner.svg" /></span><a id="o-dl-link" href="#">Ladda ner</a>' +	
				'</div>' +			
			'</div>' +
			'</form>';

		$('#o-map').append(menuEl);
		
		//Set default values for dropdowns
		$('#o-format-dd option[value="PDF"]').attr('selected', 'selected');
		$('#o-scale-dd option[value="5000.0"]').attr('selected', 'selected');
		$('#o-size-dd option[value="A4"]').attr('selected', 'selected');

		var printButton = utils.createButton({
			id: 'o-printmenu-button-close',
			cls: 'o-no-boxshadow',
			iconCls: 'o-icon-menu-fa-times',
			src: '#fa-times',
			tooltipText: 'Stäng meny',
			tooltipPlacement: 'west'
		});

		$('#o-main-setting-heading').append(printButton);

		var printButtonTool = utils.createButton({
			id: 'o-print-tool',
			iconCls: 'o-icon-fa-print',
			src: '#fa-print'
		});

		$('#o-toolbar-misc').append(printButtonTool);
		$printButtonTool = $('#o-print-tool');
		$printButton = $('#o-printmenu-button-close');
		$printselect = $('#o-size-dd');
		$scaleselect = $('#o-scale-dd');
		$orientationselect = $('#o-orientation-dd');
		$clearButton = $('#o-print-clear-button');
		$layoutselect = $('#o-layout-dd');
		bindUIActions();
	}
}

function bindUIActions() {
	var polygon = false;
	$printButton.on('click', function (e) {
		$("#o-printmenu").removeClass('o-printmenu-show');
		e.preventDefault();
	});
	$printButtonTool.on('click', function (e) {
		if ($("#o-printmenu").hasClass('o-printmenu-show')) {
			$("#o-printmenu").removeClass('o-printmenu-show');
		} else {
			if (!vector) {				
				vector = printarea.printA1();
				polygon = true;
				var paper = getPaperMeasures();
				printarea.addPreview($('#o-scale-dd').val(), paper);
				$("#o-printmenu").addClass('o-printmenu-show');
			} else {
				vector.setVisible(true);
				$("#o-printmenu").addClass('o-printmenu-show');
			}

		}
		e.preventDefault();
	});
	$clearButton.on('click', function (e) {
		var map = Viewer.getMap();
		var vector = printarea.getVector();
		if(vector){
			vector.setVisible(false);
			$("#o-printmenu").removeClass('o-printmenu-show');
		}	
		e.preventDefault();
	});
	$printselect.change(function () {
		var map = Viewer.getMap();
		var paper = getPaperMeasures($printselect.val());
		var scale = $scaleselect.val();
		scale = scale.split('.')[0];
		printarea.addPreview(scale, paper);
	});

	$layoutselect.change(function () {
		var map = Viewer.getMap();
		var paper = getPaperMeasures($printselect.val());
		var scale = $scaleselect.val();
		scale = scale.split('.')[0];
		printarea.addPreview(scale, paper);
	});

	$scaleselect.change(function () {
		var map = Viewer.getMap();
		var paper = getPaperMeasures($printselect.val());
		var scale = $scaleselect.val();
		scale = scale.split('.')[0];
		printarea.addPreview(scale, paper);
	});

	$orientationselect.change(function () {
		var map = Viewer.getMap();
		var paper = getPaperMeasures($printselect.val());
		var scale = $scaleselect.val();
		scale = scale.split('.')[0];
		printarea.addPreview(scale, paper);
	});

	function getPaperMeasures(format) {
		var orientationLandscape = $('#o-orientation-dd').val() == 'Liggande',
			width = 0,
			height = 0;

		// Sätt storlek på polygon till storlek på kartutsnitt
		// Hämta vald mall
		var layoutName = buildLayoutString($('#o-layout-dd').val(), $('#o-size-dd').val(), $('#o-orientation-dd').val());
		if (mapfishConfig) {
			var layoutnames = mapfishConfig.layouts;
			var getWidth = function (name) {
				var layout = layoutnames.filter(function (layoutname) {
					return layoutname.name === name;
				});
				return layout[0] ? layout[0].map.width : 0;
			}
			var getHeight = function (name) {
				var layout = layoutnames.filter(function (layoutname) {
					return layoutname.name === name;
				});
				return layout[0] ? layout[0].map.height : 0;
			}
			
			width = getWidth(layoutName);
			height = getHeight(layoutName);
		}

		// switch (format) {
		// 	case 'A1':
		// 		width = orientationLandscape ? 594 : 420,
		// 		height = orientationLandscape ? 420 : 594
		// 		break;
		// 	case 'A2':
		// 		width = orientationLandscape ? 420 : 297,
		// 		height = orientationLandscape ? 297 : 420
		// 		break;
		// 	case 'A3':
		// 		width = orientationLandscape ? 297 : 210,
		// 		height = orientationLandscape ? 210 : 297
		// 		break;
		// 	case 'A4':
		// 		width = orientationLandscape ? 210 : 400,
        //         height = orientationLandscape ? 149 : 800
		// 		break;
		// 	case 'A5':
		// 		width = orientationLandscape ? 149 : 105,
        //         height = orientationLandscape ? 105 : 149
		// 		break;
		// 	case 'A6':
		// 		width = orientationLandscape ? 105 : 74,
        //         height = orientationLandscape ? 74 : 105
		// 		break;
		// }
		
		return {
			width: width,	//((width / 25.4)),
			height: height	//((height / 25.4))
		};
	};


	$('#o-print-create-button').click(function (event) {
		var map = Viewer.getMap();
		var layers = map.getLayers();
		var extent = vector.getSource().getFeatures()[0].getGeometry().getExtent(); //TODO: Finns risk för nullpointer här, även om det alltid endast finns en vector. Borde hanteras bättre
		
		var centerPoint =  ol.extent.getCenter(extent);

		var visibleLayers = layers.getArray().filter(function(layer) {
			return layer.getVisible();
		});

		var contract = {
			dpi: $('#o-resolution-dd').val(),
			layers: visibleLayers,
			outputFormat: $('#o-format-dd').val().trim().toLowerCase(),
			scale: $('#o-scale-dd').val(),
			orientation: $('#o-orientation-dd').val(),
			size: $('#o-size-dd').val(),
			title: $('#o-title-input').val(),
			layout: buildLayoutString($('#o-layout-dd').val(), $('#o-size-dd').val(), $('#o-orientation-dd').val()),
			center: centerPoint
		};
		print.printMap(contract);
		return false;
	});
}

function buildLayoutString(name, size, orientation) {
	return name + '-' + size + '-' + orientation;
}
module.exports.init = init;