import olDragAndDrop from 'ol/interaction/DragAndDrop';
import GPXFormat from 'ol/format/GPX';
import GeoJSONFormat from 'ol/format/GeoJSON';
import IGCFormat from 'ol/format/IGC';
import KMLFormat from 'ol/format/KML';
import TopoJSONFormat from 'ol/format/TopoJSON';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Style from '../style';
import { Component, InputFile, Button, Element as El } from '../ui';
import { getStylewindowStyle } from './editor/stylewindow';

const DragAndDrop = function DragAndDrop(options = {}) {
  let dragAndDrop;
  let viewer;
  let map;
  let legendButton;

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
      text: 'Lägg till från fil',
      ariaLabel: 'Lägg till från fil'
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
      const groupName = options.groupName || 'egna-lager';
      const groupTitle = options.groupTitle || 'Egna lager';
      const styleByAttribute = options.styleByAttribute || false;
      const featureStyles = options.featureStyles || {
        Point: [{
          circle: {
            radius: 5,
            stroke: {
              color: [0, 255, 255, 1],
              width: 0
            },
            fill: {
              color: [0, 255, 255, 1]
            }
          }
        }],
        LineString: [{
          stroke: {
            color: [255, 255, 255, 1],
            width: 5
          }
        },
        {
          stroke: {
            color: [0, 255, 255, 0.5],
            width: 3
          }
        }],
        Polygon: [{
          stroke: {
            color: [255, 255, 255, 1],
            width: 5
          }
        },
        {
          stroke: {
            color: [0, 255, 255, 1],
            width: 3
          }
        },
        {
          fill: {
            color: [0, 255, 255, 0.1]
          }
        }]
      };
      let vectorSource;
      let vectorLayer;
      const vectorStyles = Style.createGeometryStyle(featureStyles);
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
        vectorSource = new VectorSource({
          features: event.features
        });
        vectorSource.forEachFeature((feature) => {
          if (feature.get('style') && styleByAttribute) {
            const featureStyle = getStylewindowStyle(feature, feature.get('style'));
            feature.setStyle(featureStyle);
          }
        });
        if (!viewer.getGroup(groupName)) {
          viewer.addGroup({ title: groupTitle, name: groupName, expanded: true });
        }
        vectorLayer = new VectorLayer({
          source: vectorSource,
          name: layerName,
          group: groupName,
          title: layerTitle,
          queryable: true,
          removable: true,
          style: vectorStyles[event.features[0].getGeometry().getType()]
        });

        map.addLayer(vectorLayer);
        map.getView().fit(vectorSource.getExtent());
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
