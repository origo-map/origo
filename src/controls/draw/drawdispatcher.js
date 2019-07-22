import $ from 'jquery';

function emitToggleDraw(tool, optOptions) {
  const options = optOptions || {};
  const e = {
    type: 'toggleDraw',
    tool
  };
  $.extend(e, options);
  $.event.trigger(e);
}

function emitChangeDraw(tool, state) {
  $.event.trigger({
    type: 'changeDraw',
    tool,
    active: state
  });
}

function emitEnableDrawInteraction() {
  $('.o-map').first().trigger({
    type: 'enableInteraction',
    interaction: 'draw'
  });
}

function emitDisableDrawInteraction() {
  $('.o-map').first().trigger({
    type: 'enableInteraction',
    interaction: 'featureinfo'
  });
}

export default {
  emitToggleDraw,
  emitChangeDraw,
  emitEnableDrawInteraction,
  emitDisableDrawInteraction
};
