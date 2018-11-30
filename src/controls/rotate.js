import Rotate from 'ol/control/Rotate';
import $ from 'jquery';
import viewer from '../viewer';
import utils from '../utils';

let map;

function init() {
  const icon = utils.createSvg({
    href: '#origo-compass',
    cls: 'o-icon-compass'
  });
  map = viewer.getMap();

  const rotateControl = new Rotate({
    label: $.parseHTML(`<span>${icon}</span>`)[0],
    tipLabel: ' ',
    target: 'o-toolbar-misc'
  });
  map.addControl(rotateControl);
}

export default { init };
