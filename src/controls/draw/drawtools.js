import dropDown from '../../dropdown';
import utils from '../../utils';

const createElement = utils.createElement;

const drawToolsSelector = function drawToolsSelector({ extraTools, viewer, toolCmps, localize }) {
  const toolNames = {
    Polygon: localize('drawPolygon'),
    Point: localize('drawPoint'),
    LineString: localize('drawLine'),
    box: localize('drawBox'),
    square: localize('drawSquare'),
    circle: localize('drawCircle'),
    freehand: localize('drawFreehand')
  };

  const drawCmp = viewer.getControlByName('draw');
  let drawTools;
  const map = viewer.getMap();
  let active = false;
  const activeCls = 'o-active';
  const target = 'draw-toolbar-dropdown';
  let activeTool;

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

  function changeDrawType(e) {
    drawCmp.dispatch('toggleDraw', { tool: activeTool, drawType: e.detail.dataAttribute, clearTool: true });
    close();
  }

  function addDropDown(options) {
    dropDown(options.target, options.selectOptions, {
      dataAttribute: 'shape',
      active: options.activeTool
    });
    activeTool = options.activeTool;
    document.getElementById(options.target).addEventListener('changeDropdown', changeDrawType);
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
    for (const tool in extraTools) {
      if (Object.prototype.hasOwnProperty.call(extraTools, tool)) {
        const popover = createElement('div', '', {
          id: `${target}-${tool}`,
          cls: 'o-popover'
        });
        const { body: popoverHTML } = new DOMParser().parseFromString(popover, 'text/html');
        document.getElementById(toolCmps[tool].getId()).appendChild(popoverHTML.firstElementChild);
        setActive(tool, false);
      }
    }
  }

  function setDrawTools(tool) {
    if (extraTools[tool]) {
      drawTools = extraTools[tool] ? extraTools[tool].slice(0) : [];
      drawTools.unshift(tool);
    } else {
      drawTools = [tool];
    }
  }

  function onChangeEdit(e) {
    const { tool, active: state } = e;
    if (state === true) {
      setDrawTools(tool);
      setActive(tool, true);
    } else if (state === false) {
      setActive(tool, false);
    }
  }

  function addListener() {
    drawCmp.getDrawHandler().on('changeDraw', onChangeEdit);
  }

  function init() {
    render();
    addListener();
  }

  init();
};

export default drawToolsSelector;
