import $ from 'jquery';
import dispatcher from './drawdispatcher';
import drawHandler from './drawhandler';

const activeClass = 'o-control-active';
let $drawPolygon;
let $drawLineString;
let $drawPoint;
let $drawText;
let $drawDelete;
let $drawClose;
let drawTools;
let target;
let freemodeToggle = `
<label title='On/off för frihandläge (Linje och polygon)' class="switch">
    <input id='toggle-freemode' type="checkbox" style="opacity:0;">
    <span class="slider round">
        <span class="freehand-icon">
            <svg class="o-icon-pencil">
                <use xlink:href="#fa-pencil"></use>
            </svg>
        </span>
    </span>
</label>`

function render() {
  $(`#${target}`).append("<div id='o-draw-toolbar' class='o-control o-toolbar o-padding-horizontal-8 o-rounded-top o-hidden'>" +
    `${freemodeToggle}`+
    "<button id='o-draw-point' class='o-btn-3' type='button' name='button'>" +
    "<svg class='o-icon-fa-map-marker'>" +
    "<use xlink:href='#fa-map-marker'></use>" +
    '</svg>' +
    '</button>' +
    "<button id='o-draw-polygon' class='o-btn-3' type='button' name='button'>" +
    "<svg class='o-icon-minicons-square-vector'>" +
    "<use xlink:href='#minicons-square-vector'></use>" +
    '</svg>' +
    '</button>' +
    "<button id='o-draw-polyline' class='o-btn-3' type='button' name='button'>" +
    "<svg class='o-icon-minicons-line-vector'>" +
    "<use xlink:href='#minicons-line-vector'></use>" +
    '</svg>' +
    '</button>' +
    "<button id='o-draw-text' class='o-btn-3' type='button' name='button'>" +
    "<svg class='o-icon-fa-font'>" +
    "<use xlink:href='#fa-font'></use>" +
    '</svg>' +
    '</button>' +
    "<button id='o-draw-delete' class='o-btn-3' type='button' name='button'>" +
    "<svg class='o-icon-fa-trash'>" +
    "<use xlink:href='#fa-trash'></use>" +
    '</svg>' +
    '</button>' +
    "<button id='o-draw-close' class='o-btn-3' type='button' name='button'>" +
    "<svg class='o-icon-fa-times'>" +
    "<use xlink:href='#fa-times'></use>" +
    '</svg>' +
    '</button>' +
    '</div>');
  $drawPolygon = $('#o-draw-polygon');
  $drawLineString = $('#o-draw-polyline');
  $drawPoint = $('#o-draw-point');
  $drawText = $('#o-draw-text');
  $drawDelete = $('#o-draw-delete');
  $drawClose = $('#o-draw-close');
  drawTools = {
    Point: $drawPoint,
    LineString: $drawLineString,
    Polygon: $drawPolygon,
    Text: $drawText
  };
}

function bindUIActions() {
  $('#toggle-freemode').on("click", () => {
    //deactivate current tool and reactivate it again with freemode
    let active = drawHandler.getActiveTool()
    dispatcher.emitToggleDraw(active)
    dispatcher.emitToggleDraw(active)
  })
  $drawDelete.on('click', (e) => {
    dispatcher.emitToggleDraw('delete');
    $drawDelete.blur();
  });
  $drawPolygon.on('click', (e) => {
    dispatcher.emitToggleDraw('Polygon');
    $drawPolygon.blur();
    e.preventDefault();
  });
  $drawLineString.on('click', (e) => {
    dispatcher.emitToggleDraw('LineString');
    $drawLineString.blur();
    e.preventDefault();
  });
  $drawPoint.on('click', (e) => {
    dispatcher.emitToggleDraw('Point');
    $drawPoint.blur();
    e.preventDefault();
  });
  $drawText.on('click', (e) => {
    dispatcher.emitToggleDraw('Text');
    $drawText.blur();
    e.preventDefault();
  });
  $drawClose.on('click', (e) => {
    dispatcher.emitDisableDrawInteraction();
    $drawClose.blur();
    e.stopPropagation();
    e.preventDefault();
    // For Origo to be able to react properly based on new event system
    document.dispatchEvent(new CustomEvent('toggleInteraction', {
      bubbles: true,
      detail: 'featureInfo'
    }));
  });
}

function setActive(state) {
  if (state === true) {
    $('#o-draw-toolbar').removeClass('o-hidden');
  } else {
    $('#o-draw-toolbar').addClass('o-hidden');
  }
}

function onEnableInteraction(e) {
  // e.stopPropagation();
  if (e.interaction === 'draw') {
    setActive(true);
  } else {
    setActive(false);
    dispatcher.emitToggleDraw('cancel');
  }
}

function toggleState(tool, state) {
  if (state === false) {
    tool.removeClass(activeClass);
  } else {
    tool.addClass(activeClass);
  }
}

function changeDrawState(e) {
  const tools = Object.getOwnPropertyNames(drawTools);
  tools.forEach((tool) => {
    if (tool === e.tool) {
      toggleState(drawTools[tool], e.active);
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
  const viewer = options.viewer;
  target = `${viewer.getMain().getId()}`;
  drawHandler.init(options);
  render();
  $(document).on('enableInteraction', onEnableInteraction);
  $(document).on('changeDraw', changeDrawState);
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
