import olDragAndDrop from 'ol/interaction/draganddrop';
import GPXFormat from 'ol/format/gpx';
import GeoJSONFormat from 'ol/format/geojson';
import IGCFormat from 'ol/format/igc';
import KMLFormat from 'ol/format/kml';
import TopoJSONFormat from 'ol/format/topojson';
import VectorSource from 'ol/source/vector';
import VectorLayer from 'ol/layer/vector';
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
