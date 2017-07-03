"use strict";

module.exports = function getimageorientation(file, callback) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var view = new DataView(e.target.result);
    var length;
    var offset;
    var marker;
    var little;
    var tags;

    if (view.getUint16(0, false) != 0xFFD8) {
      return callback(-2);
    }

    length = view.byteLength;
    offset = 2;
    while (offset < length) {
      marker = view.getUint16(offset, false);
      offset += 2;
      if (marker == 0xFFE1) {
        if (view.getUint32(offset += 2, false) != 0x45786966) {
          return callback(-1);
        }

        little = view.getUint16(offset += 6, false) == 0x4949;
        offset += view.getUint32(offset + 4, little);
        tags = view.getUint16(offset, little);
        offset += 2;
        for (var i = 0; i < tags; i++) {
          if (view.getUint16(offset + (i * 12), little) == 0x0112) {
            return callback(view.getUint16(offset + (i * 12) + 8, little));
          }
        }

      } else if ((marker & 0xFF00) != 0xFF00) {
        break;
      } else {
        offset += view.getUint16(offset, false);
      }
    }

    return callback(-1);
  };
  reader.readAsArrayBuffer(file);
}
