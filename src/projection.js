import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import olProjection from 'ol/proj/Projection';

const registerProjections = function registerProjections(proj4Defs) {
  if (proj4Defs && proj4) {
    proj4Defs.forEach((def) => {
      proj4.defs(def.code, def.projection);
    });
  }
  register(proj4);
};

const getUnits = function getUnits(projectionCode) {
  if (projectionCode === 'EPSG:3857') {
    return 'm';
  } else if (projectionCode === 'EPSG:4326') {
    return 'degrees';
  }
  const units = proj4.defs(projectionCode) ? proj4.defs(projectionCode).units : undefined;
  return units;
};

const Projection = function Projection({
  projectionCode,
  projectionExtent
} = {}) {
  if (projectionCode) {
    return new olProjection({
      code: projectionCode,
      extent: projectionExtent,
      units: getUnits(projectionCode)
    });
  }
  return null;
};

export default {
  Projection,
  registerProjections
};
