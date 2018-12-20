import $ from 'jquery';
import utils from '../utils';
import viewer from '../viewer';
import replacer from '../utils/replacer';
import { transform, toLonLat } from 'ol/proj';

let map;
let tooltip;
let buttonImage;
let url;
let method;
let destinationProjection;

function render(target) {
  let el;
  const id = 'o-externalurl-main-button';

  if (buttonImage)
    el = utils.createImageButton({
      id: id,
      iconCls: 'o-image-external-link',
      src: buttonImage,
      tooltipText: tooltip
    });
  else
    el = utils.createButton({
      id: id,
      iconCls: 'o-icon-fa-external-link',
      src: '#fa-external-link',
      tooltipText: tooltip
    });
  $(target).append(el);
}

function bindUIActions() {
  $('#o-externalurl-main-button').on('click', (e) => {
    const mapView = map.getView();
    const center = mapView.getCenter();
    const projection = mapView.getProjection();
    const transformedCenter = transform(center, projection, destinationProjection);

    let replacedUrl;

    if (method === 'XY') {
      replacedUrl = replacer.replace(url, { X: transformedCenter[0], Y: transformedCenter[1] });
    } else if (method === 'LatLon') {
      const centerLonlat = toLonLat(transformedCenter);
      replacedUrl = replacer.replace(url, { LON: centerLonlat[0], LAT: centerLonlat[1] });
    }
    window.open(replacedUrl, '_blank');
    $('#o-externalurl-main-button button').blur();
    e.preventDefault();
  });
}

function init(options) {
  const target = options.target || '#o-toolbar-navigation';
  tooltip = options.links[0].tooltipText || options.tooltipText || 'Visa i BlomURBEX';
  buttonImage = options.links[0].buttonImage;
  url = options.links[0].url;
  map = viewer.getMap();
  method = options.links[0].method;
  destinationProjection = options.links[0].projection || 'EPSG:3857';
  render(target);
  bindUIActions();
}

export default { init };
