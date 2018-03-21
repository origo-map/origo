var $ = require('jquery');
var printMenu = require('./printmenu');
var config = require('../../conf/origoConfig');

function downloadWhenReady(startTime, data) {
	if ((new Date().getTime() - startTime) > 30000) {
		console.log(('Gave up waiting after 30 seconds'))
	} else {
		setTimeout(function () {
			$.getJSON(config.geoserverPath + data.statusURL, function (statusData) {
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
		srs: "EPSG:3857", //TODO
		units: "m", //TODO
		outputFilename: "kartutskrift",
		outputFormat: options.outputFormat,
		layers: [],
		pages: [{
			comment: "Kommentar",
			mapTitle: options.title,
			center: options.center,
			scale: 25000,
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
        return layer.S.group === "background";
    });
    console.log('background', backgroundLayer);

    //assemble object to be pushed to layers. backgroundLayer will always contain 1 element
    var backgroundLayerObject = {
      type: backgroundLayer[0].S.type,
      baseURL: backgroundLayer[0].S.source.R,
      format: backgroundLayer[0].S.source.f.FORMAT,
      layers: [backgroundLayer[0].S.name]
    };
    //push background to layers array
    mapfishOptions.layers.push(backgroundLayerObject);

    //filter background map from remaining layers.
    layers = layers.filter(function(layer) {
        return layer.S.group !== "background"
    });

    //return array of Object[] filtered by baseURL and/or type
    var wmsLayers = buildLayersObjects(layers.filter(function(layer) { return typeof layer.S.name != "undefined" }), "WMS");
    var wfsLayers = buildLayersObjects(layers.filter(function(layer) { return typeof layer.S.name != "undefined" }), "WFS");
    console.log('wmsLayers', wmsLayers);
    console.log('wfsLayers', wfsLayers);

    if (wmsLayers.length !== 0) {
        wmsLayers.forEach(function(layer) {
            mapfishOptions.layers.push(layer);
        });
    }
    if (wfsLayers.length !== 0) {
        wmsLayers.forEach(function(layer) {
            mapfishOptions.layers.push(wfsLayers);
        });
    }
	console.log('mapfishOptions', mapfishOptions);
	return mapfishOptions;
}

/**
 * 
 * @param {(Object[])} layers 
 */
function buildLayersObjects(layers, type) {
    //Filter layers by type
    var wmsLayers = layers.filter(function (layer) {
        return layer.S.type === type;
    });
	
	//Build objects from separate sources
    var printableLayers = [];
    var printIndex = null;
    wmsLayers.forEach(function(layer) {
        printIndex = printableLayers.findIndex(l => l.baseURL === layer.S.source.R);
        if (printIndex !== -1) {
            printableLayers[printIndex].layers.push(layer.S.name);
        } else {
            printableLayers.push({
                type: layer.S.type,
                baseURL: layer.S.source.R,
                format: layer.S.source.f.FORMAT,
                layers: [layer.S.name]
            });
        }
    });

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
	var url = 'http://localhost:8080/geoserver/pdf/create.json' //TODO
	executeMapfishCall(url, convertToMapfishOptions(settings));
}

module.exports.printMap = printMap;