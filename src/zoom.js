import Zoom from 'ol/control/Zoom';
import $ from 'jquery';
import viewer from './viewer';

<<<<<<< HEAD
export default function init(opt_options) {
=======
const init = function init(opt_options) {
>>>>>>> 2b8851f2b1a8758cb20255751599b857ebc37157
  const options = opt_options || {};
  const target = options.target || 'o-toolbar-navigation';
  const map = viewer.getMap();

  const zoomControl = new Zoom({
    zoomInTipLabel: ' ',
    zoomOutTipLabel: ' ',
    zoomInLabel: $.parseHTML('<svg class="o-icon-fa-plus"><use xlink:href="#fa-plus"></use></svg>')[0],
    zoomOutLabel: $.parseHTML('<svg class="o-icon-fa-minus"><use xlink:href="#fa-minus"></use></svg>')[0],
    target
  });
  map.addControl(zoomControl);
}

export default { init };
