import olAttribution from 'ol/control/Attribution';
import olScaleLine from 'ol/control/ScaleLine';
import { dom, Component, Element as El } from '../../ui';
import Logo from './logo';

export default function PrintMap(options = {}) {
  const {
    baseUrl,
    logo,
    map
  } = options;

  let mapControls;

  const bottomLeftMapControls = El({ cls: 'flex column align-start absolute bottom-left transparent z-index-ontop-middle' });
  const bottomRightMapControls = El({ cls: 'flex column align-start absolute bottom-right transparent z-index-ontop-middle' });
  const logoComponent = Logo({ ...logo, baseUrl });

  return Component({
    onInit() {
      this.addComponent(bottomLeftMapControls);
      this.addComponent(bottomRightMapControls);
    },
    onRender() {
      this.dispatch('render');
    },
    addPrintControls() {
      const el = document.getElementById(bottomLeftMapControls.getId());
      el.appendChild(dom.html(logoComponent.render()));

      const scaleLine = new olScaleLine({
        className: 'print-scale-line',
        target: bottomRightMapControls.getId()
      });
      const attribution = new olAttribution({
        className: 'print-attribution',
        collapsible: false,
        collapsed: false,
        target: bottomLeftMapControls.getId()
      });
      mapControls = [scaleLine, attribution];
      map.addControl(scaleLine);
      map.addControl(attribution);
    },
    removePrintControls() { mapControls.forEach(mapControl => map.removeControl(mapControl)); },
    render() {
      return `
      <div class="flex grow relative no-margin width-full height-full">
        ${bottomLeftMapControls.render()}
        ${bottomRightMapControls.render()}
        <div id="${this.getId()}" class="no-margin width-full height-full"></div>
      </div>
      `;
    }
  });
}
