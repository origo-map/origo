import ScaleLine from 'ol/control/ScaleLine';
import viewer from '../viewer';

let map;

function init(optOptions) {
  const options = optOptions || {};
  const target = options.target || 'o-tools-bottom';
  map = viewer.getMap();

  const scaleLine = new ScaleLine({
    target
  });
  map.addControl(scaleLine);
}

export default { init };
