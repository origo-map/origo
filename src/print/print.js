var $ = require('jquery');
var printMenu = require('./printmenu');
var config = require('../../conf/origoConfig');

var _contract = {
    url: "http://localhost:8080/geoserver/wms",
    dpi: 72,
    layers: ["forshaga:lekplatser"],
    imageFormat: "image/png",
    scale: 5000,
    orientation: "landscape",
    size: "A4",
    title: "Kartans titel",
    template: "Mallnamn eller id eller nåt"
};

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
 * @param {values picked up from gui} options 
 */
function convertToMapfishOptions(options) {
    var dpi = parseInt(options.dpi.split(' ')[0]);
    var scale = parseInt(options.scale.split(/[: ]/).pop());

    var mapfishOptions = {
        attributes: {
            map: {
                center: options.center,
                dpi: dpi,
                layers: [],
                projection: 'EPSG:3857',
                rotation: 0,
                scale: scale
            }
        },
        layout: "A4 landscape"
    }

    mapfishOptions.attributes.map.layers.push({
        baseURL: 'http://localhost:8080/geoserver/wms/',
        imageFormat: 'image/png',
        layers: ['forshaga:lekplats'],
        opacity: 1,
        serverType: 'geoserver',
        type: 'WMS'
    });
    return mapfishOptions;
}

function executeMapfishCall(url, data) {
    debugger;
    var startTime = new Date().getTime();
    $.ajax({
        type: 'POST',
        url: url,
        data: JSON.stringify(data),
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
    console.log('settings', settings);
    var appId = 'printwms_archsites_server_type';
    var format = settings.imageFormat.toLowerCase();
    
    var url = 'http://localhost:8080/print/print/' + appId + '/report.' + format;
    executeMapfishCall(url, convertToMapfishOptions(settings));
}

module.exports.printMap = printMap;