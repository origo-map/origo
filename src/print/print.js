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

function printMap(settings) {
    var _data = JSON.stringify(spec);
    var appId = 'json_styling';
    var format = 'png';
    var startTime = new Date().getTime();

    $.ajax({
        type: 'POST',
        url: 'http://localhost:8080/print/print/' + appId + '/report.' + format,
        data: _data,
        dataType: 'json',
        success: function (data) {
            downloadWhenReady(startTime, $.parseJSON(JSON.stringify(data)));
        },
        error: function (data) {
            console.log('Error creating report: ' + data.statusText);
        }
    });
}

module.exports.printMap = printMap;