import $ from 'jquery';
import viewer from './viewer';
import utils from './utils';

let map;
let tooltip;
let extent;

function init(opt_options) {
  const options = opt_options || {};
  const target = options.target || '#o-toolbar-navigation';
  map = viewer.getMap();
  tooltip = options.tooltipText || 'Zooma till hela kartan';
  extent = options.extent || map.getView().calculateExtent(map.getSize());
  render(target);
  bindUIActions();
}

function render(target) {
  const el = utils.createButton({
    id: 'o-home-button',
    iconCls: 'o-icon-fa-home',
    src: '#fa-home',
    tooltipText: tooltip
  });
  $(target).append(el);
}

function bindUIActions() {
  $('#o-home-button').on('click', (e) => {
    map.getView().fit(extent);
    $('#o-home-button button').blur();
    e.preventDefault();
  });
}

export default {
  init
};
