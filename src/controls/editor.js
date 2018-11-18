import cu from 'ceeu';
import editorToolbar from './editor/editortoolbar';

const Editor = function Editor(opt = {}) {
  let editorButton;
  let editorElement;

  return cu.Component({
    name: 'about',
    onAdd(evt) {
      const viewer = evt.target;
      const options = opt || {};
      const editableLayers = viewer.getLayersByProperty('editable', true, true);
      if (editableLayers.length) {
        options.editableLayers = editableLayers;
      }
      options.autoSave = 'autoSave' in options ? options.autoSave : true;
      options.autoForm = 'autoForm' in options ? options.autoForm : false;
      options.currentLayer = options.defaultLayer || options.editableLayers[0];
      this.addComponents([editorButton]);
      this.render();
      editorToolbar.init(options, viewer);
    },
    onInit() {
      editorButton = cu.Button({
        id: 'o-about-button',
        cls: 'o-menu-button',
        click() {
          editorToolbar.toggleToolbar(true);
        },
        text: 'Redigera',
        icon: '#ic_edit_24px',
        iconCls: 'o-button-icon'
      });

      const rendered = editorButton.render();

      editorElement = cu.Element({
        cls: '',
        tagName: 'li',
        innerHTML: `${rendered}`
      });
    },
    render() {
      const htmlString = editorElement.render();
      const el = cu.dom.html(htmlString);
      document.getElementById('o-menutools').appendChild(el);
      this.dispatch('render');
    }
  });
};

export default Editor;
