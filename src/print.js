 /* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var viewer = require('./viewer');
var utils = require('./utils');

var settings = {
    printWith: 800
};
var printButton;

var map;

function init() {
    map = viewer.getMap();

    var el = utils.createListButton({
        id: 'print',
        iconCls: 'mdk-icon-fa-print',
        src: 'css/svg/fa-icons.svg#fa-print',
        text: 'Skriv ut'
    });
    $('#menutools').append(el);
    printButton = $('#print-button');

    bindUIActions();
}
function bindUIActions() {
    printButton.on('touchend click', function(e) {
        $('#app-wrapper').append('<canvas id="print" style="display: none"></canvas>');
        createImage();
        e.preventDefault();
    });
}
function imageToPrint(printCanvas) {
    var imageCrop = new Image();
    try {
        imageCrop.src = printCanvas.get(0).toDataURL("image/png");
    }
    catch (e) {
        console.log(e);
    }
    finally {
        var pw = '<html><head><link href="img/print.css" rel="stylesheet"></head><body>';
        pw += '<div class="print-logo"><img src="print/logo_print.png"></div>';
        pw += '<div class="map-canvas"><img src="' + imageCrop.src + '"/></div>';
        pw += '<div class="print-attribution">&copy&nbsp;Lantmäteriet&nbsp;Geodatasamverkan</div>'
        pw += '</body></html>';
        var logoUrl = '&quot;css/logo_print.png&quot;';
        var printWindow = window.open('','','width=800,height=820');
        printWindow.document.write(pw);
        printWindow.document.close();
        setTimeout(function() {
            printWindow.print();
            setTimeout(function(){
                printWindow.close();
                $('#print').remove();
            }, 10);
        },200);
    }
}
function createImage() {
    var canvas = $('canvas');
    var image = new Image();
    // image.crossOrigin = 'Anonymous';

    try {
        var imageUrl = canvas.get(0).toDataURL("image/png");
    }
    catch (e) {
        console.log(e);
    }
    finally {
      // printCanvas = copy of original map canvas
      var printCanvas = $('#print');
      image.onload = function() {
          var ctxCanvas = printCanvas[0].getContext('2d');
          var sourceWidth = canvas[0].width; //width of map canvas
          var sourceHeight = canvas[0].height; //height of map canvas
          //set the width of print canvas
          if (sourceWidth < settings.printWith) {
            printCanvas[0].width = sourceWidth;
          }
          else if (sourceWidth >= settings.printWith) {
            printCanvas[0].width = settings.printWith;
          }
          //set the height of print canvas
          if (sourceHeight < settings.printWith) {
            printCanvas[0].height = sourceHeight;
          }
          else if (sourceWidth >= settings.printWith) {
            printCanvas[0].height = settings.printWith;
          }

          ctxCanvas.drawImage(image, (sourceWidth/2 - printCanvas[0].width/2), 0, printCanvas[0].width, printCanvas[0].height, 0, 0, printCanvas[0].width, printCanvas[0].height);
          imageToPrint(printCanvas);
      };
      image.src = imageUrl;
    }
}

module.exports.init = init;
