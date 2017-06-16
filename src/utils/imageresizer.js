"use strict";

module.exports = function imageresizer(imageData, opt_options, orientation, callback) {
  var fileType = imageData.split(';')[0].split('/')[1];
  var options = opt_options;
  var image = new Image();

  image.onload = function(imageEvent) {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var max_size = options.maxSize || 600;
    var width = image.width;
    var height = image.height;
    var translateWidth;
    var translateHeight;
    var rotation;
    var dataUrl;

    if (width > height) {
      if (width > max_size) {
        height *= max_size / width;
        width = max_size;
      }
    } else {
      if (height > max_size) {
        width *= max_size / height;
        height = max_size;
      }
    }

    canvas.width = width;
    canvas.height = height;

    if (orientation%2 === 0) {
      canvas.width = height;
      canvas.height = width;
    }

    switch (orientation) {
      case 1:
        translateWidth = 0;
        translateHeight = 0;
        rotation = 0;
        break;
      case 3:
        translateWidth = canvas.width;
        translateHeight = canvas.height;
        rotation = 180;
        break;
      case 6:
        translateWidth = canvas.width;
        translateHeight = 0;
        rotation = 90;
        break;
      case 8:
        translateWidth = 0;
        translateHeight = canvas.height;
        rotation = 270;
        break;
      default:
        translateWidth = 0;
        translateHeight = 0;
        rotation = 0;
        break;
    }

    context.translate(translateWidth,translateHeight);
    context.rotate(rotation*Math.PI/180);
    context.drawImage(image, 0, 0, width, height);
    dataUrl = canvas.toDataURL('image/' + fileType);
    callback(dataUrl);
  }

  image.src = imageData;
}
