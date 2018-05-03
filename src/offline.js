import $ from 'jquery';
import utils from './utils';
import downloader from './offline/downloader';
import downloadHandler from './offline/downloadhandler';
import OfflineStore from './offline/offlinestore';

const offlineStore = OfflineStore();
let $offlineButton;

function init(optOptions) {
  const options = optOptions || {};

  downloadHandler();
  render();
  bindUIActions();
}

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

export default { init };
