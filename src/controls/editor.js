import { Component, Button, dom } from '../ui';
import editorToolbar from './editor/editortoolbar';
import EditHandler from './editor/edithandler';

const Editor = function Editor(options = {}) {
  const {
    autoForm = false,
    autoSave = true,
    isActive = true
  } = options;
  let editorButton;
  let target;
  let viewer;
  let isVisible = isActive;
  let toolbarVisible = false;

  /** The handler were all state is kept */
  let editHandler;

  const toggleState = function toggleState() {
    const detail = {
      name: 'editor',
      active: editorButton.getState() === 'initial'
    };
    // There are some serious event dependencies between viewer, editor, edithandler, editortoolbar, editorlayers, dropdown and editorbutton,
    // which makes it almost impossible to do things in correct order.
    isVisible = detail.active;
    viewer.dispatch('toggleClickInteraction', detail);
  };

  const onActive = function onActive() {
    editorToolbar.toggleToolbar(true);
    toolbarVisible = true;
  };

  const onInitial = function onInitial() {
    editorToolbar.toggleToolbar(false);
    toolbarVisible = false;
  };

  async function createFeature(layerName, geometry = null) {
    const feature = await editHandler.createFeature(layerName, geometry);
    return feature;
  }

  async function deleteFeature(featureId, layerName) {
    await editHandler.deleteFeature(featureId, layerName);
  }

  function editFeatureAttributes(featureId, layerName) {
    editHandler.editAttributesDialog(featureId, layerName);
  }

  return Component({
    name: 'editor',
    onAdd(evt) {
      viewer = evt.target;
      target = `${viewer.getMain().getMapTools().getId()}`;
      const editableLayers = viewer.getLayersByProperty('editable', true, true);
      const editableFeatureLayers = editableLayers.filter(l => !viewer.getLayer(l).get('isTable'));
      const currentLayer = options.defaultLayer || editableLayers[0];
      const toolbarOptions = Object.assign({}, options, {
        autoSave,
        currentLayer,
        editableLayers: editableFeatureLayers
      });
      const handlerOptions = Object.assign({}, options, {
        autoForm,
        autoSave,
        currentLayer,
        editableLayers,
        isActive
      });
      editHandler = EditHandler(handlerOptions, viewer);

      viewer.on('toggleClickInteraction', (detail) => {
        if (detail.name === 'editor' && detail.active) {
          editorButton.dispatch('change', { state: 'active' });
        } else {
          editorButton.dispatch('change', { state: 'initial' });
        }
      });
      this.addComponent(editorButton);
      this.on('render', this.onRender);
      this.render();
      editorToolbar.init(toolbarOptions, viewer);
    },
    onInit() {
      const state = isActive ? 'active' : 'initial';
      editorButton = Button({
        cls: 'o-menu-button padding-small icon-smaller round light box-shadow o-tooltip',
        click() {
          toggleState();
        },
        icon: '#ic_edit_24px',
        tooltipText: 'Redigera',
        tooltipPlacement: 'east',
        state,
        methods: {
          active: onActive,
          initial: onInitial
        }
      });
    },
    hide() {
      document.getElementById(editorButton.getId()).classList.add('hidden');
      if (toolbarVisible) {
        editorToolbar.toggleToolbar(false);
      }
    },
    unhide() {
      document.getElementById(editorButton.getId()).classList.remove('hidden');
      if (toolbarVisible) {
        editorToolbar.toggleToolbar(true);
      }
    },
    render() {
      const htmlString = editorButton.render();
      const el = dom.html(htmlString);
      document.getElementById(target).appendChild(el);
      this.dispatch('render');
      viewer.dispatch('toggleClickInteraction', {
        name: 'editor',
        active: isActive
      });
    },
    createFeature,
    editFeatureAttributes,
    deleteFeature,
    changeActiveLayer: (layerName) => {
      // Only need to actually cahne layer if editor is active. Otherwise state is just set in toolbar and will
      // activate set layer when toggled visible
      if (isVisible) {
        editHandler.setActiveLayer(layerName);
      }
      editorToolbar.changeActiveLayer(layerName);
    }
  });
};

export default Editor;
