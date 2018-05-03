import Attribution from 'ol/control/Attribution';
import $ from 'jquery';
import viewer from './viewer';

let map;

function init(opt) {
  const options = opt || {};
  const breakPoint = options.breakPoint || [768, 500];
  map = viewer.getMap();

  const attribution = new Attribution({
    collapsible: false
  });

  map.addControl(attribution);

  $(window).on('resize', checkSize);
  checkSize();

  function checkSize() {
    const mapSize = map.getSize();
    const collapsed = (mapSize[0] <= breakPoint[0] || mapSize[1] <= breakPoint[1]);
    attribution.setCollapsible(collapsed);
    attribution.setCollapsed(collapsed);
  }
}

export default init;
