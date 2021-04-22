import olDragAndDrop from 'ol/interaction/DragAndDrop';
import GPXFormat from 'ol/format/GPX';
import GeoJSONFormat from 'ol/format/GeoJSON';
import IGCFormat from 'ol/format/IGC';
import KMLFormat from 'ol/format/KML';
import TopoJSONFormat from 'ol/format/TopoJSON';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import Style from '../style';
import { Component } from '../ui';

const DragAndDrop = function DragAndDrop(options = {}) {
  let viewer;

  return Component({
    name: 'draganddrop',
    onAdd(evt) {
      viewer = evt.target;
      const map = viewer.getMap();
      const groupName = options.groupName || 'egna-lager';
      const groupTitle = options.groupTitle || 'Egna lager';
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
      const dragAndDrop = new olDragAndDrop({
        formatConstructors: [
          GPXFormat,
          GeoJSONFormat,
          IGCFormat,
          KMLFormat,
          TopoJSONFormat
        ]
      });

      map.addInteraction(dragAndDrop);

      dragAndDrop.on('addfeatures', (event) => {
        vectorSource = new VectorSource({
          features: event.features
        });
        if (!viewer.getGroup(groupName)) {
          viewer.addGroup({ title: groupTitle, name: groupName, expanded: true });
        }
        vectorLayer = new VectorLayer({
          source: vectorSource,
          name: event.file.name.split('.')[0].replace(/\W/g, ''),
          group: groupName,
          title: event.file.name.split('.')[0],
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
    }
  });
};

export default DragAndDrop;
