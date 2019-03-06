import { Component, Element as El, Button, dom } from '../../ui';
import { transform, toLonLat } from 'ol/proj';
import replacer from '../../utils/replacer';


import { getArea, getLength } from 'ol/sphere';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import DrawInteraction from 'ol/interaction/Draw';
import Overlay from 'ol/Overlay';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';

import Style from '../../style';
import StyleTypes from '../../style/styletypes';

const externalurlSeveralButtons = function externalurlSeveralButtons(options = {}) {

  const mainbuttonTooltipText = options.tooltipText || 'Visa kartan i en external platform';
  const links = options.links;
  let map;
  let isMainButtonActive = false;
  let viewer;
  let containerElement;
  let externalUrlMainButton;
  let target;
  const buttons = [];
  const subButtons = [];

  function toggleMainButton() {
    if (!isMainButtonActive) {
      document.getElementById(externalUrlMainButton.getId()).classList.add('active');
      for (let button of subButtons) {
        document.getElementById(button.getId()).classList.remove('hidden');
      }
      document.getElementById(externalUrlMainButton.getId()).classList.remove('tooltip');
      isMainButtonActive = true;
    } else {
      document.getElementById(externalUrlMainButton.getId()).classList.remove('active');
      for (let button of subButtons) {
        document.getElementById(button.getId()).classList.add('hidden');
      }
      document.getElementById(externalUrlMainButton.getId()).classList.add('tooltip');
      isMainButtonActive = false;
    }
  }

  return Component({
    name: 'externalurl',
    onInit() {
      containerElement = El({
        tagName: 'div',
        cls: 'flex column'
      });

      externalUrlMainButton = Button({
        cls: 'o-measure padding-small margin-bottom-smaller icon-smaller rounded light box-shadow',
        icon: '#ic_baseline_link_24px',
        tooltipText: mainbuttonTooltipText,
        tooltipPlacement: 'north',
        click() {
          toggleMainButton();
        }
      });
      buttons.push(externalUrlMainButton);

      for (let link of links) {
        const tooltipText = link.tooltipText;
        const buttonImage = link.buttonImage || '#fa-external-link';
        const subButton = Button({
          cls: 'o-measure-length padding-small margin-bottom-smaller icon-smaller rounded light box-shadow hidden',
          icon: buttonImage,
          tooltipText: tooltipText,
          tooltipPlacement: 'north',
          click() {
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
          }
        });
        buttons.push(subButton);
        subButtons.push(subButton);
      }
    },
    onAdd(evt) {
      viewer = evt.target;
      target = `${viewer.getMain().getMapTools().getId()}`;
      map = viewer.getMap();
      this.addComponents(buttons);
      this.render();
    },
    render() {
      let htmlString = `${containerElement.render()}`;
      let el = dom.html(htmlString);
      document.getElementById(target).appendChild(el);

      // To get the real html element:
      const containerElementElement = document.getElementById(containerElement.getId());

      htmlString = externalUrlMainButton.render();
      el = dom.html(htmlString);
      containerElementElement.appendChild(el);

      for (let subButton of subButtons) {
        htmlString = subButton.render();
        el = dom.html(htmlString);
        containerElementElement.appendChild(el);
      }

      this.dispatch('render');
    }
  });
};

export default externalurlSeveralButtons;
