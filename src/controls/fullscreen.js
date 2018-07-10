import $ from 'jquery';
import utils from '../utils';
import permalink from '../permalink/permalink';
import isEmbedded from '../utils/isembedded';
import viewer from '../viewer';

let tooltip;
let mapTarget;

function goFullScreen() {
  const url = permalink.getPermalink();
  window.open(url);
}

function render(target) {
  const el = utils.createButton({
    id: 'o-fullscreen-button',
    cls: 'o-fullscreen-button',
    iconCls: 'o-icon-fa-expand',
    src: '#fa-expand',
    tooltipText: tooltip,
    tooltipPlacement: 'east'
  });
  if (isEmbedded(mapTarget)) {
    $(target).append(el);
  }
}

function bindUIActions() {
  $('#o-fullscreen-button button').click((e) => {
    goFullScreen();
    $('#o-fullscreen-button button').blur();
    e.preventDefault();
  });
}

function init(optOptions) {
  const options = optOptions || {};
  const target = options.target || '#o-toolbar-misc';
  mapTarget = viewer.getTarget();
  tooltip = options.tooltipText || 'Visa stor karta';

  render(target);
  bindUIActions();
}

export default { init };
