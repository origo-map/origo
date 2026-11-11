import olDragAndDrop from 'ol/interaction/DragAndDrop';
import GPXFormat from 'ol/format/GPX';
import GeoJSONFormat from 'ol/format/GeoJSON';
import IGCFormat from 'ol/format/IGC';
import KMLFormat from 'ol/format/KML';
import TopoJSONFormat from 'ol/format/TopoJSON';
import { Component, InputFile, Button, Element as El } from '../ui';

const DragAndDrop = function DragAndDrop(options = {}) {
  let dragAndDrop;
  let viewer;
  let map;
  let legendButton;
  const localization = options.localization;

  function localize(key) {
    return localization.getStringByKeys({ targetParentKey: 'draganddrop', targetKey: key });
  }

  if (options.showLegendButton) {
    const fileInput = InputFile({
      labelCls: 'hidden',
      inputCls: 'hidden',
      change(e) {
        const filesToDrop = e.target.files;

        function fakeIt(file) {
          this.dropEffect = 'copy';
          this.effectAllowed = 'all';
          this.items = [];
          this.types = [];
          this.getData = function getData() {
            return file;
          };
          this.files = file;
        }

        const fakeEvent = new DragEvent('drop');
        Object.defineProperty(fakeEvent, 'dataTransfer', {
          value: new fakeIt(filesToDrop)
        });
        viewer.getMap().getViewport().dispatchEvent(fakeEvent);
      }
    });

    const openBtn = Button({
      cls: 'text-medium padding-0',
      click() {
        const inputEl = document.getElementById(fileInput.getId());
        inputEl.value = null;
        inputEl.click();
      },
      text: localize('addFromFile'),
      ariaLabel: localize('addFromFile')
    });

    legendButton = El({
      components: [fileInput, openBtn]
    });

    legendButton.on('click', () => {
      openBtn.dispatch('click');
    });
  }

  return Component({
    name: 'draganddrop',
    onAdd(evt) {
      viewer = evt.target;
      map = viewer.getMap();
      if (options.showLegendButton) {
        const legend = viewer.getControlByName('legend');
        legend.addButtonToTools(legendButton, 'addLayerButton');
      }
      const groupName = options.groupName || localize('yourLayersName');
      const groupTitle = options.groupTitle || localize('yourLayersTitle');
      const draggable = options.draggable || true;
      const promptlessRemoval = options.promptlessRemoval !== false;
      const styleByAttribute = options.styleByAttribute || false;
      const zoomToExtent = options.zoomToExtent !== false;
      const zoomToExtentOnLoad = options.zoomToExtentOnLoad !== false;
      const featureStyles = options.featureStyles;
      dragAndDrop = new olDragAndDrop({
        formatConstructors: [
          GPXFormat,
          GeoJSONFormat,
          IGCFormat,
          KMLFormat,
          TopoJSONFormat
        ]
      });

      this.addInteraction();

      dragAndDrop.on('addfeatures', (event) => {
        const fileExtension = event.file.name.split('.').pop();
        let layerName = event.file.name.split('.')[0].replace(/\W/g, '');
        let layerTitle = event.file.name.split('.')[0];
        if (viewer.getLayer(layerName)) {
          let i = 1;
          while (i < 99) {
            if (!viewer.getLayer(`${layerName}-${i}`)) {
              layerName = `${layerName}-${i}`;
              layerTitle = `${layerTitle} ${i}`;
              break;
            }
            i += 1;
          }
        }
        if (!viewer.getGroup(groupName)) {
          viewer.addGroup({ title: groupTitle, name: groupName, expanded: true, draggable });
        }
        const layerOptions = {
          group: groupName,
          name: layerName,
          title: layerTitle,
          zIndex: 6,
          styleByAttribute,
          queryable: true,
          removable: true,
          promptlessRemoval,
          zoomToExtent,
          visible: true,
          source: 'none',
          type: 'GEOJSON',
          features: event.features
        };
        if (!styleByAttribute) {
          const styles = [];
          const types = new Set();
          const getStyleFunction = viewer.getStylewindow().getStyleFunction;
          event.features.forEach((feature) => {
            if (feature.getGeometry() !== null) {
              const geometryType = feature.getGeometry().getType();
              if (featureStyles && featureStyles[geometryType]) {
                if (!types.has(geometryType)) {
                  styles.push(...featureStyles[geometryType]);
                  types.add(geometryType);
                }
              } else {
                getStyleFunction(feature);
              }
            }
          });
          if (styles.length && (!['kml', 'kmz'].includes(fileExtension.toLowerCase()))) {
            layerOptions.styleDef = styles;
          }
        }
        // "Show coordinates" in the layer menu is handled by the viewer, for all vector layers. The control's
        // coordinatesMenuItem overrides the map's for the layers added here; without geometries there is nothing to show.
        const hasGeometry = event.features.some(feature => feature.getGeometry());
        if (!hasGeometry) {
          layerOptions.coordinatesMenuItem = false;
        } else if (typeof options.coordinatesMenuItem === 'boolean') {
          layerOptions.coordinatesMenuItem = options.coordinatesMenuItem;
        }
        layerOptions.showCoordinates = options.showCoordinates === true;
        const layer = viewer.addLayer(layerOptions);
        if (typeof layer.get('showCoordinates') === 'boolean') {
          // Statistics event when the coordinates are shown or hidden from the layer menu, with the file format only
          layer.on('change:showCoordinates', () => {
            viewer.dispatch('draganddrop:coordinates', { show: layer.get('showCoordinates'), format: fileExtension.toLowerCase() });
          });
        }
        if (zoomToExtentOnLoad) {
          const extent = typeof layer.getSource !== 'undefined' && typeof layer.getSource().getExtent !== 'undefined' ? layer.getSource().getExtent() : layer.getExtent();
          if (layer.getVisible()) {
            viewer.getMap().getView().fit(extent, {
              padding: [50, 50, 50, 50],
              duration: 1000
            });
          }
        }
      });
      this.render();
    },
    onInit() {
    },
    render() {
      this.dispatch('render');
    },
    addInteraction() {
      map.addInteraction(dragAndDrop);
    }
  });
};

export default DragAndDrop;
