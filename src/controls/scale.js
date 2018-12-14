import { Component, Element as El, dom } from '../ui';
import maputils from '../maputils';
import numberFormatter from '../utils/numberformatter';

const Scale = function Scale(options = {}) {
  let {
    scaleText
  } = options;

  let viewer;
  let map;
  let container;

  function onZoomChange(evt) {
    map.once('moveend', () => {
      const view = map.getView();
      const resolution = evt ? evt.frameState.viewState.resolution : view.getResolution();
      const mapZoom = view.getZoomForResolution(resolution);
      const currentZoom = parseInt(view.getZoom(), 10);
      if (currentZoom !== mapZoom) {
        const scale = maputils.resolutionToScale(map.getView().getResolution(), viewer.getProjection());
        document.getElementById(container.getId()).innerHTML = (scaleText + numberFormatter(scale));
      }
    });
  }

  function setActive(state) {
    if (state === true) {
      map.on('movestart', onZoomChange);
      onZoomChange();
    } else if (state === false) {
      map.un('movestart', onZoomChange);
    }
  }

  return Component({
    name: 'scale',
    onAdd(evt) {
      viewer = evt.target;
      map = viewer.getMap();
      this.on('render', this.onRender);
      this.addComponents([container]);
      if (!scaleText) scaleText = 'Skala 1:';
      const initialState = Object.prototype.hasOwnProperty.call(options, 'isActive') ? options.isActive : true;
      setActive(initialState);
      this.render();
    },
    onInit() {
      container = El({
        style: 'display: inline-block'
      });
    },
    render() {
      const el = dom.html(container.render());
      document.getElementById(viewer.getFooter().getId()).firstElementChild.appendChild(el);
      this.dispatch('render');
    }
  });
};

export default Scale;
