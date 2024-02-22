import { ImageArcGISRest, ImageWMS } from 'ol/source';

function getOneUrl(aLayer) {
  const source = aLayer.getSource();
  if ((source instanceof ImageWMS || source instanceof ImageArcGISRest) && typeof source.getUrl === 'function') {
    return source.getUrl();
  } else if (typeof source.getUrls === 'function') {
    return source.getUrls()[0];
  }
  return null;
}

async function fetchJsonLegend({
  url,
  serverVendor
}) {
  const reply = await fetch(url);
  const json = await reply.json();
  if (serverVendor === 'arcgis') return json?.layers;
  else if (serverVendor === 'geoserver') return json.Legend[0]?.rules;
  return [];
}
async function getJsonLegendDetails({ layer, viewer, legendOpts }) {
  const mapSource = viewer.getMapSource();
  const sourceName = layer.get('sourceName');
  let serverVendor = mapSource[sourceName].type?.toLowerCase();
  if (!serverVendor) serverVendor = 'geoserver'; // make similar assumption as before
  let url;

  if (serverVendor === 'arcgis') {
    let mapServerUrlString = getOneUrl(layer);
    if (layer.get('type') === 'WMS') {
      const urlParts = mapServerUrlString.split('services');
      mapServerUrlString = `${urlParts[0]}rest/services${urlParts[1].split('/WMSServer')[0]}`;
    }
    mapServerUrlString += '/legend';
    url = new URL(mapServerUrlString);
    url.searchParams.append('f', 'json');
    url.searchParams.append('dpi', legendOpts?.dpi || 150);
  } else if (serverVendor === 'geoserver') {
    const maxResolution = viewer.getResolutions()[viewer.getResolutions().length - 1];
    url = layer.getSource().getLegendUrl(maxResolution, {
      FORMAT: 'application/json',
      ...legendOpts
    });
  }
  if (url) {
    return fetchJsonLegend({
      url,
      serverVendor
    });
  } return [];
}

export default getJsonLegendDetails;
