import dropDown from '../../dropdown';
import dispatcher from './editdispatcher';
import utils from '../../utils';

const createElement = utils.createElement;

let viewer;

const drawToolsSelector = function drawToolsSelector(tools, defaultLayer, v) {
  const toolNames = {
    Polygon: 'Polygon',
    Point: 'Punkt',
    Line: 'Linje',
    box: 'Rektangel'
  };
  viewer = v;
  const defaultTools = tools || {};
  let drawTools;
  let currentLayer = defaultLayer;
  const map = viewer.getMap();
  let active = false;
  const activeCls = 'o-active';
  const target = 'editor-toolbar-draw-dropdown';

  function selectionModel() {
    const selectOptions = drawTools.map((drawTool) => {
      const obj = {};
      obj.name = toolNames[drawTool];
      obj.value = drawTool;
      return obj;
    });
    return selectOptions;
  }

  function createDropDownOptions() {
    return {
      target,
      selectOptions: selectionModel(drawTools),
      activeTool: drawTools[0]
    };
  }

  function close() {
    if (active) {
      // eslint-disable-next-line no-use-before-define
      setActive(false);
    }
  }

  function addDropDown(options) {
    dropDown(options.target, options.selectOptions, {
      dataAttribute: 'shape',
      active: options.activeTool
    });
    document.getElementById(target).addEventListener('changeDropdown', (e) => {
      e.stopImmediatePropagation(e);
      dispatcher.emitChangeEditorShapes(e.detail.dataAttribute);
      close();
    });
  }

  function setActive(state) {
    if (state) {
      if (drawTools.length > 1) {
        active = true;
        document.getElementById(target).getElementsByTagName('ul')[0].parentNode.removeChild(document.getElementById(target).getElementsByTagName('ul')[0]);
        addDropDown(createDropDownOptions());
        document.getElementById(target).classList.add(activeCls);
        map.once('click', close);
      }
    } else {
      active = false;
      document.getElementById(target).classList.remove(activeCls);
      map.un('click', close);
    }
  }

  function render() {
    const popover = createElement('div', '', {
      id: target,
      cls: 'o-popover'
    });
    const { body: popoverHTML } = new DOMParser().parseFromString(popover, 'text/html');
    document.getElementById('o-editor-draw').insertAdjacentElement('afterend', popoverHTML);
    setActive(false);
  }

  function setDrawTools(layerName) {
    const layer = viewer.getLayer(layerName);
    let geometryType;
    drawTools = layer.get('drawTools') || [];
    if (layer.get('drawTools')) {
      drawTools = layer.get('drawTools');
    } else {
      geometryType = layer.get('geometryType');
      drawTools = defaultTools[geometryType] ? defaultTools[geometryType].slice(0) : [];
      drawTools.unshift(geometryType);
    }
  }

  function onChangeEdit(e) {
    const { detail: { tool, active: state } } = e;
    if (tool === 'draw' && state === true) {
      setDrawTools(currentLayer);
      setActive(true);
    } else if (tool === 'draw' && state === false) {
      setActive(false);
    }
    e.stopPropagation();
  }

  function onToggleEdit(e) {
    const { detail: { tool } } = e;
    if (tool === 'edit' && e.detail.currentLayer) {
      currentLayer = e.detail.currentLayer;
    }
    e.stopPropagation();
  }

  function addListener() {
    document.addEventListener('changeEdit', onChangeEdit);
    document.addEventListener('toggleEdit', onToggleEdit);
  }

  function init() {
    render();
    addListener();
  }

  init();
};

export default drawToolsSelector;
