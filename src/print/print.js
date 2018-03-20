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
 * @param {values passed from print panel} options 
 */
function convertToMapfishOptions(options) {
	console.log("options", options);
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
			dpi: 75,
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

	var layerNames = layers.map(function(layer) {
		return layer.S.name;
	});

	mapfishOptions.layers.push({
		type: "WMS",
		baseURL: 'http://gi.karlstad.se/geoserver/wms',
		format: 'image/png',
		layers: ["topowebbkartan"]
	})
	mapfishOptions.layers.push({
		type: 'WMS',
		baseURL: 'http://localhost:8080/geoserver/wms',
		format: "image/png",
		layers: ["varmland:al_17", "varmland:as_17", "varmland:bl_17"]//layerNames.filter(function(name) {return typeof name !== "undefined" || name === 'topowebbkartan'})
	});
	
	return mapfishOptions;
}

//returnera array med objekt per tjänsttyp (wms, wfs)
function buildObjectTypes(layers) {

}

function executeMapfishCall(url, data) {
	var body = JSON.stringify(data);
	var startTime = new Date().getTime();
	console.log('data', data);
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