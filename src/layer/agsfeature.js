import EsriJSON from 'ol/format/esrijson';
import VectorSource from 'ol/source/vector';
import loadingstrategy from 'ol/loadingstrategy';
import viewer from '../viewer';
import vector from './vector';
import deep from '../utils/deep';
import meld from '../utils/meld';

function agsFeatureError(error) {
  console.log('AGS FEATURE FETCH ERROR: ', error);
}

function createSource(options) {
  const sources = options.sources;
  const esriSrs = options.projectionCode.split(':').pop();
  const queryFilter = options.filter ? `&where=${options.filter}` : '';
  const esrijsonFormat = new EsriJSON();
  const vectorSource = new VectorSource({
    attributions: options.attribution,
    loader(extent, resolution, projection) {
      const that = this;
      const url = options.url + options.id +
        encodeURI([
          '/query?f=json&',
          'returnGeometry=true',
          '&spatialRel=esriSpatialRelIntersects',
          `&geometry={"xmin":${extent[0]},"ymin":`,
          `${extent[1]},"xmax":${extent[2]},"ymax":${extent[3]}`,
          `,"spatialReference":{"wkid":${esriSrs}}`,
          '&geometryType=esriGeometryEnvelope',
          `&inSR=${esriSrs}&outFields=*`,
          '&returnIdsOnly=false&returnCountOnly=false',
          '&geometryPrecision=2',
          `&outSR=${esriSrs}${queryFilter}`].join(''));
      try {
        fetch(url).then(response => response.json()).then((json) => {
          that.addFeatures(json.features.map((feature) => {
            const f = esrijsonFormat.readFeature(feature, {
              featureProjection: projection
            });
            return Object.assign(f, { sources });
          }));
        });
      } catch (error) {
        agsFeatureError(error);
      }
    },
    strategy: loadingstrategy.bbox,
    sources: () => sources
  });
  return vectorSource;
}

const agsFeature = function agsFeature(layerOptions) {
  const agsDefault = deep({
    layerType: 'vector'
  });
  const sourceDefault = {};
  const options = deep(layerOptions);
  const name = deep(viewer.getMapSource()[layerOptions.sourceName]);
  const agsOptions = meld(agsDefault, options);
  const sourceOptions = meld(sourceDefault, name);
  sourceOptions.geometryName = agsOptions.geometryName;
  sourceOptions.filter = agsOptions.filter;
  sourceOptions.attribution = agsOptions.attribution;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.id = agsOptions.id;
  sourceOptions.sources = agsOptions.sources;
  const agsSource = createSource(sourceOptions);
  return vector(agsOptions, agsSource);
};

export default agsFeature;
