"use strict";

module.exports = function imageresizer(imageData, opt_options, callback) {
  var options = opt_options;
  var image = new Image();

  image.onload = function(imageEvent) {
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    var max_size = options.maxSize || 600;
    var width = image.width;
    var height = image.height;
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
    context.translate(canvas.width,canvas.height);
    context.rotate(180*Math.PI/180);
    context.drawImage(image, 0, 0, width, height);
    dataUrl = canvas.toDataURL('image/jpeg');
    callback(dataUrl);
  }

  image.src = imageData;
}
