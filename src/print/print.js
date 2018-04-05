var $ = require('jquery');
var printMenu = require('./printmenu');
var config = require('../../conf/origoConfig');
var ol = require('openlayers');
var viewer = require('../viewer');
var utils = require('./utils/utils');

function downloadWhenReady(startTime, data) {
	if ((new Date().getTime() - startTime) > 30000) {
		console.log(('Gave up waiting after 30 seconds'))
	} else {
		setTimeout(function () {
			$.getJSON(config.geoserverPath + data.statusURL, function (statusData) { //TODO: det här funkar inte i dagsläget. Kanske skapa en länk till getURL()
				if (!statusData.done) {
					downloadWhenReady(startTime, data);
				} else {
					window.location = config.geoserverPath + statusData.downloadURL;
					console.log(('Downloading: ' + data.ref));
				}
			}, function error(data) {
				console.log(('Error occurred requesting status'));
			});
		}, 500);
	}
}

/**
 * Converts values passed from gui to an object accepted by mapfish
 * @param {Object} options 
 */
function convertToMapfishOptions(options) {
	var dpi = parseInt(options.dpi.split(' ')[0]);
	var scale = parseInt(options.scale.split(/[: ]/).pop());
	var layers = options.layers;
	var units = viewer.getProjection().getUnits();
	var mapfishOptions = {
		layout: options.layout,
		srs: viewer.getProjection().getCode(),
		units: viewer.getProjection().getUnits(), //TODO: Kolla upp om detta stämmer
		outputFilename: "kartutskrift",
		outputFormat: options.outputFormat,
		layers: [],
		pages: [{
			comment: "Kommentar",
			mapTitle: options.title,
			center: options.center,
			scale: options.scale,
			dpi: options.dpi,
			geodetic: false
		}],
		legends:[{
			classes: [{
				icons: [],
				name: "ikonnamn",
				iconBeforeName: true
			}],
			name: "a class name"
		}]
	};

    //get name of background map
    var backgroundLayer = layers.filter(function(layer) {
        return layer.get('group') === "background";
	})[0];

	
    //assemble object to be pushed to layers. backgroundLayer will always contain 1 element
	if(backgroundLayer) {
		var url;
		if (backgroundLayer.getSource() instanceof ol.source.TileWMS) {
			url = backgroundLayer.getSource().getUrls()[0];
		} else if (backgroundLayer.getSource() instanceof ol.source.ImageWMS) {
			url = backgroundLayer.getSource().getUrl();
		} else {
			console.log('Bakgrundslager är av okänd bildtyp: ', backgroundLayer.getSource);
		}
		var backgroundLayerObject = {
			type: backgroundLayer.get('type'),
			baseURL: url,
			format: backgroundLayer.getSource().getParams().FORMAT,
			layers: [backgroundLayer.getSource().getParams().LAYERS]
		};
		mapfishOptions.layers.push(backgroundLayerObject);
	} else {
		//tom
	}

    //filter background map from remaining layers.
    layers = layers.filter(function(layer) {
        return layer.get('group') !== "background"
    });

    //return Object[] filtered by baseURL and/or type
    var wmsLayers = buildLayersObjects(layers.filter(function(layer) { return typeof layer.get('name') != "undefined" }), "WMS");
    var wfsLayers = buildLayersObjects(layers.filter(function(layer) { return typeof layer.get('name') != "undefined" }), "WFS");

    if (wmsLayers.length !== 0) {
        wmsLayers.forEach(function(layer) {
            mapfishOptions.layers.push(layer);
        });
    }
    if (wfsLayers.length !== 0) {
        wfsLayers.forEach(function(layer) {
            mapfishOptions.layers.push(layer);
        });
	}
	console.log('SKRIVS UT: ', mapfishOptions);
	return mapfishOptions;
}

/**
 * 
 * @param {(Object[])} layers 
 */
function buildLayersObjects(inLayers, type) {
	//WFS style defaults
	var fillColor = "#FC345C"
	,   fillOpacity = 0.5
	,   strokeColor = "#FC345C"
	,   strokeOpacity = 1
	,   strokeWidth = 3
	,   strokeLinecap = "round"
	,   strokeDashstyle = "solid"
	,   pointRadius = 10
	,   pointFillColor = "#FC345C"
	,   pointSrc = ""
	,   labelAlign = "cm"
	,   labelOutlineColor = "white"
	,   labelOutlineWidth = 3
	,   fontSize = "16"
	,   fontColor = "#FFFFFF"
	,   fontBackColor = "#000000";

	//Filter layers by type
	var layers = inLayers.filter(function (layer) {
		return layer.get("type") === type;
	});

	var printableLayers = [];
	var printIndex = null;
	switch(type) {
		case 'WMS':
		var url;
		//Build wms objects one per source
		layers.forEach(function(layer) {
			if (layer.getSource() instanceof ol.source.TileWMS) {
				url = layer.getSource().getUrls()[0];
			} else if (layer.getSource() instanceof ol.source.ImageWMS) {
				url = layer.getSource().getUrl();
			} else {
				console.log('Lagertyp stöds ej.');
			}
			printIndex = printableLayers.findIndex(l => l.baseURL === url);
			if (printIndex !== -1) {
				printableLayers[printIndex].layers.push(layer.S.name);
			} else {
				printableLayers.push({
					type: layer.get('type'),
					baseURL: url,
					format: layer.getSource().getParams().FORMAT,
					layers: [layer.getSource().getParams().LAYERS]
				});
			}
		});
		break;
		case 'WFS':
			layers.forEach(function(layer) {
				var projectionCode = viewer.getProjection().getCode();
				var styleName = layer.get('styleName');

				// Ändra på defaultvärden beroende på vad som finns i index.json (styleSettings);
				modifyDefaultStyles(viewer.getStyleSettings()[styleName]);

				var geojson  = new ol.format.GeoJSON();
				var source = layer.getSource();
				var features = source.getFeatures();
				var type = layer.get('type');


				features.forEach(function(feature) {
					feature.setProperties({'_gx_style': 0});
				});

				var data = geojson.writeFeatures(features, {featureProjection: projectionCode, dataProjection: projectionCode});
				printableLayers.push({
					type: 'vector',
					geoJson: JSON.parse(data),
					name: layer.get('name'),
					version: "1",
					styleProperty: "_gx_style",
					styles: {0: {
						fillColor: fillColor,
						fillOpacity: fillOpacity,
						strokeColor: strokeColor,
						strokeWidth: strokeWidth,
						pointRadius: pointRadius,
						pointFillColor: pointFillColor,
						pointSrc: pointSrc,
						labelAlign: labelAlign,
						labelOutlineColor: labelOutlineColor,
						labelOutlineWidth: labelOutlineWidth,
						fontSize: fontSize,
						fontColor: fontColor,
						fontBackColor: fontBackColor
					}}
				});
			});
		break;
	}
	
	function modifyDefaultStyles(styles) {
		//based on index.json styles being defined as [[]]
		styles.forEach((s) => {
			s.forEach((f) => {
				// Set fill properties if fill exists
				if (f.hasOwnProperty('fill')) {
					if (f.fill.hasOwnProperty('color')) {
						fillColor = utils.rgbaToHex(f.fill.color).toUpperCase();
					}
					if (f.fill.hasOwnProperty('opacity')) {
						fillOpacity = f.fill.opacity;
					}
				}
				// Set stroke properties if stroke exists
				if (f.hasOwnProperty('stroke')) {
					if (f.stroke.hasOwnProperty('color')) {
						strokeColor = utils.rgbaToHex(f.stroke.color).toUpperCase();
					}
					if (f.stroke.hasOwnProperty('opacity')) {
						strokeOpacity = f.stroke.opacity;
					}
					if (f.stroke.hasOwnProperty('width')) {
						strokeWidth = f.stroke.width;
					}
					if (f.stroke.hasOwnProperty('linecap')) {
						strokeLinecap = f.stroke.linecap;
					}
					if (f.stroke.hasOwnProperty('dashstyle')) {
						strokeDashstyle = f.stroke.dashstyle;
					}
				}
				
				if (f.hasOwnProperty('circle')) {
					if (f.circle.hasOwnProperty('stroke')) {
						if (f.circle.stroke.hasOwnProperty('color')) {
							strokeColor = utils.rgbaToHex(f.circle.stroke.color);
						}
						if (f.circle.stroke.hasOwnProperty('width')) {
							strokeWidth = f.circle.stroke.width;
						}
					}
					if (f.circle.hasOwnProperty('fill')) {
						if (f.circle.fill.hasOwnProperty('color')) {
							fillColor = utils.rgbaToHex(f.circle.fill.color);
						}
					}
					if (f.circle.hasOwnProperty('radius')) {
						pointRadius = f.circle.radius;
					}
					if (f.circle.hasOwnProperty('color')) {
						pointFillColor = utils.rgbaToHex(f.circle.color);
					}
					if (f.circle.hasOwnProperty('source')) {
						pointSrc = f.circle.source;
					}
				}
		
				if (f.hasOwnProperty('label')) {
					if (f.label.hasOwnProperty('align')) {
						labelAlign = f.label.align;
					}
					if (f.label.hasOwnProperty('outlineColor')) {
						labelOutlineColor = utils.rgbaToHex(f.label.outlineColor);
					}
					if (f.label.hasOwnProperty('outlineWidth')) {
						labelOutlineWidth = f.label.outlineWidth;
					}
				}
		
				if (f.hasOwnProperty('font')) {
					if (f.font.hasOwnProperty('size')) {
						fontSize = f.font.size;
					}
					if (f.font.hasOwnProperty('color')) {
						fontColor = utils.rgbaToHex(f.font.color);
					}
					if (f.font.hasOwnProperty('backColor')) {
						fontBackColor = utils.rgbaToHex(f.font.backColor);
					}
				}
			});
		});

	}
	console.log('fillColor', fillColor);
	console.log('strokeColor', strokeColor);
    return printableLayers;
}

function executeMapfishCall(url, data) {
	var body = JSON.stringify(data);
	var startTime = new Date().getTime();
	$.ajax({
		type: 'POST',
		url: url,
		data: body,
		contentType: 'application/json',
		dataType: 'json',
		success: function (data) {
			console.log('SUCCESS', data);
			downloadWhenReady(startTime, $.parseJSON(JSON.stringify(data)));
		},
		error: function (data) {
			console.log('Error creating report: ' + data.statusText);
		}
	});
}

function printMap(settings) {
	var url = config.printCreate;
	executeMapfishCall(url, convertToMapfishOptions(settings));
}

module.exports.printMap = printMap;

