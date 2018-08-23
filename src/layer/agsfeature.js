import $ from 'jquery';
import EsriJSON from 'ol/format/esrijson';
import VectorSource from 'ol/source/vector';
import loadingstrategy from 'ol/loadingstrategy';
import viewer from '../viewer';
import vector from './vector';

function createSource(options) {
  const esriSrs = options.projectionCode.split(':').pop();
  const queryFilter = options.filter ? `&where=${options.filter}` : '';
  const esrijsonFormat = new EsriJSON();
  const vectorSource = new VectorSource({
    attributions: options.attribution,
    loader(extent, resolution, projection) {
      const that = this;
      const url = options.url + options.id +
        encodeURI(['/query?f=json&',
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
      $.ajax({
        url,
        dataType: 'jsonp',
        success: (response) => {
          if (response.error) {
            alert(`${response.error.message}\n${response.error.details.join('\n')}`);
          } else {
            // dataProjection will be read from document
            const features = esrijsonFormat.readFeatures(response, {
              featureProjection: projection
            });
            if (features.length > 0) {
              that.addFeatures(features);
            }
          }
        }
      });
    },
    strategy: loadingstrategy.bbox
  });
  return vectorSource;
}

const agsFeature = function agsFeature(layerOptions) {
  const agsDefault = {
    layerType: 'vector'
  };
  const sourceDefault = {};
  const agsOptions = $.extend(agsDefault, layerOptions);
  const sourceOptions = $.extend(sourceDefault, viewer.getMapSource()[layerOptions.sourceName]);
  sourceOptions.geometryName = agsOptions.geometryName;
  sourceOptions.filter = agsOptions.filter;
  sourceOptions.attribution = agsOptions.attribution;
  sourceOptions.projectionCode = viewer.getProjectionCode();
  sourceOptions.id = agsOptions.id;

  const agsSource = createSource(sourceOptions);
  return vector(agsOptions, agsSource);
};

export default agsFeature;
