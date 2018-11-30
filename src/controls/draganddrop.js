import DragAndDrop from 'ol/interaction/DragAndDrop';
import GPXFormat from 'ol/format/GPX';
import GeoJSONFormat from 'ol/format/GeoJSON';
import IGCFormat from 'ol/format/IGC';
import KMLFormat from 'ol/format/KML';
import TopoJSONFormat from 'ol/format/TopoJSON';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
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
