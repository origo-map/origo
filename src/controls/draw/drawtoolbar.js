import dispatcher from './drawdispatcher';
import drawTemplate from './drawtemplate';
import drawHandler from './drawhandler';
import drawExtraTools from './drawtools';

const activeClass = 'o-control-active';
let $drawPolygon;
let $drawLineString;
let $drawPoint;
let $drawText;
let $drawStyle;
let $drawDelete;
let $drawClose;
let drawTools;
let target;
let viewer;

function render() {
  const div = document.createElement('div');
  div.innerHTML = drawTemplate;
  document.getElementById(target).appendChild(div);
  $drawPolygon = document.getElementById('o-draw-polygon');
  $drawLineString = document.getElementById('o-draw-polyline');
  $drawPoint = document.getElementById('o-draw-point');
  $drawText = document.getElementById('o-draw-text');
  $drawStyle = document.getElementById('o-draw-style');
  $drawDelete = document.getElementById('o-draw-delete');
  $drawClose = document.getElementById('o-draw-close');
  drawTools = {
    Point: $drawPoint,
    Linje: $drawLineString,
    Polygon: $drawPolygon,
    Text: $drawText
  };
}

function bindUIActions() {
  $drawDelete.addEventListener('click', (e) => {
    dispatcher.emitToggleDraw('delete');
    $drawDelete.blur();
    e.preventDefault();
  });
  $drawPolygon.addEventListener('click', (e) => {
    dispatcher.emitToggleDraw('Polygon', true);
    $drawPolygon.blur();
    e.preventDefault();
  });
  $drawLineString.addEventListener('click', (e) => {
    dispatcher.emitToggleDraw('LineString');
    $drawLineString.blur();
    e.preventDefault();
  });
  $drawPoint.addEventListener('click', (e) => {
    dispatcher.emitToggleDraw('Point');
    $drawPoint.blur();
    e.preventDefault();
  });
  $drawText.addEventListener('click', (e) => {
    dispatcher.emitToggleDraw('Text');
    $drawText.blur();
    e.preventDefault();
  });
  $drawStyle.addEventListener('click', (e) => {
    const stylewindowEl = document.getElementById('o-draw-stylewindow');
    stylewindowEl.classList.toggle('hidden');
    $drawStyle.blur();
    e.preventDefault();
  });
  $drawClose.addEventListener('click', (e) => {
    const stylewindowEl = document.getElementById('o-draw-stylewindow');
    stylewindowEl.classList.add('hidden');
    dispatcher.emitDisableDrawInteraction();
    $drawClose.blur();
    e.stopPropagation();
    e.preventDefault();
    // For Origo to be able to react properly based on new event system
    document.dispatchEvent(new CustomEvent('toggleInteraction', {
      bubbles: true,
      detail: {
        interaction: 'featureInfo'
      }
    }));
  });
}

function setActive(state) {
  if (state === true) {
    viewer.dispatch('toggleClickInteraction', { name: 'featureinfo', active: false });
    document.getElementById('o-draw-toolbar').classList.remove('o-hidden');
  } else {
    viewer.dispatch('toggleClickInteraction', { name: 'featureinfo', active: true });
    document.getElementById('o-draw-toolbar').classList.add('o-hidden');
  }
}

function onEnableInteraction(e) {
  const toolbarEl = document.getElementById('o-draw-toolbar');
  if (e.detail.interaction === 'draw') {
    setActive(true);
  } else if (drawHandler.isActive() && !toolbarEl.classList.contains('o-hidden') && e.detail.interaction !== 'featureInfo') {
    const stylewindowEl = document.getElementById('o-draw-stylewindow');
    stylewindowEl.classList.add('hidden');
    toolbarEl.classList.add('o-hidden');
    drawHandler.getSelection().clear();
    dispatcher.emitToggleDraw('cancel');
  } else if (drawHandler.isActive() && !toolbarEl.classList.contains('o-hidden')) {
    const stylewindowEl = document.getElementById('o-draw-stylewindow');
    stylewindowEl.classList.add('hidden');
    drawHandler.getSelection().clear();
    dispatcher.emitToggleDraw('cancel');
    setActive(false);
  }
}

function toggleState(tool, state) {
  if (state === false) {
    tool.classList.remove(activeClass);
  } else {
    tool.classList.add(activeClass);
  }
}

function changeDrawState(e) {
  const tools = Object.getOwnPropertyNames(drawTools);
  tools.forEach((tool) => {
    if (tool === e.detail.tool) {
      toggleState(drawTools[tool], e.detail.active);
    } else {
      toggleState(drawTools[tool], false);
    }
  });
}

function getState() {
  return drawHandler.getState();
}

function restoreState(params) {
  if (params && params.controls && params.controls.draw) {
    drawHandler.restoreState(params.controls.draw);
  }
}

function init(optOptions) {
  const options = optOptions || {};
  const extraTools = options.options.drawTools || [];
  viewer = options.viewer;
  target = 'o-tools-bottom';
  drawHandler.init(options);
  render();
  drawExtraTools(extraTools, viewer);
  viewer.on('toggleClickInteraction', (detail) => {
    onEnableInteraction({ detail });
  });
  document.addEventListener('enableInteraction', onEnableInteraction);
  document.addEventListener('changeDraw', changeDrawState);
  bindUIActions();
  if (options.isActive) {
    setActive(true);
    dispatcher.emitEnableDrawInteraction();
  }
}

export default {
  getState,
  restoreState,
  init
};
