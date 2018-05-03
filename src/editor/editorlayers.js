import $ from 'jquery';
import viewer from '../viewer';
import dropDown from '../dropdown';
import dispatcher from './editdispatcher';
import utils from '../utils';

const createElement = utils.createElement;

export default function editorLayers(editableLayers, optOptions = {}) {
  let active = false;
  const activeCls = 'o-active';
  const target = 'editor-toolbar-layers-dropdown';
  const defaultOptions = {
    target,
    selectOptions: selectionModel(editableLayers),
    activeLayer: editableLayers[0]
  };
  const renderOptions = $.extend(defaultOptions, optOptions);

  render(renderOptions);
  addListener(target);

  function render(options) {
    const popover = createElement('div', '', {
      id: options.target,
      cls: 'o-popover'
    });
    $('#o-editor-layers').after(popover);
    dropDown(options.target, options.selectOptions, {
      dataAttribute: 'layer',
      active: options.activeLayer
    });
  }

  function addListener() {
    $(`#${target}`).on('changeDropdown', (e) => {
      e.stopImmediatePropagation(e);
      setActive(false);
      dispatcher.emitToggleEdit('edit', {
        currentLayer: e.dataAttribute
      });
    });
    $(document).on('toggleEdit', onToggleEdit);
    $(document).on('changeEdit', onChangeEdit);
  }

  function onToggleEdit(e) {
    if (e.tool === 'layers') {
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

  function setActive(state) {
    if (state) {
      active = true;
      $(`#${target}`).addClass(activeCls);
    } else {
      active = false;
      $(`#${target}`).removeClass(activeCls);
    }
    dispatcher.emitChangeEdit('layers', active);
  }

  function close() {
    if (active) {
      setActive(false);
    }
  }

  function selectionModel(layerNames) {
    const selectOptions = layerNames.map((layerName) => {
      const obj = {};
      obj.name = viewer.getLayer(layerName).get('title');
      obj.value = layerName;
      return obj;
    });
    return selectOptions;
  }
}
