import $ from 'jquery';
import utils from '../../utils';
import viewer from '../../viewer';
import replacer from '../../utils/replacer';
import { transform, toLonLat } from 'ol/proj';

let mainbuttonTooltipText;
let $toolbar;
let links = [];
let buttonIds = [];
let isMainButtonActive = false;
let map;

function init(options) {
  mainbuttonTooltipText = options.tooltipText || 'Visa kartan i en external platform';
  links = options.links;
  map = viewer.getMap();
  render();
  bindUIActions();
}

function render() {
  const target = $('#o-toolbar-externalurl');
  const toolbar = utils.createElement('div', '', {
    id: 'o-externalurl-toolbar',
    cls: 'o-toolbar-horizontal'
  });
  target.append(toolbar);

  $toolbar = $('#o-externalurl-toolbar');

  const mainbutton = utils.createButton({
    id: 'o-externalurl-main-button',
    cls: 'o-externalurl-main-button',
    iconCls: 'o-icon-fa-external-link',
    src: '#fa-external-link',
    tooltipText: mainbuttonTooltipText
  });
  $toolbar.append(mainbutton);

  // we cannot use for...of because IE does not support it.
  for (let i = 0; i < links.length; i++) {
    let link = links[i];
    let el;
    const id = `o-externalurl-${link.name}-button`;
    const tooltip = link.tooltipText;
    const tooltipPlacement = 'north';
    if (link.buttonImage)
      el = utils.createImageButton({
        id: id,
        iconCls: 'o-image-external-link',
        src: link.buttonImage,
        tooltipText: tooltip,
        tooltipPlacement: tooltipPlacement
      });
    else
      el = utils.createButton({
        id: id,
        iconCls: 'o-icon-fa-external-link',
        src: '#fa-external-link',
        tooltipText: tooltip,
        tooltipPlacement: tooltipPlacement
      });
    $toolbar.append(el);
    // el above is just a string not a real element, so we cannot work with it directly.
    const $elem = $('#' + id);
    $elem.addClass('o-hidden');
    buttonIds.push(id);
  }
}

function bindUIActions() {

  $('#o-externalurl-main-button').on('click', (e) => {
    toggleMainButton();
    $('#o-externalurl-main-button button').blur();
    e.preventDefault();
  });
  
  for (let i = 0; i < links.length; i++) {
    let link = links[i];
    const id = `o-externalurl-${link.name}-button`;
    
    $('#' + id).on('click', (e) => {
      const mapView = map.getView();
      const center = mapView.getCenter();
      const projection = mapView.getProjection();
      const destinationProjection = link.projection || 'EPSG:3857';
      const transformedCenter = transform(center, projection, destinationProjection);

      let replacedUrl;
      
      if (link.method === 'XY') {
        replacedUrl = replacer.replace(link.url, { X: transformedCenter[0], Y: transformedCenter[1] });
      } else if (link.method === 'LatLon') {
        const centerLonlat = toLonLat(transformedCenter);
        replacedUrl = replacer.replace(link.url, { LON: centerLonlat[0], LAT: centerLonlat[1] });
      }

      window.open(replacedUrl, '_blank');
      $('#' + id + ' button').blur();
      e.preventDefault();
    });
  }
}

function toggleMainButton() {
  if (!isMainButtonActive) {

    $('#o-externalurl-main-button button').addClass('o-externalurl-main-button-true');
    for (let index = 0; index < buttonIds.length; index++) {
      const id = buttonIds[index];
      $('#' + id).removeClass('o-hidden');
    }
    $('#o-externalurl-main-button').removeClass('o-tooltip');
    isMainButtonActive = true;

  } else {

    $('#o-externalurl-main-button button').removeClass('o-externalurl-main-button-true');
    for (let index = 0; index < buttonIds.length; index++) {
      const id = buttonIds[index];
      $('#' + id).addClass('o-hidden');
    }
    $('#o-externalurl-main-button').addClass('o-tooltip');
    isMainButtonActive = false;
  }
}

export default { init };