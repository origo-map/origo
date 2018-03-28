var $ = require('jquery');
var printMenu = require('./printmenu');
var config = require('../../conf/origoConfig');
var ol = require('openlayers');
var viewer = require('../viewer');


function downloadWhenReady(startTime, data) {
	if ((new Date().getTime() - startTime) > 30000) {
		console.log(('Gave up waiting after 30 seconds'))
	} else {
		setTimeout(function () {
			$.getJSON(config.geoserverPath + data.statusURL, function (statusData) { //TODO
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
	
	var mapfishOptions = {
		layout: options.layout,
		srs: "EPSG:3006", //TODO
		units: "m", //TODO
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
	//    console.log("ol.source.TileWMS:", backgroundLayer.getSource() instanceof ol.source.TileWMS)
	//    console.log("ol.source.ImageWMS:", backgroundLayer.getSource() instanceof ol.source.ImageWMS)

	// 	console.log("urls", backgroundLayer.getSource().getUrls()); //TileWms array
	// 	//console.log("urls", backgroundLayer.getSource().getUrl()); //TileWms
	// 	console.log("params", backgroundLayer.getSource().getParams());
		
		var url;
		if (backgroundLayer.getSource() instanceof ol.source.TileWMS) {
			url = backgroundLayer.getSource().getUrls()[0];
		} else if (backgroundLayer.getSource() instanceof ol.source.ImageWMS) {
			url = backgroundLayer.getSource().getUrl(); //String
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
		console.log('backgroundLayer', backgroundLayerObject);
	} else {
		//tom
	}
    //push background to layers array

    //filter background map from remaining layers.
    layers = layers.filter(function(layer) {
        return layer.get('group') !== "background"
    });

    //return array of Object[] filtered by baseURL and/or type
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
	//Filter layers by type
	var layers = inLayers.filter(function (layer) {
		return layer.get("type") === type;
	});

	
	var printableLayers = [];
	var printIndex = null;
	switch(type) {
		case 'WMS':

		// var url;
		// if (backgroundLayer.getSource() instanceof ol.source.TileWMS) {
		// 	url = backgroundLayer.getSource().getUrls();
		// } else if (backgroundLayer.getSource() instanceof ol.source.ImageWMS) {
		// 	url = backgroundLayer.getSource().getUrl();
		// } else {
		// 	console.log('Bakgrundslager är av okänd bildtyp: ', backgroundLayer.getSource);
		// }
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
				var styleName = layer.get('styleName');
				var styleSettings = viewer.getStyleSettings()[styleName];
				styleSettings = styleSettings[0][0];
				
				 
				var geojson  = new ol.format.GeoJSON();
				var source = layer.getSource();
				var features = source.getFeatures();
				
				var style = new ol.style.Style({
					image: new ol.style.Stroke({
					  fill: new ol.style.Fill({
						color: [0, 153, 255, 1]
					  }),
					  stroke: new ol.style.Stroke({
						color: [255, 255, 255, 0.75],
						width: 1.5
					  })
					}),
					zIndex: 100000
				  });

				features.forEach(function(feature) {
					feature.setProperties({'_gx_style': 0})
				});

				var data = geojson.writeFeatures(features, {featureProjection: "EPSG:3006", dataProjection: "EPSG:3006"});
				printableLayers.push({
					type: 'vector',
					geoJson: JSON.parse(data),
					name: layer.get('name'),
					styleProperty: "_gx_style",
					styles: {0: {
						fillColor: "red",
						fillOpacity: 1,
						strokeColor: "red",
						strokeWidth: 2
					}}

				});
			});
		break;
	}
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