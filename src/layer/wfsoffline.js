import { createXYZ } from 'ol/tilegrid';
import vector from './vector';
import WfsSource from './wfssource';
import WfsOfflineSource from './wfsoflinesource';

// TODO: Add option for overriding preload extent? Can set layer's extent, map's extent, infinity (could be a problem with geoserver) or specific extent?
// This can be useful for sparse data. If used, no extent should be recorded or returned.
export default function wfs(layerOptions, viewer) {
  const wfsDefault = {
    layerType: 'vector'
  };
  const sourceDefault = {
    filterType: 'cql'
  };
  const wfsOptions = Object.assign({}, wfsDefault, layerOptions);
  const sourceOptions = Object.assign({}, sourceDefault, viewer.getMapSource()[layerOptions.sourceName]);
  sourceOptions.featureType = wfsOptions.id;
  wfsOptions.featureType = wfsOptions.id;
  sourceOptions.offlineStoreName = wfsOptions.offlineStoreName;
  sourceOptions.geometryName = wfsOptions.geometryName;
  sourceOptions.filter = wfsOptions.filter;
  sourceOptions.attribution = wfsOptions.attribution;
  sourceOptions.customExtent = wfsOptions.extent;
  sourceOptions.name = wfsOptions.name;
  sourceOptions.offlineUseLayerExtent = wfsOptions.offlineUseLayerExtent;
  wfsOptions.extent = undefined;
  sourceOptions.resolutions = viewer.getResolutions();
  sourceOptions.projectionCode = viewer.getProjectionCode();
  if (wfsOptions.projection) {
    sourceOptions.dataProjection = wfsOptions.projection;
  } else if (sourceOptions.projection) {
    sourceOptions.dataProjection = sourceOptions.projection;
  } else {
    sourceOptions.dataProjection = viewer.getProjectionCode();
  }

  // Override some settings if it is a table (ignoring geometry) so the user does not have to remember to set them
  if (wfsOptions.isTable) {
    sourceOptions.isTable = true;
    wfsOptions.visible = true;
  }
  
  const wfsSource = new WfsOfflineSource(sourceOptions, viewer);
  // This call is async, but we can't await it here. Let it just finish when it's done.
  wfsSource.init().then(() => {
    // TODO: remove debug logging
    console.log(`init offline layer ${wfsOptions.id}`);
  })
    .catch((e) => {
      const msg = `Failed to initialise offline database${e}`;
      viewer.getLogger().createToast({ status: 'danger', message: msg });
      // TODO: remove debug logging
      console.error(`Failed to initialise offline database${e}`);
    });
  const newlayer = vector(wfsOptions, wfsSource, viewer);
  // TODO: remove it's just a test
  newlayer.on('sourceready', e => {
    console.log(e);
  });
  return newlayer;
}
