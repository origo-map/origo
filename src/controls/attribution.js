import cu from 'ceeu';
import olAttribution from 'ol/control/attribution';

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

  return cu.Component({
    onAdd(evt) {
      viewer = evt.target;
      breakPoint = options.breakPoint || [768, 500];
      attribution = new olAttribution({
        collapsible: false
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
