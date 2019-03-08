import { Component, Button, dom } from '../ui';
import editorToolbar from './editor/editortoolbar';

const Editor = function Editor(options = {}) {
  const {
    autoForm = false,
    autoSave = true,
    isActive = true
  } = options;
  let editorButton;
  let target;

  const toggleState = function toggleState() {
    if (editorButton.getState() === 'initial') {
      editorButton.dispatch('change', { state: 'active' });
    } else {
      editorButton.dispatch('change', { state: 'initial' });
    }
  };

  const onActive = function onActive() {
    editorToolbar.toggleToolbar(true);
  };

  const onInitial = function onInitial() {
    editorToolbar.toggleToolbar(false);
  };

  return Component({
    name: 'editor',
    onAdd(evt) {
      const viewer = evt.target;
      target = `${viewer.getMain().getMapTools().getId()}`;
      const editableLayers = viewer.getLayersByProperty('editable', true, true);
      const currentLayer = options.defaultLayer || editableLayers[0];
      const toolbarOptions = Object.assign({}, options, {
        autoForm,
        autoSave,
        currentLayer,
        editableLayers
      });
      this.addComponent(editorButton);
      this.on('render', this.onRender);
      this.render();
      editorToolbar.init(toolbarOptions, viewer);
    },
    onInit() {
      const state = isActive ? 'active' : 'initial';
      editorButton = Button({
        cls: 'o-menu-button padding-small icon-smaller rounded light box-shadow',
        click() {
          toggleState();
        },
        icon: '#ic_edit_24px',
        state,
        methods: {
          active: onActive,
          initial: onInitial
        }
      });
    },
    render() {
      const htmlString = editorButton.render();
      const el = dom.html(htmlString);
      document.getElementById(target).appendChild(el);
      this.dispatch('render');
    }
  });
};

export default Editor;
