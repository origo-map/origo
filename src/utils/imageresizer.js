"use strict";

module.exports = function imageresizer(imageData, opt_options, callback) {
  var options = opt_options;
  var image = new Image();

  image.onload = function(imageEvent) {
    var canvas = document.createElement('canvas');
    var max_size = options.maxSize || 600;
    var width = image.width;
    var height = image.height;

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
    canvas.getContext('2d').drawImage(image, 0, 0, width, height);
    var dataUrl = canvas.toDataURL('image/jpeg');
    callback(dataUrl);
  }

  image.src = imageData;
}
