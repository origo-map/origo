import olAttribution from 'ol/control/Attribution';
import olScaleLine from 'ol/control/ScaleLine';
import { getPointResolution } from 'ol/proj';
import TileImage from 'ol/source/TileImage';
import TileWMSSource from 'ol/source/TileWMS';
import TileGrid from 'ol/tilegrid/TileGrid';
import { Group } from 'ol/layer';
import PluggableMap from 'ol/PluggableMap';
import {
  Button, Component, cuid, dom
} from '../../ui';
import pageTemplate from './page.template';
import PrintMap from './print-map';
import PrintSettings from './print-settings';
import PrintInteractionToggle from './print-interaction-toggle';
import PrintToolbar from './print-toolbar';
import { downloadPNG, downloadPDF, printToScalePDF } from '../../utils/download';
import { afterRender, beforeRender } from './download-callback';
import maputils from '../../maputils';
import PrintResize from './print-resize';
/** Backup of original OL function */
const original = PluggableMap.prototype.getEventPixel;

/**
 * Recalculates the event position to account for transform: scale in the container as OL does not do that.
 * Used to monkey patch OL.
 * @param {any} event
 */
const getEventPixelScale = function monkeyPatch(event) {
  // This is internal in OL, nust allow
  // eslint-disable-next-line no-underscore-dangle
  const viewportPosition = this.viewport_.getBoundingClientRect();
  let size = [viewportPosition.width, viewportPosition.height];
  const view = this.getView();
  if (view) {
    // This is internal in OL, nust allow
    // eslint-disable-next-line no-underscore-dangle
    size = view.getViewportSize_();
  }
  const eventPosition = 'changedTouches' in event ? event.changedTouches[0] : event;

  return [
    ((eventPosition.clientX - viewportPosition.left) * size[0])
    / viewportPosition.width,
    ((eventPosition.clientY - viewportPosition.top) * size[1])
    / viewportPosition.height
  ];
};

const PrintComponent = function PrintComponent(options = {}) {
  const {
    logo,
    northArrow,
    printLegend,
    filename = 'origo-map',
    map,
    target,
    viewer,
    titlePlaceholderText,
    titleAlignment,
    titleSizes,
    titleFormatIsVisible,
    descriptionPlaceholderText,
    descriptionAlignment,
    descriptionSizes,
    descriptionFormatIsVisible,
    sizes,
    sizeCustomMinHeight,
    sizeCustomMaxHeight,
    sizeCustomMinWidth,
    sizeCustomMaxWidth,
    resolutions,
    scaleInitial,
    createdPrefix,
    rotation,
    rotationStep,
    leftFooterText,
    mapInteractionsActive,
    supressResolutionsRecalculation,
    suppressNewDPIMethod
  } = options;

  let {
    title,
    titleSize,
    description,
    descriptionSize,
    size,
    orientation,
    resolution,
    scales,
    showMargins,
    showCreated,
    showScale,
    showNorthArrow,
    showPrintLegend
  } = options;

  let pageElement;
  let pageContainerElement;
  let targetElement;
  const pageContainerId = cuid();
  const pageId = cuid();
  let titleAlign = `text-align-${titleAlignment}`;
  let descriptionAlign = `text-align-${descriptionAlignment}`;
  let viewerMapTarget;
  const printMarginClass = 'print-margin';
  let today = new Date(Date.now());
  let printScale = 0;
  let widthImage = 0;
  let heightImage = 0;
  const originalResolutions = viewer.getResolutions().map(item => item);
  const originalGrids = new Map();

  if (!Array.isArray(scales) || scales.length === 0) {
    scales = originalResolutions.map(currRes => maputils.resolutionToFormattedScale(currRes, viewer.getProjection()));
  }

  /**
   * Recalulates a resoultions array to reflect dpi changes
   * @param {number []} src the array of resolutions
   * @returns {number []} A new array with recalculated values
   */
  const recalculateResolutionsArray = function recalculateResolutionsArray(src) {
    const retval = [];
    for (let ix = 0; ix < src.length; ix += 1) {
      // Do the calculation the same way as when setting the scale. Otherwise there will be rounding errors and the scale bar will have another scale than selected
      // (and probably not an even nice looking number)
      const scale = maputils.resolutionToScale(src[ix], viewer.getProjection()) / 1000;
      const scaleResolution = scale / getPointResolution(viewer.getProjection(), resolution / 25.4, map.getView().getCenter());
      retval.push(scaleResolution);
    }
    return retval;
  };

  /**
   * Recursively flattens group layers in an array of layers
   * @param {any []} layers Array of layers
   * @returns {any []} Array of layers with group layers flattened
   */
  const flattenLayers = function flattenLayers(layers) {
    return layers.reduce((acc, currLayer) => {
      if (currLayer instanceof Group) {
        // eslint-disable-next-line no-param-reassign
        acc = acc.concat(flattenLayers(currLayer.getLayers().getArray()));
      } else {
        acc.push(currLayer);
      }
      return acc;
    }, []);
  };

  /** Recalculate the grid of tiled layers when resolution has changed as more tiles may be needed to cover the extent */
  const updateTileGrids = function updateTileGrids() {
    const layers = flattenLayers(viewer.getLayers());
    for (let i = 0; i < layers.length; i += 1) {
      const currLayer = layers[i];
      if (currLayer.getSource() instanceof TileImage) {
        const grid = currLayer.getSource().getTileGrid();
        let needNewGrid = false;
        // Store original grid if we don't have it already
        // Don't always copy as it is only the first time it is original grid
        if (!originalGrids.has(currLayer)) {
          originalGrids.set(currLayer, grid);
        }

        // Deep copy grid so we can exchange it without messing with anything else
        const newgridOptions = {};
        // If layer uses the grid from the viewer, it is a shared instance and has been changed when resolutions were recalculated
        // as the grid uses a pointer to resolutions
        if (grid === viewer.getTileGrid()) {
          // No need for deep copy yet
          newgridOptions.resolutions = originalResolutions;
          needNewGrid = true;
        } else {
          // No need for deep copy yet
          newgridOptions.resolutions = originalGrids.get(currLayer).getResolutions();
        }

        // TileWms is actually not a tile service. So we can create a new dynamic grid to create crisp tiles matching the new
        // resolutions, it will just cost a few cache misses on the server. All other tile sources are tiled, so we can't assume that there exist tiles for a "random" resolution
        // so the new grid is actually the same as before, but it may have been reverted to the resolutions it had before map resolutions was recalculated
        // An alternative (better) solution would have been to deep copy resolutions when making the grid in viewer, but that might upset someone else.
        // In theory we could have added a flag to which layers should be recalculated. Someone might have multiple grids to support different resolutions.
        if (currLayer.getSource() instanceof TileWMSSource) {
          // This is actually a deep copy
          newgridOptions.resolutions = recalculateResolutionsArray(newgridOptions.resolutions);
          needNewGrid = true;
        }
        // Would be silly to create a deep clone if it is exactly the same.
        if (needNewGrid) {
          newgridOptions.extent = grid.getExtent();
          newgridOptions.minZoom = grid.getMinZoom();
          newgridOptions.origin = grid.getOrigin();
          newgridOptions.tileSize = grid.getTileSize();
          const newGrid = new TileGrid(newgridOptions);
          // Set our brand new grid on current layer
          currLayer.getSource().tileGrid = newGrid;
        }
      }
    }
  };

  /** Recalculate the array of allowed zoomlevels to reflect changes in DPI and updates the view */
  const updateResolutions = function updateResolutions() {
    const viewerResolutions = viewer.getResolutions();
    const newResolutions = recalculateResolutionsArray(originalResolutions);
    for (let ix = 0; ix < viewerResolutions.length; ix += 1) {
      viewerResolutions[ix] = newResolutions[ix];
    }
    // As we do a "dirty" update of resolutions we have to trigger a re-read of the limits, otherwise the outer limits still apply.
    map.getView().setMinZoom(0);
    map.getView().setMaxZoom(viewerResolutions.length - 1);
    // Have to recalculate tiles extents as well.
    updateTileGrids();
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
    render() { return `<div id="${this.getId()}" class="o-print-header ${titleSize} ${titleAlign} empty">${title}</div>`; }
  });
  const descriptionComponent = Component({
    update() { dom.replace(document.getElementById(this.getId()), this.render()); },
    render() { return `<div id="${this.getId()}" class="o-print-description padding-y text-grey-dark ${descriptionSize} ${descriptionAlign} empty">${description}</div>`; }
  });
  const createdComponent = Component({
    update() { dom.replace(document.getElementById(this.getId()), this.render()); },
    render() { return `<div id="${this.getId()}" class="o-print-created text-align-right no-shrink">${created()}</div>`; }
  });
  const footerComponent = Component({
    update() { dom.replace(document.getElementById(this.getId()), this.render()); },
    render() {
      return `<div id="${this.getId()}" class="o-print-footer flex row justify-space-between padding-left padding-right text-grey-dark text-smaller empty">
        <div class="o-print-footer-left text-align-left">${leftFooterText}</div>
        ${createdComponent.render()}
      </div>`;
    }
  });

  const printMapComponent = PrintMap({ logo, northArrow, map, viewer, showNorthArrow, printLegend, showPrintLegend });

  const closeButton = Button({
    cls: 'fixed top-right medium round icon-smaller light box-shadow z-index-ontop-high',
    icon: '#ic_close_24px',
    ariaLabel: 'Stäng'
  });

  const printResize = PrintResize({
    map,
    viewer,
    logoComponent: printMapComponent.getLogoComponent(),
    northArrowComponent: printMapComponent.getNorthArrowComponent(),
    titleComponent,
    descriptionComponent,
    createdComponent,
    closeButton
  });

  const setScale = function setScale(scale) {
    printScale = scale;
    const widthInMm = orientation === 'portrait' ? sizes[size][1] : sizes[size][0];
    widthImage = orientation === 'portrait' ? Math.round((sizes[size][1] * resolution) / 25.4) : Math.round((sizes[size][0] * resolution) / 25.4);
    heightImage = orientation === 'portrait' ? Math.round((sizes[size][0] * resolution) / 25.4) : Math.round((sizes[size][1] * resolution) / 25.4);
    const scaleResolution = scale / getPointResolution(
      map.getView().getProjection(),
      resolution / 25.4,
      map.getView().getCenter()
    );
    printMapComponent.dispatch('change:setDPI', { resolution });
    if (suppressNewDPIMethod === false) {
      printResize.setResolution(resolution);
      printResize.updateLayers();
    }
    pageElement.style.width = `${widthImage}px`;
    pageElement.style.height = `${heightImage}px`;
    // Scale the printed map to make it fit in the preview
    const scaleWidth = orientation === 'portrait' ? widthImage : heightImage;
    const scaleFactor = `;transform: scale(${((widthInMm * 3.779527559055) / scaleWidth)});transform-origin: top left;`;
    pageElement.setAttribute('style', pageElement.getAttribute('style') + scaleFactor);
    map.updateSize();
    map.getView().setResolution(scaleResolution);
  };

  const printSettings = PrintSettings({
    map,
    title,
    titlePlaceholderText,
    titleAlignment,
    titleSizes,
    titleSize,
    titleFormatIsVisible,
    description,
    descriptionPlaceholderText,
    descriptionAlignment,
    descriptionSizes,
    descriptionSize,
    descriptionFormatIsVisible,
    sizes,
    size,
    sizeCustomMinHeight,
    sizeCustomMaxHeight,
    sizeCustomMinWidth,
    sizeCustomMaxWidth,
    orientation,
    resolutions,
    resolution,
    scales,
    scaleInitial,
    showMargins,
    showCreated,
    showScale,
    showNorthArrow,
    showPrintLegend,
    rotation,
    rotationStep,
    viewerResolutions: originalResolutions
  });
  const printInteractionToggle = PrintInteractionToggle({ map, target, mapInteractionsActive, pageSettings: viewer.getViewerOptions().pageSettings });
  const printToolbar = PrintToolbar();
  return Component({
    name: 'printComponent',
    onInit() {
      this.on('render', this.onRender);

      this.addComponent(printSettings);
      this.addComponent(printInteractionToggle);
      this.addComponent(printToolbar);
      this.addComponent(closeButton);
      printToolbar.on('PNG', this.downloadPNG.bind(this));
      const ua = navigator.userAgent;
      // Don't use printToScale PDF download for IE and Edge pre Edge Chromium because it don't work for those browsers
      if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1 || ua.indexOf('Edge') > -1) {
        printToolbar.on('PDF', this.downloadPDF.bind(this));
      } else {
        printToolbar.on('PDF', this.printToScalePDF.bind(this));
      }
      printSettings.on('change:description', this.changeDescription.bind(this));
      printSettings.on('change:descriptionSize', this.changeDescriptionSize.bind(this));
      printSettings.on('change:descriptionAlign', this.changeDescriptionAlign.bind(this));
      printSettings.on('change:margin', this.toggleMargin.bind(this));
      printSettings.on('change:orientation', this.changeOrientation.bind(this));
      printSettings.on('change:size', this.changeSize.bind(this));
      printSettings.on('change:size-custom', this.changeCustomSize.bind(this));
      printSettings.on('change:title', this.changeTitle.bind(this));
      printSettings.on('change:titleSize', this.changeTitleSize.bind(this));
      printSettings.on('change:titleAlign', this.changeTitleAlign.bind(this));
      printSettings.on('change:created', this.toggleCreated.bind(this));
      printSettings.on('change:northarrow', this.toggleNorthArrow.bind(this));
      printSettings.on('change:printlegend', this.togglePrintLegend.bind(this));
      printSettings.on('change:resolution', this.changeResolution.bind(this));
      printSettings.on('change:scale', this.changeScale.bind(this));
      printSettings.on('change:showscale', this.toggleScale.bind(this));
      closeButton.on('click', this.close.bind(this));
    },
    changeDescription(evt) {
      description = evt.value;
      descriptionComponent.update();
      this.updatePageSize();
    },
    changeDescriptionSize(evt) {
      descriptionSize = evt.class;
      descriptionComponent.update();
      this.updatePageSize();
    },
    changeDescriptionAlign(evt) {
      descriptionAlign = evt.class;
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
      if (printScale > 0) {
        this.changeScale({ scale: printScale });
      }
    },
    changeTitle(evt) {
      title = evt.value;
      titleComponent.update();
      this.updatePageSize();
    },
    changeTitleSize(evt) {
      titleSize = evt.class;
      titleComponent.update();
      this.updatePageSize();
    },
    changeTitleAlign(evt) {
      titleAlign = evt.class;
      titleComponent.update();
      this.updatePageSize();
    },
    changeResolution(evt) {
      resolution = evt.resolution;
      if (!supressResolutionsRecalculation) {
        updateResolutions();
      }

      this.updatePageSize();
      if (printScale > 0) {
        this.changeScale({ scale: printScale });
      }
    },
    changeScale(evt) {
      setScale(evt.scale);
    },
    printMargin() {
      return showMargins ? 'print-margin' : '';
    },
    toggleMargin() {
      pageElement.classList.toggle(printMarginClass);
      showMargins = !showMargins;
      this.updatePageSize();
    },
    toggleCreated() {
      showCreated = !showCreated;
      createdComponent.update();
      this.updatePageSize();
    },
    toggleScale() {
      showScale = !showScale;
      printMapComponent.dispatch('change:toggleScale', { showScale });
    },
    toggleNorthArrow() {
      showNorthArrow = !showNorthArrow;
      printMapComponent.dispatch('change:toggleNorthArrow', { showNorthArrow });
    },
    togglePrintLegend() {
      showPrintLegend = !showPrintLegend;
      printMapComponent.dispatch('change:togglePrintLegend', { showPrintLegend });
    },
    close() {
      if (suppressNewDPIMethod === false) {
        printResize.resetLayers();
        printResize.setResolution(150);
      }
      // Restore monkey patch
      // WORKAROUND: Remove when OL supports transform: scale
      // See https://github.com/openlayers/openlayers/issues/13283
      PluggableMap.prototype.getEventPixel = original;
      // Restore scales
      if (!supressResolutionsRecalculation) {
        const viewerResolutions = viewer.getResolutions();
        for (let ix = 0; ix < viewerResolutions.length; ix += 1) {
          viewerResolutions[ix] = originalResolutions[ix];
        }
        originalGrids.forEach((value, key) => {
          // Sorry, but there is no setter and a map does not allow indexing.
          // eslint-disable-next-line no-param-reassign
          key.getSource().tileGrid = value;
        });
        // As we do a "dirty" update of resolutions we have to trigger a re-read of the limits, otherwise the outer limits still apply.
        map.getView().setMinZoom(0);
        map.getView().setMaxZoom(viewerResolutions.length - 1);
        originalGrids.clear();
      }
      printMapComponent.removePrintControls();
      if (map.getView().getRotation() !== 0) {
        map.getView().setRotation(0);
      }
      const printElement = document.getElementById(this.getId());
      map.setTarget(viewerMapTarget);
      if (printInteractionToggle) {
        printInteractionToggle.restoreInteractions();
      }
      this.restoreViewerControls();
      printElement.remove();
    },
    async downloadPNG() {
      await downloadPNG({
        afterRender: afterRender(map),
        beforeRender: beforeRender(map),
        filename: `${filename}.png`,
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
        filename,
        height,
        orientation: pdfOrientation,
        size,
        width
      });
    },
    async printToScalePDF() {
      let height;
      let width;
      const pdfOrientation = orientation === 'portrait' ? 'portrait' : 'landscape';
      if (sizes[size][1] > sizes[size][0]) {
        height = sizes[size][0];
        width = sizes[size][1];
      } else {
        height = sizes[size][1];
        width = sizes[size][0];
      }
      widthImage = orientation === 'portrait' ? Math.round((sizes[size][1] * resolution) / 25.4) : Math.round((sizes[size][0] * resolution) / 25.4);
      heightImage = orientation === 'portrait' ? Math.round((sizes[size][0] * resolution) / 25.4) : Math.round((sizes[size][1] * resolution) / 25.4);
      await printToScalePDF({
        el: pageElement,
        filename,
        height,
        orientation: pdfOrientation,
        size,
        width,
        printScale,
        widthImage,
        heightImage
      });
    },
    async onRender() {
      // Monkey patch OL
      // WORKAROUND: Remove when OL supports transform: scale
      // See https://github.com/openlayers/openlayers/issues/13283
      PluggableMap.prototype.getEventPixel = getEventPixelScale;
      printScale = 0;
      today = new Date(Date.now());
      viewerMapTarget = map.getTarget();
      pageContainerElement = document.getElementById(pageContainerId);
      pageElement = document.getElementById(pageId);
      map.setTarget(printMapComponent.getId());
      this.removeViewerControls();
      await printMapComponent.addPrintControls();
      if (!supressResolutionsRecalculation) {
        updateResolutions();
      }
      printMapComponent.dispatch('change:toggleScale', { showScale });
      this.updatePageSize();
    },
    updateMapSize() {
      map.updateSize();
    },
    updatePageSize() {
      pageContainerElement.style.height = orientation === 'portrait' ? `${sizes[size][0]}mm` : `${sizes[size][1]}mm`;
      pageContainerElement.style.width = orientation === 'portrait' ? `${sizes[size][1]}mm` : `${sizes[size][0]}mm`;
      this.updateMapSize();
      if (printScale > 0) {
        this.changeScale({ scale: printScale });
      }
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
      const draganddropControl = viewer.getControlByName('draganddrop');
      if (draganddropControl) draganddropControl.addInteraction();
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
    descriptionComponent, printMapComponent, titleComponent, footerComponent
  })}
            </div>
          </div>
        </div>
        <div id="o-print-tools-left" class="top-left fixed no-print flex column spacing-vertical-small z-index-ontop-top height-full">
          ${printSettings.render()}
          ${printInteractionToggle.render()}
        </div>
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
