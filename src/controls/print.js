import $ from 'jquery';
import viewer from '../viewer';
import utils from '../utils';
import template from './print/printtemplate';

let $printButton;
let attribution;
let baseUrl;

function imageToPrint($printCanvas) {
  const imageCrop = new Image();
  try {
    imageCrop.src = $printCanvas.get(0).toDataURL('image/png');
  } catch (e) {
    console.log(e);
  } finally {
    const templateOptions = {};
    templateOptions.src = imageCrop.src;
    templateOptions.attribution = attribution;
    templateOptions.logoSrc = `${baseUrl}css/png/logo_print.png`;
    const pw = template(templateOptions);
    const printWindow = window.open('', '', 'width=800,height=820');
    printWindow.document.write(pw);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      setTimeout(() => {
        printWindow.close();
        $('#o-print').remove();
      }, 10);
    }, 200);
  }
}

function createImage() {
  const $canvas = $('canvas');
  const image = new Image();
  let imageUrl;

  try {
    imageUrl = $canvas.get(0).toDataURL('image/png');
  } catch (e) {
    console.log(e);
  } finally {
    // $printCanvas = copy of original map canvas
    const $printCanvas = $('#o-print');
    image.onload = function imageonload() {
      const printWidth = 800;
      const ctxCanvas = $printCanvas[0].getContext('2d');

      // width of map canvas
      const sourceWidth = $canvas[0].width;

      // height of map canvas
      const sourceHeight = $canvas[0].height;

      // set the width of print canvas
      if (sourceWidth < printWidth) {
        $printCanvas[0].width = sourceWidth;
      } else if (sourceWidth >= printWidth) {
        $printCanvas[0].width = printWidth;
      }

      // set the height of print canvas
      if (sourceHeight < printWidth) {
        $printCanvas[0].height = sourceHeight;
      } else if (sourceWidth >= printWidth) {
        $printCanvas[0].height = printWidth;
      }

      ctxCanvas.drawImage(image, ((sourceWidth / 2) - ($printCanvas[0].width / 2)), 0, $printCanvas[0].width, $printCanvas[0].height, 0, 0, $printCanvas[0].width, $printCanvas[0].height);
      imageToPrint($printCanvas);
    };
    image.src = imageUrl;
  }
}

function render() {
  const el = utils.createListButton({
    id: 'o-print',
    iconCls: 'o-icon-fa-print',
    src: '#fa-print',
    text: 'Skriv ut'
  });
  $('#o-menutools').append(el);
  $printButton = $('#o-print-button');
}

function bindUIActions() {
  $printButton.on('click', (e) => {
    $('#app-wrapper').append('<canvas id="o-print" style="display: none"></canvas>');
    createImage();
    e.preventDefault();
  });
}

function init(opt) {
  const options = opt || {};
  attribution = options.attribution || '© Lantmäteriet Geodatasamverkan';
  baseUrl = viewer.getBaseUrl();

  render();
  bindUIActions();
}

export default { init };
