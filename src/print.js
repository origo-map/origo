 /* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var $ = require('jquery');
var Viewer = require('./viewer');
var utils = require('./utils');
var template = require("./templates/print.handlebars");

var printWith = 800;
var $printButton;
var attribution;
var map;

function Init(opt_options) {
  var options = opt_options || {};
  attribution = options.attribution || '© Lantmäteriet Geodatasamverkan';
  map = Viewer.getMap();

  render();
  bindUIActions();
}

function render() {
  var el = utils.createListButton({
    id: 'o-print',
    iconCls: 'o-icon-fa-print',
    src: 'css/svg/fa-icons.svg#fa-print',
    text: 'Skriv ut'
  });
  $('#o-menutools').append(el);
  $printButton = $('#o-print-button');
}

function bindUIActions() {
  $printButton.on('click', function(e) {
    $('#app-wrapper').append('<canvas id="o-print" style="display: none"></canvas>');
    createImage();
    e.preventDefault();
  });
}

function imageToPrint(printCanvas) {
  var imageCrop = new Image();
  try {
    imageCrop.src = printCanvas.get(0).toDataURL("image/png");
  } catch (e) {
    console.log(e);
  } finally {
    var templateOptions = {};
    templateOptions.src = imageCrop.src;
    templateOptions.attribution = attribution;
    var pw = template(templateOptions);
    var printWindow = window.open('', '', 'width=800,height=820');
    printWindow.document.write(pw);
    printWindow.document.close();
    setTimeout(function() {
      printWindow.print();
      setTimeout(function() {
        printWindow.close();
        $('#o-print').remove();
      }, 10);
    }, 200);
  }
}

function createImage() {
  var $canvas = $('canvas');
  var image = new Image();

  try {
    var imageUrl = $canvas.get(0).toDataURL("image/png");
  } catch (e) {
    console.log(e);
  } finally {

    // printCanvas = copy of original map canvas
    var printCanvas = $('#o-print');
    image.onload = function() {
      var ctxCanvas = printCanvas[0].getContext('2d');

       //width of map canvas
      var sourceWidth = $canvas[0].width;

      //height of map canvas
      var sourceHeight = $canvas[0].height;

      //set the width of print canvas
      if (sourceWidth < printWith) {
        printCanvas[0].width = sourceWidth;
      } else if (sourceWidth >= printWith) {
        printCanvas[0].width = printWith;
      }

      //set the height of print canvas
      if (sourceHeight < printWith) {
        printCanvas[0].height = sourceHeight;
      } else if (sourceWidth >= printWith) {
        printCanvas[0].height = printWith;
      }

      ctxCanvas.drawImage(image, (sourceWidth / 2 - printCanvas[0].width / 2), 0, printCanvas[0].width, printCanvas[0].height, 0, 0, printCanvas[0].width, printCanvas[0].height);
      imageToPrint(printCanvas);
    };
    image.src = imageUrl;
  }
}

module.exports.init = Init;
