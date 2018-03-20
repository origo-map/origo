var $ = require('jquery');
var printMenu = require('./printmenu');
var config = require('../../conf/origoConfig');

var spec = {
	attributes: {
		map: {
			center: [
				602602,
				4915620
			],
			dpi: 72,
			layers: [{
				baseURL: "http://localhost:8080/geoserver/wms",
				customParams: {
					"TRANSPARENT": "true"
				},
				imageFormat: "image/png",
				layers: ["forshaga:lekplatser"],
				opacity: 1,
				serverType: "geoserver",
				type: "WMS"
			}],
			projection: "EPSG:3857",
			rotation: 0,
			scale: 258000
		}
	},
	layout: "A4 landscape"
};

function downloadWhenReady(startTime, data) {
	if ((new Date().getTime() - startTime) > 3000) {
		console.log(('Gave up waiting after 3 seconds'))
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
	var dpi = parseInt(options.dpi.split(' ')[0]);
	var scale = parseInt(options.scale.split(/[: ]/).pop());
	var layers = options.layers;
	
	var mapfishOptions = {
		layout: "A4 portrait",				//TODO
		srs: "EPSG:3857",						//TODO
		units: "m",						//TODO
		outputFilename: "kartutskrift",
		outputFormat: "pdf",
		layers: [],
		pages: [{
			comment: "Kommentar",
			mapTitle: "Karttitel",
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
		type: 'WMS',
		baseURL: 'http://localhost:8080/geoserver/wms',
		format: "image/png",
		layers: layerNames.filter(function(name) {return typeof name !== "undefined"})
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