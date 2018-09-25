import $ from 'jquery';
import viewer from '../viewer';
import utils from '../utils';
import editorToolbar from './editor/editortoolbar';

let $editorButton;

function bindUIActions() {
  $editorButton.on('click', (e) => {
    $('.o-map').first().trigger({
      type: 'enableInteraction',
      interaction: 'editor'
    });
    this.blur();
    e.stopPropagation();
    e.preventDefault();
  });
}

function render() {
  const el = utils.createListButton({
    id: 'o-editor',
    iconCls: 'o-icon-fa-pencil',
    src: '#fa-pencil',
    text: 'Redigera'
  });
  $('#o-menutools').append(el);
}

function init(optOptions) {
  const options = optOptions || {};
  const editableLayers = viewer.getLayersByProperty('editable', true, true);
  if (editableLayers.length) {
    options.editableLayers = editableLayers;
  }
  options.autoSave = 'autoSave' in options ? options.autoSave : true;
  options.autoForm = 'autoForm' in options ? options.autoForm : false;
  options.currentLayer = options.defaultLayer || options.editableLayers[0];
  editorToolbar.init(options);
  render();
  $editorButton = $('#o-editor-button');
  bindUIActions();
}

export default { init };
