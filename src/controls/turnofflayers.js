import { Component } from '../ui';

const Turnofflayers = function Turnofflayers(options = {}) {
  let viewer;

  const turnOffAllLayers = function turnOffAllLayers() {
    const layers = viewer.getLayersByProperty('visible', true);
    layers.forEach((el) => {
      if (el.get('group') !== 'background') {
        el.setVisible(false);
      }
    });
  };

  return Component({
    onAdd(e) {
      viewer = e.target;
      viewer.on('active:turnofflayers', turnOffAllLayers);
      this.render();
    },
    render() {
      this.dispatch('render');
    }
  });
};

export default Turnofflayers;
