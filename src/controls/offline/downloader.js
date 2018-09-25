import $ from 'jquery';
import viewer from '../../viewer';
import template from './downloadtemplate';
import spinner from '../../components/spinnertemplate';
import utils from '../../utils';
import dispatcher from './offlinedispatcher';

const toolbarPrefix = 'o-downloader-td-toolbar-';

const Downloader = function Downloader(layersObj) {
  render(layersObj);
  addListeners();

  function render() {
    $('#o-map').prepend(template);
    renderRows(layersObj);

    bindUIActions();
  }

  function addListeners() {
    $(document).on('changeOfflineStart', onChangeOfflineStart);
    $(document).on('changeOfflineEnd', onChangeOfflineEnd);
  }

  function onChangeOfflineStart(e) {
    renderButtons(`#${toolbarPrefix}${e.layerName}`, 'pending', e.layerName);
  }

  function onChangeOfflineEnd(e) {
    renderButtons(`#${toolbarPrefix}${e.layerName}`, e.state, e.layerName);
  }

  function bindUIActions() {
    $('.o-downloader .o-close-button').on('click', (evt) => {
      closeDownloader();
      evt.preventDefault();
    });
  }

  function renderRows() {
    const layerNames = Object.getOwnPropertyNames(layersObj);
    layerNames.forEach((layerName) => {
      renderRow(layerName, layersObj);
    });
  }

  function renderRow(layerName) {
    const layer = viewer.getLayer(layerName);
    const tdTitle = utils.createElement('td', layer.get('title'), {});
    const toolbarId = toolbarPrefix + layerName;
    const toolbar = utils.createElement('div', '', {
      cls: 'o-toolbar-horizontal',
      style: 'text-align: right; float: right;',
      id: toolbarId
    });
    const tdToolbar = utils.createElement('td', toolbar, {});
    const row = tdTitle + tdToolbar;
    const cls = `o-downloader-tr-${layerName}`;
    const tr = utils.createElement('tr', row, {
      cls
    });
    $('.o-downloader .o-table').append(tr);
    const state = layersObj[layerName].downloaded === true ? 'offline' : 'download';
    renderButtons(`#${toolbarId}`, state, layerName);
  }

  function renderButtons(target, state, layerName) {
    $(target).empty();
    if (state === 'offline') {
      renderSync(target, layerName);
      renderRemove(target, layerName);
    } else if (state === 'download') {
      renderDownload(target, layerName);
    } else if (state === 'pending') {
      renderPending(target);
    }
  }

  function renderSync(target, layerName) {
    const id = 'o-downloader-refresh-' + layerName;
    const refresh = createButton({
      href: '#fa-refresh',
      cls: 'o-icon-fa-refresh',
      id
    });
    $(target).append(refresh);
    bindAction(`#${id}`, layerName, 'sync');
  }

  function renderRemove(target, layerName) {
    const id = `o-downloader-trash-${layerName}`;
    const trash = createButton({
      href: '#fa-trash',
      cls: 'o-icon-fa-trash',
      id
    });
    $(target).append(trash);
    bindAction(`#${id}`, layerName, 'remove');
  }

  function renderDownload(target, layerName) {
    const id = `o-downloader-download-${layerName}`;
    const download = createButton({
      href: '#fa-download',
      cls: 'o-icon-fa-download',
      id
    });
    $(target).append(download);
    bindAction(`#${id}`, layerName, 'download');
  }

  function renderPending(target) {
    const spinnerButton = utils.createElement('button', '', {
      cls: 'o-spinner'
    });
    $(target).append(spinnerButton);
    $('.o-spinner').append(spinner);
  }

  function createButton(obj) {
    const icon = utils.createSvg({
      href: obj.href,
      cls: obj.cls
    });
    return utils.createElement('button', icon, {
      id: obj.id
    });
  }

  function closeDownloader() {
    $('.o-downloader').remove();
  }

  function bindAction(target, layerName, type) {
    $(target).on('click', (evt) => {
      dispatcher.emitChangeDownload(layerName, type);
      evt.preventDefault();
      evt.stopPropagation();
    });
  }
};

export default Downloader;
