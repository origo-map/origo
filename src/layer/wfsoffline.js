import vector from './vector';
import WfsOfflineSource from './wfsofflinesource';

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
  wfsSource.init()
    .catch((e) => {
      // Layers are init before controls are added so localization control is not accessible earlier
      // but when error arises it will. This is not a race condition, it is the result of run to completion
      // as there is no other async stuff going on.
      const loc = viewer.getControlByName('localization');
      const msg = loc.getStringByKeys({ targetParentKey: 'wfsoffline', targetKey: 'init_failed' });
      viewer.getLogger().createToast({ status: 'danger', message: msg });
      console.error(e);
    });
  const newlayer = vector(wfsOptions, wfsSource, viewer);

  return newlayer;
}
