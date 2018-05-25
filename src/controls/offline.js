import $ from 'jquery';
import utils from '../utils';
import downloader from './offline/downloader';
import downloadHandler from './offline/downloadhandler';
import OfflineStore from './offline/offlinestore';

const offlineStore = OfflineStore();
let $offlineButton;

function render() {
  const el = utils.createListButton({
    id: 'o-offline',
    iconCls: 'o-icon-fa-download',
    src: '#fa-download',
    text: 'Nedladdningar'
  });
  $('#o-menutools').append(el);
  $offlineButton = $('#o-offline-button');
}

function bindUIActions() {
  $offlineButton.on('click', (e) => {
    downloader(offlineStore.getOfflineLayers());
    e.preventDefault();
  });
}

function init() {
  downloadHandler();
  render();
  bindUIActions();
}

export default { init };
