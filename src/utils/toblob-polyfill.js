/* eslint-disable object-shorthand */
/* eslint-disable prefer-spread */
/* eslint-disable prefer-rest-params */
/* eslint-disable curly */
/* eslint-disable no-param-reassign */
/* eslint-disable comma-style */
/* eslint-disable no-multi-spaces */
/* eslint-disable space-infix-ops */
/* eslint-disable no-plusplus */
/* eslint-disable no-bitwise */
/* eslint-disable no-mixed-operators */
/* eslint-disable func-names */
/* eslint-disable camelcase */
/* canvas-toBlob.js
 * A canvas.toBlob() implementation.
 * 2016-05-26
 *
 * By Eli Grey, http://eligrey.com and Devin Samarin, https://github.com/eboyjr
 * License: MIT
 *   See https://github.com/eligrey/canvas-toBlob.js/blob/master/LICENSE.md
 */

/*! @source http://purl.eligrey.com/github/canvas-toBlob.js/blob/master/canvas-toBlob.js */

export default function () {
  const Uint8Array = window.Uint8Array;
  const HTMLCanvasElement = window.HTMLCanvasElement;
  const canvas_proto = HTMLCanvasElement && HTMLCanvasElement.prototype;
  const is_base64_regex = /\s*;\s*base64\s*(?:;|$)/i;
  let to_data_url = 'toDataURL';
  let base64_ranks;
  const decode_base64 = function (base64) {
    let len = base64.length;
    const buffer = new Uint8Array(len / 4 * 3 | 0);
    let i = 0;
    let outptr = 0;
    const last = [0, 0];
    let state = 0;
    let save = 0;
    let rank;
    let code;
    let undef;
    while (len--) {
      code = base64.charCodeAt(i++);
      rank = base64_ranks[code-43];
      if (rank !== 255 && rank !== undef) {
        last[1] = last[0];
        last[0] = code;
        save = (save << 6) | rank;
        state++;
        if (state === 4) {
          buffer[outptr++] = save >>> 16;
          if (last[1] !== 61 /* padding character */) {
            buffer[outptr++] = save >>> 8;
          }
          if (last[0] !== 61 /* padding character */) {
            buffer[outptr++] = save;
          }
          state = 0;
        }
      }
    }
    // 2/3 chance there's going to be some null bytes at the end, but that
    // doesn't really matter with most image formats.
    // If it somehow matters for you, truncate the buffer up outptr.
    return buffer;
  };
  if (Uint8Array) {
    base64_ranks = new Uint8Array([
      62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1
      , -1, -1,  0, -1, -1, -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9
      , 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25
      , -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35
      , 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
    ]);
  }
  if (HTMLCanvasElement && (!canvas_proto.toBlob || !canvas_proto.toBlobHD)) {
    if (!canvas_proto.toBlob)
      canvas_proto.toBlob = function (callback, type) {
        if (!type) {
          type = 'image/png';
        } if (this.mozGetAsFile) {
          callback(this.mozGetAsFile('canvas', type));
          return;
        } if (this.msToBlob && /^\s*image\/png\s*(?:$|;)/i.test(type)) {
          callback(this.msToBlob());
          return;
        }

        const args = Array.prototype.slice.call(arguments, 1);
        const dataURI = this[to_data_url].apply(this, args);
        const header_end = dataURI.indexOf(',');
        const data = dataURI.substring(header_end + 1);
        const is_base64 = is_base64_regex.test(dataURI.substring(0, header_end));
        let blob;

        if (Blob.fake) {
        // no reason to decode a data: URI that's just going to become a data URI again
          blob = new Blob();
          if (is_base64) {
            blob.encoding = 'base64';
          } else {
            blob.encoding = 'URI';
          }
          blob.data = data;
          blob.size = data.length;
        } else if (Uint8Array) {
          if (is_base64) {
            blob = new Blob([decode_base64(data)], { type: type });
          } else {
            blob = new Blob([decodeURIComponent(data)], { type: type });
          }
        }
        callback(blob);
      };

    if (!canvas_proto.toBlobHD && canvas_proto.toDataURLHD) {
      canvas_proto.toBlobHD = function () {
        to_data_url = 'toDataURLHD';
        const blob = this.toBlob();
        to_data_url = 'toDataURL';
        return blob;
      };
    } else {
      canvas_proto.toBlobHD = canvas_proto.toBlob;
    }
  }
}
