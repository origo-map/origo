import Rotate from 'ol/control/rotate';
import $ from 'jquery';
import viewer from '../src/viewer';
import utils from '../src/utils';

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
