export function getSourceUrl(layer) {
  let sourceUrl;
  const source = layer.getSource();
  if (source && typeof source.getUrl === 'function') {
    sourceUrl = source.getUrl();
  } else if (source && Array.isArray(source.getUrls()) && source.getUrls().length > 0) {
    sourceUrl = source.getUrls()[0];
  }
  return sourceUrl;
}

async function fetchJsonLegend({
  url,
  serverVendor
}) {
  const reply = await fetch(url);
  let json;
  let rules;
  try {
    json = await reply.json();
  } catch (e) {
    json = undefined;
  }
  if (json) {
    if (serverVendor === 'arcgis') rules = json?.layers;
    else if (serverVendor === 'geoserver') rules = json?.Legend[0]?.rules;
    else if (serverVendor === 'qgis') rules = json?.nodes[0]?.symbols;
  } else rules = [];

  if (rules === undefined) rules = [];
  return rules;
}
export default async function getJsonLegendDetails({ layer, viewer, legendOpts }) {
  const mapSource = viewer.getMapSource();
  const sourceName = layer.get('sourceName');
  let serverVendor = mapSource[sourceName].type?.toLowerCase();
  if (!serverVendor) serverVendor = 'geoserver'; // make similar assumption as before
  const maxResolution = viewer.getResolutions()[viewer.getResolutions().length - 1];
  let url;

  if (serverVendor === 'arcgis') {
    let mapServerUrlString = getSourceUrl(layer);
    if (layer.get('type') === 'WMS') {
      const urlParts = mapServerUrlString.split('services');
      mapServerUrlString = `${urlParts[0]}rest/services${urlParts[1].split('/WMSServer')[0]}`;
    }
    mapServerUrlString += '/legend';
    url = new URL(mapServerUrlString);
    url.searchParams.append('f', 'json');
    url.searchParams.append('dpi', legendOpts?.dpi || 150);
  } else if (serverVendor === 'geoserver') {
    url = layer.getSource().getLegendUrl(maxResolution, {
      FORMAT: 'application/json',
      ...legendOpts
    });
  } else if (serverVendor === 'qgis') {
    url = layer.getSource().getLegendUrl(maxResolution, {
      FORMAT: 'application/json',
      SHOWRULEDETAILS: true,
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
