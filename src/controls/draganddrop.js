import olDragAndDrop from 'ol/interaction/DragAndDrop';
import GPXFormat from 'ol/format/GPX';
import GeoJSONFormat from 'ol/format/GeoJSON';
import IGCFormat from 'ol/format/IGC';
import KMLFormat from 'ol/format/KML';
import TopoJSONFormat from 'ol/format/TopoJSON';
import { Component, InputFile, Button, Element as El } from '../ui';
import { getUnusedColor } from '../utils/colorpalette';
import { addLayerStyle } from '../utils/layercolor';

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
        // Give each layer its own color unless styles are configured or the file has its own styles (kml)
        if (!featureStyles && !['kml', 'kmz'].includes(fileExtension.toLowerCase())) {
          if (styleByAttribute) {
            // Features with a style attribute keep their own style
            const getStyleFunction = viewer.getStylewindow().getStyleFunction;
            event.features.forEach((feature) => {
              const featureStyle = feature.get('origostyle') || feature.get('style');
              if (feature.getGeometry() && featureStyle && typeof featureStyle === 'object') {
                feature.setStyle(getStyleFunction(feature));
              }
            });
          }
          // Only features without their own style get the layer color
          let layerColor;
          if (event.features.some(feature => feature.getGeometry() && !feature.getStyle())) {
            const usedColors = viewer.getLayers().map(l => l.get('layerColor')).filter(color => color);
            layerColor = getUnusedColor(usedColors);
            layerOptions.layerColor = layerColor;
          }
          layerOptions.styleByAttribute = false;
          layerOptions.style = addLayerStyle({
            name: layerName,
            color: layerColor,
            features: event.features,
            labels: { layerColor: localize('layerColorLabel'), ownStyle: localize('ownStyleLabel') },
            viewer
          });
        } else if (!styleByAttribute) {
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
        const layer = viewer.addLayer(layerOptions);
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
