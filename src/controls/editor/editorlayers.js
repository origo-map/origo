import dropDown from '../../dropdown';
import dispatcher from './editdispatcher';
import utils from '../../utils';

const createElement = utils.createElement;

let viewer;

export default function editorLayers(editableLayers, v, optOptions = {}) {
  viewer = v;
  function selectionModel(layerNames) {
    const selectOptions = layerNames.map((layerName) => {
      const obj = {};
      obj.name = viewer.getLayer(layerName).get('title');
      obj.value = layerName;
      return obj;
    });
    return selectOptions;
  }

  let active = false;
  const activeCls = 'o-active';
  const target = 'editor-toolbar-layers-dropdown';
  const defaultOptions = {
    target,
    selectOptions: selectionModel(editableLayers),
    activeLayer: editableLayers[0]
  };
  const renderOptions = Object.assign(defaultOptions, optOptions);

  function render(options) {
    const popover = createElement('div', '', {
      id: options.target,
      cls: 'o-popover'
    });
    const { body: popoverHTML } = new DOMParser().parseFromString(popover, 'text/html');
    document.getElementById('o-editor-layers').insertAdjacentElement('afterend', popoverHTML);
    dropDown(options.target, options.selectOptions, {
      dataAttribute: 'layer',
      active: options.activeLayer
    });
  }

  function setActive(state) {
    if (state) {
      active = true;
      document.getElementById(target).classList.add(activeCls);
    } else {
      active = false;
      document.getElementById(target).classList.remove(activeCls);
    }
    dispatcher.emitChangeEdit('layers', active);
  }

  function onToggleEdit(e) {
    const { detail: { tool } } = e;
    if (tool === 'layers') {
      if (active) {
        setActive(false);
      } else {
        setActive(true);
      }
    }
    e.stopPropagation();
  }

  function onChangeEdit(e) {
    if (e.tool !== 'layers' && e.active === true) {
      setActive(false);
    }
    e.stopPropagation();
  }

  function addListener() {
    document.getElementById(target).addEventListener('changeDropdown', (e) => {
      e.stopImmediatePropagation(e);
      setActive(false);
      dispatcher.emitToggleEdit('edit', {
        currentLayer: e.detail.dataAttribute
      });
    });
    document.addEventListener('toggleEdit', onToggleEdit);
    document.addEventListener('changeEdit', onChangeEdit);
  }

  render(renderOptions);
  addListener(target);
}
