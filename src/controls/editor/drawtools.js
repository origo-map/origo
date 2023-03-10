import dropDown from '../../dropdown';
import dispatcher from './editdispatcher';
import utils from '../../utils';
import copyTool from './copyTool';

const createElement = utils.createElement;

let viewer;
let layer;

const drawToolsSelector = function drawToolsSelector(tools, defaultLayer, v) {
  const toolNames = {
    Polygon: 'Polygon',
    Point: 'Punkt',
    Line: 'Linje',
    box: 'Rektangel',
    Copy: 'Kopiera'
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
      if (typeof (drawTool) === 'string') {
        // This is a OL built in interaction, which can be handled without configuration
        // and for backwards compability is configured using just namne
        obj.name = toolNames[drawTool];
        obj.value = drawTool;
      } else {
        // This is a custom drawTool implemented externally.
        // It could be just about any configuration, but must have a toolName
        // Pass along all config to select.
        obj.name = toolNames[drawTool.toolName];
        obj.value = drawTool.toolName;
      }

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
      switch (e.detail.dataAttribute) {
        case 'Copy':
          // Copy tool is handled entirely in copyTool. Only notify edithandler to back off
          // and call copyTool to do its stuff.
          dispatcher.emitChangeEditorShapes('custom');
          copyTool(viewer, layer, drawTools.find((tool) => tool.toolName === 'Copy'));
          break;
        default:
          // This is an OL shape tool. Let edithandler handle it
          dispatcher.emitChangeEditorShapes(e.detail.dataAttribute);
      }
      close();
    });
  }

  function setActive(state) {
    if (state) {
      if (drawTools.length > 1) {
        active = true;
        const ul = document.getElementById(target).getElementsByTagName('ul');
        if (ul.length > 0) {
          ul[0].parentNode.removeChild(document.getElementById(target).getElementsByTagName('ul')[0]);
        }
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
    document.getElementById('o-editor-draw').insertAdjacentElement('afterend', popoverHTML.firstElementChild);
    setActive(false);
  }

  function setDrawTools(layerName) {
    layer = viewer.getLayer(layerName);
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

  return {
    /**
     * Call this to update available tools when layer has changed. No need to call if layer changed using GUI, as that is done by an event.
     * @param {any} layerName
     */
    updateTools: (layerName) => {
      currentLayer = layerName;
      // If not visible we don't actually have to change the tools now
      if (active) {
        setActive(false);
        setDrawTools(currentLayer);
        setActive(true);
      }
    }
  };
};

export default drawToolsSelector;
