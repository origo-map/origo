import olScaleLine from 'ol/control/ScaleLine';
import { Component } from '../ui';

const ScaleLine = function ScaleLine(options = {}) {
  let {
    target
  } = options;
  let viewer;
  let scaleLine;

  return Component({
    name: 'scaleline',
    onAdd(evt) {
      viewer = evt.target;
      if (!target) target = `${viewer.getMain().getBottomTools().getId()}`;
      scaleLine = new olScaleLine({
        target
      });
      this.render();
    },
    render() {
      viewer.getMap().addControl(scaleLine);
      this.dispatch('render');
    }
  });
};

export default ScaleLine;
