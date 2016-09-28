"use strict";

var ol = require('openlayers');
var $ = require('jquery');
var Viewer = require('./viewer');
var utils = require('./utils');
var featureinfo = require('./featureinfo');

var	map,
		activeButton,
		measure,
		type,
		sketch,
		measureTooltip,
		measureTooltipElement,
		helpTooltip,
		helpTooltipElement,
		vector,
		source,
		label,
		overlayArray = [],
		continuePolygonMsg = 'Klicka för att fortsätta rita ytan',
		continueLineMsg = 'Klicka för att fortsätta rita linjen',
		drawStart = false;
		
function init(){
	
	map = Viewer.getMap();
	source = new ol.source.Vector();

	//Drawn features
	vector = new ol.layer.Vector({
		source: source,
		name: 'measure',
		visible: false,
		zIndex: 6
	});
	map.addLayer(vector);
	
	createUIButtons();
	bindUIActions();
}
function createUIButtons() {
	var mb = utils.createButton({
		id: 'measure-button',
		cls: 'measure-button',
		iconCls: 'mdk-icon-steady-measure',
		src: 'css/svg/steady-icons.svg#steady-measure',
		tooltipText: 'Mät i kartan'
	});
	$('#map').append(mb);

	var lb = utils.createButton({
		id: 'measure-line-button',
		cls: 'measure-type-button',
		iconCls: 'mdk-icon-minicons-square-vector',
		src: 'css/svg/minicons-icons.svg#minicons-line-vector',
		tooltipText: 'Linje',
    tooltipPlacement: 'north'
	});
	$('#map').append(lb);
	$('#measure-line-button').addClass('measure-show-false');

	var pb = utils.createButton({
		id: 'measure-polygon-button',
		cls: 'measure-type-button',
		iconCls: 'mdk-icon-minicons-square-vector',
		src: 'css/svg/minicons-icons.svg#minicons-square-vector',
		tooltipText: 'Yta',
    tooltipPlacement: 'north'
	});
	$('#map').append(pb);
	$('#measure-polygon-button').addClass('measure-show-false');
}
function bindUIActions() {
	$('#measure-button').on('touchend click', function(e) {
		toggleMeasure(true);
		$('#measure-button button').blur();
		e.preventDefault();
	});
	
	$('#measure-line-button').on('touchend click', function(e) {
		type = 'LineString';
		toggleType($('#measure-line-button button'));
		$('#measure-line-button button').blur();
		e.preventDefault();
	});
	
	$('#measure-polygon-button').on('touchend click', function(e) {
		type = 'Polygon';
		toggleType($('#measure-polygon-button button'));
		$('#measure-polygon-button button').blur();
		e.preventDefault();
	});
} 
function createStyle(feature, labelText) {
	var featureType = feature.getGeometry().getType();
	if (featureType == 'LineString') {
		var endPoint = feature.getGeometry().getLastCoordinate();
		return [
			new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: 'rgba(0, 0, 0, 1.0)',
					width: 2
				})
			}),
			new ol.style.Style({
				geometry: new ol.geom.Point(endPoint),
				image: new ol.style.Circle({
					fill: new ol.style.Fill({
						color: 'rgba(0,0,0,1)',
					}),
					radius: 3
				}),
				text: new ol.style.Text({
					text: labelText,
					font: 'bold 13px "Helvetica Neue", Helvetica, Arial, sans-serif',
					textBaseline: 'bottom',
					textAlign: 'center',
					offsetY: -4,
					stroke: new ol.style.Stroke({color: 'rgba(255, 255, 255, 0.8)', width: 3})
				})
			})
		]
	}
	else {
		return [
			new ol.style.Style({
				fill: new ol.style.Fill({
					color: 'rgba(255, 255, 255, 0.4)'
				}),
				stroke: new ol.style.Stroke({
					color: 'rgba(0, 0, 0, 1.0)',
					width: 2
				}),
				text: new ol.style.Text({
					text: labelText,
					font: 'bold 13px "Helvetica Neue", Helvetica, Arial, sans-serif',
					textBaseline: 'middle',
					textAlign: 'center',
					stroke: new ol.style.Stroke({color: 'rgba(255, 255, 255, 0.8)', width: 3})
				})
			})
		]
	}
}
//Display and move tooltips with pointer
function pointerMoveHandler(evt) {
	if (evt.dragging) {
		return;
	}
	var helpMsg = 'Klicka för att börja mäta';
	var tooltipCoord = evt.coordinate;

	if (sketch) {
		var output;
		var geom = (sketch.getGeometry());
		if (geom instanceof ol.geom.Polygon) {
			output = formatArea(/** @type {ol.geom.Polygon} */ (geom));
			helpMsg = continuePolygonMsg;
			tooltipCoord = geom.getInteriorPoint().getCoordinates();
		} else if (geom instanceof ol.geom.LineString) {
			output = formatLength( /** @type {ol.geom.LineString} */ (geom));
			helpMsg = continueLineMsg;
			tooltipCoord = geom.getLastCoordinate();
		}
		measureTooltipElement.innerHTML = output;
		label = output;
		measureTooltip.setPosition(tooltipCoord);
	}
	if (evt.type == 'pointermove') {
		helpTooltipElement.innerHTML = helpMsg;
		helpTooltip.setPosition(evt.coordinate);
	}
};
function addInteraction() {
	vector.setVisible(true);
	measure = new ol.interaction.Draw({
		source: source,
		type: type,
		style: new ol.style.Style({
			fill: new ol.style.Fill({
				color: 'rgba(255, 255, 255, 0.2)'
			}),
			stroke: new ol.style.Stroke({
				color: 'rgba(0, 0, 0, 0.5)',
				lineDash: [10, 10],
				width: 2
			}),
			image: new ol.style.Circle({
				radius: 5,
				stroke: new ol.style.Stroke({
					color: 'rgba(0, 0, 0, 0.7)'
				}),
				fill: new ol.style.Fill({
					color: 'rgba(255, 255, 255, 0.2)'
				})
			})
		})
	});
	map.addInteraction(measure);

	createMeasureTooltip();
	createHelpTooltip();

	map.on('pointermove', pointerMoveHandler);
	map.on('click', pointerMoveHandler);

	measure.on('drawstart', function(evt) {
		// set sketch
		drawStart = true;
		sketch = evt.feature;
	}, this);

	measure.on('drawend', function(evt) {
		var feature = evt.feature;
		feature.setStyle(createStyle(feature, label));
		$(measureTooltipElement).remove();
		// unset sketch
		sketch = null;
		// unset tooltip so that a new one can be created
		measureTooltipElement = null;
		createMeasureTooltip();
	}, this);
};
function createHelpTooltip() {
	if (helpTooltipElement) {
		helpTooltipElement.parentNode.removeChild(helpTooltipElement);
	}
	helpTooltipElement = document.createElement('div');
	helpTooltipElement.className = 'tooltip';
	helpTooltip = new ol.Overlay({
		element: helpTooltipElement,
		offset: [15, 0],
		positioning: 'center-left',
	});
	overlayArray.push(helpTooltip);
	map.addOverlay(helpTooltip);
};
function createMeasureTooltip() {
	if (measureTooltipElement) {
		measureTooltipElement.parentNode.removeChild(measureTooltipElement);
	}
	measureTooltipElement = document.createElement('div');
	measureTooltipElement.className = 'tooltip tooltip-measure';
	measureTooltip = new ol.Overlay({
		element: measureTooltipElement,
		offset: [0, -15],
		positioning: 'bottom-center',
		stopEvent: false
	});
	overlayArray.push(measureTooltip);
	map.addOverlay(measureTooltip);
};
function formatLength(line) {
	var length;
	length = Math.round(line.getLength() * 100) / 100;
	var output;
	if (length > 100) {
		output = (Math.round(length / 1000 * 100) / 100) +
			' ' + 'km';
	} else {
		output = (Math.round(length * 100) / 100) +
			' ' + 'm';
	}
	return output;
};
function formatArea(polygon) {
	var area;
	area = polygon.getArea();
	var output;
	if (area > 10000000) {
		output = (Math.round(area / 1000000 * 100) / 100) +
			' ' + 'km<sup>2</sup>';
	} else if (area > 10000) {
		output = (Math.round(area / 10000 * 100) / 100) +
			' ' + 'ha';
	} else {
		output = (Math.round(area * 100) / 100) +
			' ' + 'm<sup>2</sup>';
	}
	var htmlElem = document.createElement('span');
	htmlElem.innerHTML = output;
	for (var i=0;i<htmlElem.children.length;i++) {
			var child = htmlElem.children[i];
			if (child.tagName === 'SUP') {
				child.textContent = String.fromCharCode(child.textContent.charCodeAt(0) + 128);
			}
	}
	return htmlElem.textContent;
};
function toggleMeasure () {
	if ( $('#measure-button button').hasClass('measure-button-true') ) {
		if (activeButton) { activeButton.removeClass('measure-button-true'); };
		$('#measure-button').addClass('mdk-tooltip');
		$('#measure-button button').removeClass('measure-button-true');
		$('#measure-line-button').removeClass('measure-show-true');
		$('#measure-polygon-button').removeClass('measure-show-true');
		$('#measure-line-button').addClass('measure-show-false');
		$('#measure-polygon-button').addClass('measure-show-false');

		map.un('pointermove', pointerMoveHandler);
		map.un('click', pointerMoveHandler);
		map.removeInteraction(measure);
		vector.setVisible(false);
		removeOverlays();
		vector.getSource().clear();
		featureinfo.setActive(true);
	}
	else {
		featureinfo.setActive(false);
		$('#measure-button').removeClass('mdk-tooltip');
		$('#measure-button button').addClass('measure-button-true');
		$('#measure-line-button').removeClass('measure-show-false');
		$('#measure-polygon-button').removeClass('measure-show-false');
		$('#measure-line-button').addClass('measure-show-true');
		$('#measure-polygon-button').addClass('measure-show-true');
	}
};
function toggleType(button) {
	if (activeButton) { activeButton.removeClass('measure-button-true'); }
	button.addClass('measure-button-true');
	activeButton = button;
	map.removeInteraction(measure);
	addInteraction();
};
function removeOverlays() {
	overlayArray.forEach(function(element) {
		map.removeOverlay(element);
	})
};

module.exports.init = init;