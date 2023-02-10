import dropDown from '../../dropdown';
import dispatcher from './drawdispatcher';
import utils from '../../utils';

const createElement = utils.createElement;

let viewer;

const drawToolsSelector = function drawToolsSelector(tools, v) {
  const toolNames = {
    Polygon: 'Polygon',
    Point: 'Punkt',
    LineString: 'Linje',
    box: 'Rektangel',
    freehand: 'Frihandsläge'
  };
  viewer = v;
  let drawTools;
  const map = viewer.getMap();
  let active = false;
  const activeCls = 'o-active';
  const target = 'draw-toolbar-dropdown';

  function selectionModel() {
    const selectOptions = drawTools.map((drawTool) => {
      const obj = {};
      obj.name = toolNames[drawTool];
      obj.value = drawTool;
      return obj;
    });
    return selectOptions;
  }

  function createDropDownOptions(dropDownTarget) {
    return {
      target: dropDownTarget,
      selectOptions: selectionModel(drawTools),
      activeTool: drawTools[0]
    };
  }

  function close() {
    if (active) {
      // eslint-disable-next-line no-use-before-define
      setActive(drawTools[0], false);
    }
  }

  function addDropDown(options) {
    dropDown(options.target, options.selectOptions, {
      dataAttribute: 'shape',
      active: options.activeTool
    });
    document.getElementById(options.target).addEventListener('changeDropdown', (e) => {
      e.stopImmediatePropagation(e);
      dispatcher.emitChangeEditorDrawType(options.activeTool, e.detail.dataAttribute);
      close();
    });
  }

  function setActive(tool, state) {
    if (state) {
      if (drawTools.length > 1) {
        active = true;

        if (document.querySelector(`#${target}-${tool} > ul`)) {
          document.querySelector(`#${target}-${tool} > ul`).remove();
        }
        addDropDown(createDropDownOptions(`${target}-${tool}`));
        document.getElementById(`${target}-${tool}`).classList.add(activeCls);
        map.once('click', close);
      }
    } else {
      active = false;
      if (tool && tool !== 'cancel' && document.querySelector(`[id^="${target}-${tool}"]`)) {
        document.querySelector(`[id^="${target}-${tool}"]`).classList.remove(activeCls);
      }
      map.un('click', close);
    }
  }

  function render() {
    // eslint-disable-next-line no-restricted-syntax
    for (const tool in tools) {
      if (Object.prototype.hasOwnProperty.call(tools, tool)) {
        const popover = createElement('div', '', {
          id: `${target}-${tool}`,
          cls: 'o-popover'
        });
        const { body: popoverHTML } = new DOMParser().parseFromString(popover, 'text/html');
        document.querySelector(`button[title=${toolNames[tool]}]`).insertAdjacentElement('afterend', popoverHTML.firstElementChild);
        setActive(tool, false);
      }
    }
  }

  function setDrawTools(tool) {
    if (tools[tool]) {
      drawTools = tools[tool] ? tools[tool].slice(0) : [];
      drawTools.unshift(tool);
    } else {
      drawTools = [tool];
    }
  }

  function onChangeEdit(e) {
    const { detail: { tool, active: state } } = e;
    if (state === true) {
      setDrawTools(tool);
      setActive(tool, true);
    } else if (state === false) {
      setActive(tool, false);
    }
    e.stopPropagation();
  }

  function addListener() {
    document.addEventListener('changeDraw', onChangeEdit);
  }

  function init() {
    render();
    addListener();
  }

  init();
};

export default drawToolsSelector;
