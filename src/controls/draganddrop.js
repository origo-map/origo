import olDragAndDrop from 'ol/interaction/DragAndDrop';
import GPXFormat from 'ol/format/GPX';
import GeoJSONFormat from 'ol/format/GeoJSON';
import IGCFormat from 'ol/format/IGC';
import KMLFormat from 'ol/format/KML';
import TopoJSONFormat from 'ol/format/TopoJSON';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Component } from '../ui';

const DragAndDrop = function DragAndDrop() {
  let viewer;

  return Component({
    name: 'draganddrop',
    onAdd(evt) {
      viewer = evt.target;
      const map = viewer.getMap();
      let vectorSource;
      let vectorLayer;

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

        vectorLayer = new VectorLayer({
          source: vectorSource,
          name: event.file.name.split('.')[0].replace(/\W/g, ''),
          group: 'root',
          title: event.file.name.split('.')[0],
          queryable: true,
          removable: true
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
