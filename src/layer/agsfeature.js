import $ from 'jquery';
import EsriJSON from 'ol/format/EsriJSON';
import VectorSource from 'ol/source/Vector';
import * as loadingstrategy from 'ol/loadingstrategy';
import vector from './vector';

function createSource({
  attribution,
  id,
  filter,
  projectionCode,
  url: sourceUrl
} = {}) {
  const esriSrs = projectionCode.split(':').pop();
  const queryFilter = filter ? `&where=${filter}` : '';
  const esrijsonFormat = new EsriJSON();
  const vectorSource = new VectorSource({
    attributions: attribution,
    loader(extent, resolution, projection) {
      const that = this;
      let url = sourceUrl.endsWith('/') ? sourceUrl : `${sourceUrl}/`;
      url += id +
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

const agsFeature = function agsFeature(layerOptions, viewer) {
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
  return vector(agsOptions, agsSource, viewer);
};

export default agsFeature;
