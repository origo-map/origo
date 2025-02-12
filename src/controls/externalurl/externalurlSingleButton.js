import { transform, toLonLat } from 'ol/proj';
import { Component, Element as El, Button, dom } from '../../ui';
import replacer from '../../utils/replacer';

const ExternalurlSingleButton = function ExternalurlSingleButton(options = {}) {
  const localization = options.localization;

  function localize(key) {
    return localization.getStringByKeys({ targetParentKey: 'externalurl', targetKey: key });
  }

  let map;
  let viewer;
  let exUrlElement;
  let exUrlBtn;
  let target;
  const buttons = [];
  const tooltip = options.links[0].tooltipText || options.tooltipText || localize('tooltipText');
  const buttonImage = options.links[0].buttonImage || '#ic_baseline_link_24px';
  const url = options.links[0].url;
  const method = options.links[0].method;
  const destinationProjection = options.links[0].projection || 'EPSG:3857';

  function onClick() {
    if (!url) {
      alert(localize('noUrl'));
      return;
    }

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
    } else if (method === 'none') {
      replacedUrl = url;
    }

    window.open(replacedUrl, '_blank');
    document.getElementById(target).blur();
  }

  return Component({
    name: 'externalurl',
    onInit() {
      exUrlElement = El({
        tagName: 'div',
        cls: 'flex column'
      });
      exUrlBtn = Button({
        cls: 'o-measure padding-small margin-bottom-smaller icon-smaller round light box-shadow',
        icon: buttonImage,
        tooltipText: tooltip,
        tooltipPlacement: 'east',
        click() {
          onClick();
        }
      });
      buttons.push(exUrlBtn);
    },
    onAdd(evt) {
      viewer = evt.target;
      target = `${viewer.getMain().getMapTools().getId()}`;
      map = viewer.getMap();
      this.addComponents(buttons);
      this.render();
    },
    hide() {
      document.getElementById(exUrlElement.getId()).classList.add('hidden');
    },
    unhide() {
      document.getElementById(exUrlElement.getId()).classList.remove('hidden');
    },
    render() {
      let htmlString = `${exUrlElement.render()}`;
      let el = dom.html(htmlString);
      document.getElementById(target).appendChild(el);
      htmlString = exUrlBtn.render();
      el = dom.html(htmlString);
      document.getElementById(exUrlElement.getId()).appendChild(el);
      this.dispatch('render');
    }
  });
};

export default ExternalurlSingleButton;
