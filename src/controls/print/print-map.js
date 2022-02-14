import olAttribution from 'ol/control/Attribution';
import olScaleLine from 'ol/control/ScaleLine';
import { dom, Component, Element as El } from '../../ui';
import Logo from './logo';
import NorthArrow from './north-arrow';
import PrintLegend from './print-legend';

export default function PrintMap(options = {}) {
  const {
    logo,
    northArrow,
    printLegend,
    map,
    viewer
  } = options;
  let {
    showNorthArrow,
    showPrintLegend
  } = options;

  let mapControls;
  let scaleLine;

  const topLeftMapControls = El({ cls: 'flex column align-start absolute top-left transparent z-index-ontop-middle' });
  const topRightMapControls = El({ cls: 'flex column align-start absolute top-right transparent z-index-ontop-middle' });
  const bottomLeftMapControls = El({ cls: 'flex column align-start absolute bottom-left transparent z-index-ontop-middle' });
  const bottomRightMapControls = El({ cls: 'flex column align-start absolute bottom-right transparent z-index-ontop-middle' });
  const logoComponent = Logo({ logo });
  const northArrowComponent = NorthArrow({ northArrow, map });
  const printLegendComponent = PrintLegend({ printLegend, viewer });

  return Component({
    onInit() {
      this.addComponent(bottomLeftMapControls);
      this.addComponent(bottomRightMapControls);
      this.on('change:toggleNorthArrow', this.toggleNorthArrow.bind(this));
      this.on('change:togglePrintLegend', this.togglePrintLegend.bind(this));
      this.on('change:toggleScale', this.toggleScale.bind(this));
      this.on('change:setDPI', this.setDpi.bind(this));
    },
    onRender() {
      this.dispatch('render');
    },
    setDpi(resolution) {
      scaleLine.setDpi(resolution.resolution);
    },
    toggleNorthArrow(display) {
      showNorthArrow = !showNorthArrow;
      northArrowComponent.setVisible(display);
    },
    toggleScale(display) {
      const elScale = document.getElementById(bottomRightMapControls.getId());
      if (display.showScale === false) {
        elScale.style.display = 'none';
      } else {
        elScale.style.display = 'block';
      }
    },
    togglePrintLegend(display) {
      showPrintLegend = !showPrintLegend;
      printLegendComponent.setVisible(display);
    },
    async addPrintControls() {
      const el = document.getElementById(bottomLeftMapControls.getId());
      el.appendChild(dom.html(logoComponent.render()));
      const el2 = document.getElementById(topRightMapControls.getId());
      el2.appendChild(dom.html(northArrowComponent.render()));
      northArrowComponent.onRotationChanged();
      northArrowComponent.setVisible({ showNorthArrow });
      scaleLine = new olScaleLine({
        target: bottomRightMapControls.getId(),
        bar: true,
        text: true,
        steps: 2
      });
      const attribution = new olAttribution({
        className: 'print-attribution',
        collapsible: false,
        collapsed: false,
        target: bottomLeftMapControls.getId()
      });
      const topLeftElement = document.getElementById(topLeftMapControls.getId());
      topLeftElement.appendChild(dom.html(await printLegendComponent.render()));
      printLegendComponent.setVisible({ showPrintLegend });
      mapControls = [scaleLine, attribution];
      map.addControl(scaleLine);
      map.addControl(attribution);
    },
    getNorthArrowComponent() {
      return northArrowComponent;
    },
    getLogoComponent() {
      return logoComponent;
    },
    removePrintControls() { mapControls.forEach((mapControl) => map.removeControl(mapControl)); },
    render() {
      return `
      <div class="flex grow relative no-margin width-full height-full">
        ${topLeftMapControls.render()}
        ${topRightMapControls.render()}
        ${bottomLeftMapControls.render()}
        ${bottomRightMapControls.render()}
        <div id="${this.getId()}" class="no-margin width-full height-full"></div>
      </div>
      `;
    }
  });
}
