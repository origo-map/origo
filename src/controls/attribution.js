import olAttribution from 'ol/control/Attribution';
import { Component } from '../ui';

const Attribution = function Attribution(options = {}) {
  let viewer;
  let breakPoint;
  let attribution;

  function checkSize() {
    const mapSize = viewer.getMap().getSize();
    const collapsed = (mapSize[0] <= breakPoint[0] || mapSize[1] <= breakPoint[1]);
    attribution.setCollapsible(collapsed);
    attribution.setCollapsed(collapsed);
  }

  return Component({
    name: 'attribution',
    onAdd(evt) {
      viewer = evt.target;
      breakPoint = options.breakPoint || [768, 500];
      attribution = new olAttribution({
        collapsible: false,
        collapseLabel: '\u00AB'
      });
      this.render();
    },
    render() {
      viewer.getMap().addControl(attribution);
      window.addEventListener('resize', checkSize);
      checkSize(attribution, breakPoint);
      this.dispatch('render');
    }
  });
};

export default Attribution;
