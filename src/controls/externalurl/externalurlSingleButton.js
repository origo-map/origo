import { Component, Element as El, Button, dom } from '../../ui';
import { transform, toLonLat } from 'ol/proj';
import replacer from '../../utils/replacer';

const ExternalurlSingleButton = function ExternalurlSingleButton(options = {}) {

  console.log('Single Button');
  
  let buttonImage;
  let url;
  let method;
  let destinationProjection;
  let map;
  let viewer;
  let exUrlElement;
  let exUrlBtn;
  let buttons = [];
  let target;
  let tooltip;

  tooltip = options.links[0].tooltipText || options.tooltipText || 'Visa i BlomURBEX';
  buttonImage = options.links[0].buttonImage || '#ic_baseline_link_24px';
  url = options.links[0].url;
  method = options.links[0].method;
  destinationProjection = options.links[0].projection || 'EPSG:3857';

  function onClick() {

    if (!url) {
      alert('No URL is specified in the configurations');
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
        cls: 'o-measure padding-small margin-bottom-smaller icon-smaller rounded light box-shadow',
        click() {
          onClick();
          console.log('clicked');
        },
        icon: buttonImage
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
}



export default ExternalurlSingleButton;
