import DragAndDrop from 'ol/interaction/draganddrop';
import GPXFormat from 'ol/format/gpx';
import GeoJSONFormat from 'ol/format/geojson';
import IGCFormat from 'ol/format/igc';
import KMLFormat from 'ol/format/kml';
import TopoJSONFormat from 'ol/format/topojson';
import VectorSource from 'ol/source/vector';
import VectorLayer from 'ol/layer/vector';
import viewer from '../viewer';
import legend from './legend';

function init(optOptions) {
  const options = optOptions || {};
  const map = viewer.getMap();
  const groupTitle = options.groupTitle || 'Egna lager';
  let vectorSource;
  let vectorLayer;
  let vectorLayerName;
  let group;

  const dragAndDrop = new DragAndDrop({
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
      name: event.file.name.split('.')[0].replace(/\W/g,''),
      group: 'draganddrop',
      title: event.file.name.split('.')[0],
      queryable: true,
      removable: true
    });

    viewer.getSettings().layers.push(vectorLayer);
    map.addLayer(vectorLayer);
    map.getView().fit(vectorSource.getExtent());

    if (!document.getElementById('o-group-draganddrop')) {
      group = {
        name: 'draganddrop',
        title: groupTitle,
        expanded: true
      };
      legend.createGroup(group, undefined, true);
    }

    vectorLayerName = vectorLayer.get('name');

    legend.createLegendItem(vectorLayerName, true);
    legend.addMapLegendItem(vectorLayer, vectorLayerName);
    legend.addCheckbox(vectorLayer, vectorLayerName);
    legend.addTickListener(vectorLayer);
    legend.addMapLegendListener(vectorLayer);
  });
}

export default { init };
