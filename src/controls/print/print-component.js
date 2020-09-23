import olAttribution from 'ol/control/Attribution';
import olScaleLine from 'ol/control/ScaleLine';
import {
  Button, Component, cuid, dom
} from '../../ui';
import pageTemplate from './page.template';
import PrintMap from './print-map';
import PrintSettings from './print-settings';
import PrintToolbar from './print-toolbar';
import { downloadPNG, downloadPDF } from '../../utils/download';
import { afterRender, beforeRender } from './download-callback';

const PrintComponent = function PrintComponent(options = {}) {
  const {
    logo,
    northArrow,
    name = 'origo-map',
    map,
    target,
    viewer,
    createdPrefix
  } = options;

  let {
    size = 'a4',
    orientation = 'portrait',
    showCreated,
    showNorthArrow
  } = options;

  let pageElement;
  let pageContainerElement;
  let targetElement;
  const pageContainerId = cuid();
  const pageId = cuid();
  let title = '';
  let description = '';
  let viewerMapTarget;
  const printMarginClass = 'print-margin';
  let usePrintMargins = true;
  let today = new Date(Date.now());

  const sizes = {
    a3: [420, 297],
    a4: [297, 210],
    custom: [297, 210]
  };

  const setCustomSize = function setCustomSize(sizeObj) {
    if ('width' in sizeObj) {
      sizes.custom[1] = Number(sizeObj.width);
    }
    if ('height' in sizeObj) {
      sizes.custom[0] = Number(sizeObj.height);
    }
  };

  const created = function created() {
    return showCreated ? `${createdPrefix}${today.toLocaleDateString()} ${today.toLocaleTimeString()}` : '';
  };


  const titleComponent = Component({
    update() { dom.replace(document.getElementById(this.getId()), this.render()); },
    render() { return `<div id="${this.getId()}" class="o-print-header h4 text-align-center empty">${title}</div>`; }
  });
  const descriptionComponent = Component({
    update() { dom.replace(document.getElementById(this.getId()), this.render()); },
    render() { return `<div id="${this.getId()}" class="o-print-description padding-y text-grey-dark empty">${description}</div>`; }
  });
  const createdComponent = Component({
    update() { dom.replace(document.getElementById(this.getId()), this.render()); },
    render() { return `<div id="${this.getId()}" class="o-print-created padding-right text-grey-dark text-align-right text-smaller empty">${created()}</div>`; }
  });
  const printMapComponent = PrintMap({ baseUrl: viewer.getBaseUrl(), logo, northArrow, map, viewer, showNorthArrow });

  const printSettings = PrintSettings({
    orientation,
    customSize: sizes.custom,
    initialSize: size,
    sizes: Object.keys(sizes),
    map,
    showCreated,
    showNorthArrow
  });
  const printToolbar = PrintToolbar();
  const closeButton = Button({
    cls: 'fixed top-right medium round icon-smaller light box-shadow z-index-ontop-high',
    icon: '#ic_close_24px'
  });

  return Component({
    name: 'printComponent',
    onInit() {
      this.on('render', this.onRender);
      this.addComponent(printSettings);
      this.addComponent(printToolbar);
      this.addComponent(closeButton);
      printToolbar.on('PNG', this.downloadPNG.bind(this));
      printToolbar.on('PDF', this.downloadPDF.bind(this));
      printSettings.on('change:description', this.changeDescription.bind(this));
      printSettings.on('change:margin', this.toggleMargin.bind(this));
      printSettings.on('change:orientation', this.changeOrientation.bind(this));
      printSettings.on('change:size', this.changeSize.bind(this));
      printSettings.on('change:size-custom', this.changeCustomSize.bind(this));
      printSettings.on('change:title', this.changeTitle.bind(this));
      printSettings.on('change:created', this.toggleCreated.bind(this));
      printSettings.on('change:northarrow', this.toggleNorthArrow.bind(this));
      closeButton.on('click', this.close.bind(this));
    },
    changeDescription(evt) {
      description = evt.value;
      descriptionComponent.update();
      this.updatePageSize();
    },
    changeSize(evt) {
      size = evt.size;
      this.updatePageSize();
    },
    changeCustomSize(evt) {
      setCustomSize(evt);
      this.updatePageSize();
    },
    changeOrientation(evt) {
      orientation = evt.orientation;
      this.updatePageSize();
    },
    changeTitle(evt) {
      title = evt.value;
      titleComponent.update();
      this.updatePageSize();
    },
    printMargin() {
      return usePrintMargins ? 'print-margin' : '';
    },
    toggleMargin() {
      pageElement.classList.toggle(printMarginClass);
      usePrintMargins = !usePrintMargins;
      this.updatePageSize();
    },
    toggleCreated() {
      showCreated = !showCreated;
      createdComponent.update();
      this.updatePageSize();
    },
    toggleNorthArrow() {
      showNorthArrow = !showNorthArrow;
      printMapComponent.dispatch('change:toggleNorthArrow', { showNorthArrow });
    },
    close() {
      printMapComponent.removePrintControls();
      const printElement = document.getElementById(this.getId());
      map.setTarget(viewerMapTarget);
      this.restoreViewerControls();
      printElement.remove();
    },
    async downloadPNG() {
      await downloadPNG({
        afterRender: afterRender(map),
        beforeRender: beforeRender(map),
        filename: `${name}.png`,
        el: pageElement
      });
    },
    async downloadPDF() {
      let height;
      let width;
      let pdfOrientation;
      if (sizes[size][1] > sizes[size][0]) {
        height = sizes[size][0];
        width = sizes[size][1];
        pdfOrientation = orientation === 'portrait' ? 'landscape' : 'portrait';
      } else {
        height = sizes[size][1];
        width = sizes[size][0];
        pdfOrientation = orientation;
      }
      await downloadPDF({
        afterRender: afterRender(map),
        beforeRender: beforeRender(map),
        el: pageElement,
        filename: name,
        height,
        orientation: pdfOrientation,
        size,
        width
      });
    },
    onRender() {
      today = new Date(Date.now());
      viewerMapTarget = map.getTarget();
      pageContainerElement = document.getElementById(pageContainerId);
      pageElement = document.getElementById(pageId);
      map.setTarget(printMapComponent.getId());
      this.removeViewerControls();
      printMapComponent.addPrintControls();

      this.updatePageSize();
    },
    updateMapSize() {
      map.updateSize();
    },
    updatePageSize() {
      pageContainerElement.style.height = orientation === 'portrait' ? `${sizes[size][0]}mm` : `${sizes[size][1]}mm`;
      pageContainerElement.style.width = orientation === 'portrait' ? `${sizes[size][1]}mm` : `${sizes[size][0]}mm`;
      this.updateMapSize();
    },
    removeViewerControls() {
      const controls = map.getControls().getArray();
      const viewerControls = controls.filter((control) => control instanceof olAttribution || control instanceof olScaleLine);
      viewerControls.forEach((control) => map.removeControl(control));
    },
    restoreViewerControls() {
      const attibutionControl = viewer.getControlByName('attribution');
      if (attibutionControl) attibutionControl.render();
      const scalelineControl = viewer.getControlByName('scaleline');
      if (scalelineControl) scalelineControl.render();
    },
    render() {
      targetElement = document.getElementById(target);
      const htmlString = `
      <div id="${this.getId()}" class="absolute flex no-wrap fade-in no-margin width-full height-full z-index-ontop-low bg-grey-lightest overflow-auto">
        <div
          id="${pageContainerId}"
          class="flex column no-shrink margin-top-large margin-x-auto box-shadow bg-white border-box"
          style="margin-bottom: 4rem;">
          <div
            id="${pageId}"
            class="o-print-page flex column no-shrink no-margin width-full height-full bg-white ${this.printMargin()}"
            style="margin-bottom: 4rem;">
            <div class="flex column no-margin width-full height-full overflow-hidden">
  ${pageTemplate({
    descriptionComponent, printMapComponent, titleComponent, createdComponent
  })}
            </div>
          </div>
        </div>
        ${printSettings.render()}
        ${printToolbar.render()}
        ${closeButton.render()}
      </div>
      `;

      targetElement.appendChild(dom.html(htmlString));
      this.dispatch('render');
    }
  });
};

export default PrintComponent;
