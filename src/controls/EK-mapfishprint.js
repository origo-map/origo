import {
  ImageWMS,
  TileWMS } from 'ol/source';
import GeoJSON from 'ol/format/GeoJSON';
import $ from 'jquery';
import { getArea, getLength } from 'ol/sphere';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import { Component } from '../ui';
import PinStyle from '../style/pin';

const Mapfishprint = function Mapfishprint(options = {}) {
  const {
    MapfishCreateUrl,
    layerErrorMessage,
    otherErrorMessage
  } = options;

  let viewer = options.viewer;
  let progressElementMem = null;
  const failureSpan = document.createElement('span');
  failureSpan.setAttribute('id', 'o-dl-progress');
  failureSpan.setAttribute('style', 'display: block; padding-right: 4px; padding-left: 5px; padding-bottom: 4px; padding-top: 3px; background-color: rgba(255, 165, 0, 0.31)');
  const failure = document.createElement('img');
  failure.setAttribute('src', 'img/sms_failed-24px.svg');
  failure.setAttribute('style', 'vertical-align: bottom');
  failureSpan.appendChild(failure);
  const failureReason = document.createElement('small');
  let printStatus = '';

  // All urls should point to wms service, regardless if layer type is wfs
  function fetchSourceUrl(layer) {
    let url;
    switch (layer.get('type').toUpperCase()) {
      case 'WMS': {
        if (layer.getSource() instanceof TileWMS) {
          url = layer.getSource().getUrls()[0];
        } else if (layer.getSource() instanceof ImageWMS) {
          url = layer.getSource().getUrl();
        }
        if (url.charAt(0) === '/') {
          url = `${window.location.protocol}//${window.location.hostname}${url}`;
        }
        break;
      }
      case 'WFS': {
        const fullUrl = viewer.getSettings().source[layer.get('sourceName')].url;
        const parsed = fullUrl.split('/');
        const result = `${parsed[0]}//${parsed[2]}`;
        url = `${result}/geoserver/wms`;
        break;
      }
      default: {
        url = '';
      }
    }
    return url;
    // return viewer.getSettings().source[sourceName].url;
  }

  /**
   *
   * @param {(Object[])} layers
   */
  function buildLayersObjects(inLayers, type) {
    // WFS style defaults
    let fillColor = '#FC345C';
    let fillOpacity = 0.5;
    let strokeColor = '#FC345C';
    let strokeWidth = 3;
    let pointRadius = 10;
    let pointFillColor = '#FC345C';
    let externalGraphic = '';
    let graphicOpacity = 1;
    let labelAlign = 'cm';
    let labelOutlineColor = 'white';
    let labelOutlineWidth = 3;
    let fontSize = '16';
    let fontColor = '#FFFFFF';
    let fontBackColor = '#000000';

    // Filter layers by type
    const layers = inLayers.filter((layer) => layer.get('type') === type);

    const printableLayers = [];
    function modifyDefaultStyles(styles) {
      // based on index.json styles being defined as [[]]
      // eslint-disabled because part of code is broken (utils not defined)
      /* eslint-disable */
      styles.forEach((s) => {
        s.forEach((f) => {
          // Set fill properties if fill exists
          if (Object.prototype.hasOwnProperty.call(f, 'fill')) {
            if (Object.prototype.hasOwnProperty.call(f.fill, 'color')) {
              fillColor = utils.rgbaToHex(f.fill.color).toUpperCase();
            }
            if (Object.prototype.hasOwnProperty.call(f.fill, 'opacity')) {
              fillOpacity = f.fill.opacity;
            }
          }
          // Set stroke properties if stroke exists
          // Stroke properties (opacity, linecap, dashstyle)
          if (f.hasOwnProperty('stroke')) {
            if (f.stroke.hasOwnProperty('color')) {
              strokeColor = utils.rgbaToHex(f.stroke.color).toUpperCase();
            }
            if (f.stroke.hasOwnProperty('width')) {
              strokeWidth = f.stroke.width;
            }
          }
          // Punkt-stilar?? Det verkar så.
          if (f.hasOwnProperty('circle')) {
            if (f.circle.hasOwnProperty('stroke')) {
              if (f.circle.stroke.hasOwnProperty('color')) {
                strokeColor = utils.rgbaToHex(f.circle.stroke.color);
              }
              if (f.circle.stroke.hasOwnProperty('width')) {
                strokeWidth = f.circle.stroke.width;
              }
            }
            if (f.circle.hasOwnProperty('fill')) {
              if (f.circle.fill.hasOwnProperty('color')) {
                fillColor = utils.rgbaToHex(f.circle.fill.color);
              }
            }
            if (f.circle.hasOwnProperty('radius')) {
              pointRadius = f.circle.radius;
            }
            if (f.circle.hasOwnProperty('color')) {
              pointFillColor = utils.rgbaToHex(f.circle.color);
            }
            if (f.circle.hasOwnProperty('source')) {
              pointSrc = f.circle.source;
            }
          }

          if (f.hasOwnProperty('label')) {
            if (f.label.hasOwnProperty('align')) {
              labelAlign = f.label.align;
            }
            if (f.label.hasOwnProperty('outlineColor')) {
              labelOutlineColor = utils.rgbaToHex(f.label.outlineColor);
            }
            if (f.label.hasOwnProperty('outlineWidth')) {
              labelOutlineWidth = f.label.outlineWidth;
            }
          }

          if (f.hasOwnProperty('font')) {
            if (f.font.hasOwnProperty('size')) {
              fontSize = f.font.size;
            }
            if (f.font.hasOwnProperty('color')) {
              fontColor = utils.rgbaToHex(f.font.color);
            }
            if (f.font.hasOwnProperty('backColor')) {
              fontBackColor = utils.rgbaToHex(f.font.backColor);
            }
          }
          if (f.hasOwnProperty('icon')) {
            if (f.icon.hasOwnProperty('src')) {
              externalGraphic = f.icon.src;
            }
            if (f.icon.hasOwnProperty('opacity')) {
              graphicOpacity = f.icon.opacity;
            }
          }
        });
      });
      /* eslint-enable */
    }
    switch (type) {
      case 'WMS': {
        let url;
        // Build wms objects one per source
        layers.forEach((layer) => {
          if (layer.getSource() instanceof TileWMS) {
            url = fetchSourceUrl(layer);
          } else if (layer.getSource() instanceof ImageWMS) {
            url = fetchSourceUrl(layer);
          } else {
            console.warn('Lagertyp stöds ej.');
          }
          printableLayers.push({
            type: layer.get('type'),
            baseURL: url,
            format: layer.getSource().getParams().FORMAT,
            layers: [layer.getSource().getParams().LAYERS],
            opacity: layer.get('opacity')
          });
        });
        break;
      }
      case 'WFS': {
        layers.forEach((layer) => {
          const projectionCode = viewer.getProjection().getCode();
          const styleName = layer.get('styleName');

          // Ändra på defaultvärden beroende på vad som finns i index.json (styleSettings);
          modifyDefaultStyles(viewer.getStyleSettings()[styleName]);

          const geojson = new GeoJSON();
          const source = layer.getSource();
          const features = source.getFeatures();

          features.forEach((feature) => {
            feature.setProperties({
              _gx_style: 0
            });
          });

          const data = geojson.writeFeatures(features, {
            featureProjection: projectionCode,
            dataProjection: projectionCode
          });
          printableLayers.push({
            type: 'vector',
            geoJson: JSON.parse(data),
            name: layer.get('name'),
            version: '1',
            styleProperty: '_gx_style',
            styles: {
              0: {
                fillColor,
                fillOpacity,
                strokeColor,
                strokeWidth,
                pointRadius,
                pointFillColor,
                externalGraphic,
                graphicOpacity,
                labelAlign,
                labelOutlineColor,
                labelOutlineWidth,
                fontSize,
                fontColor,
                fontBackColor
              }
            }
          });
        });
        break;
      }
      default:
    }

    return printableLayers;
  }

  // Builds mapfish-friendly object to from drawn features
  function drawToPrint(draw) {
    const styles = {
      draw: {
        fillColor: '#0099ff',
        fillOpacity: 0.1,
        strokeColor: '#0099ff',
        strokeWidth: 1.5
      },
      point: {
        externalGraphic: `${viewer.getUrl()}${PinStyle[0].icon.src}`,
        graphicWidth: 25,
        graphicHeight: 25
      }
    };
    const featuresWithStyle = draw.features.map((feature) => {
      const featureWithStyle = { ...feature };
      if (!featureWithStyle.properties) {
        featureWithStyle.properties = {};
      }
      featureWithStyle.properties.style = 'draw';

      if (featureWithStyle.geometry.type === 'Point') {
        featureWithStyle.properties.style = 'point';
      }

      if (featureWithStyle.properties.annonation) {
        featureWithStyle.properties.style = `draw-${featureWithStyle.properties.annonation}`;
        styles[`draw-${featureWithStyle.properties.annonation}`] = {
          fillOpacity: 0.0,
          strokeOpacity: 0.0,
          label: featureWithStyle.properties.annonation,
          fontColor: '#0099ff'
        };
      }
      return featureWithStyle;
    });
    const newDraw = { ...draw, features: featuresWithStyle };

    return {
      geoJson: newDraw,
      type: 'vector',
      styleProperty: 'style',
      styles
    };
  }

  function pinToPrint(pinFeature) {
    const pinGeoJson = new GeoJSON().writeFeaturesObject([pinFeature]);
    pinGeoJson.features[0].properties = { style: 'bluepin' };
    const pin = {
      geoJson: pinGeoJson,
      type: 'vector',
      styleProperty: 'style',
      styles: {
        bluepin: {
          externalGraphic: `${viewer.getUrl()}${pinFeature.getStyle().getImage().getSrc()}`,
          graphicWidth: 25,
          graphicHeight: 25
        }
      }
    };
    return pin;
  }

  function getLegendInfos(layers, scale) {
    const requests = [];
    const maxScaleDenomCompensatedScale = Number(scale) - 1;
    layers.forEach((layer) => {
      // ArcGIS WMS layers are exempt, for now, as not the same format:application/json
      if (Boolean(layer.get('type') === 'WMS') && !layer.get('ArcGIS') && !layer.get('grouplayer')) {
        let params;
        const url = fetchSourceUrl(layer);
        let requestUrl;

        if (!layer.get('sublayers')) { // manually handled theme layers
          params = {
            service: 'WMS',
            version: '1.1.0',
            request: 'GetLegendGraphic',
            layer: layer.get('name'),
            format: 'application/json',
            scale: maxScaleDenomCompensatedScale
          };
          requestUrl = `${url}?${Object.keys(params).map((key) => `${key}=${params[key]}`).join('&')}`;
          requests.push(new Promise((resolve, reject) => {
            try {
              fetch(requestUrl).then(response => response.json()).then(json => resolve({ data: json, layerName: layer.get('name') }));
            } catch (error) {
              console.error('Error while getting legend as json: ', error);
              reject(error);
            }
          }));
        }
      }
    });
    return requests;
  }

  // determine whether layer should be printed as a theme layer by its json legend
  function appendLegendInfos(layers, legendInfos) {
    const layersWithLegend = layers.map((layer) => {
      // manually handled layers will/should have sublayers at this point
      if (!layer.get('sublayers')) {
        legendInfos.forEach((info => {
          // layer might be invisible at this scale
          if (info.data.Legend != null) {
            if (info.data.Legend[0].layerName === layer.get('name') && info.data.Legend[0].rules.length > 1) {
              layer.set('print_theme', true);
              layer.set('sublayers', info.data.Legend[0].rules.map((ruleInfo) => ({ title: ruleInfo.title, rule: ruleInfo.name })));
            }
          }
        }));
      }
      return layer;
    });
    return layersWithLegend;
  }

  /*  Measure function from Measure control.
      Could not use it from measure control
      since it was "private" */
  function measureFeature(feature) {
    const geom = feature.getGeometry();
    const projection = viewer.getProjection();
    let output = '';
    if (geom instanceof Polygon) {
      const area = getArea(geom, {
        projection
      });
      if (area > 10000000) {
        output = `${Math.round((area / 1000000) * 100) / 100} km`;
      } else if (area > 10000) {
        output = `${Math.round((area / 10000) * 100) / 100} ha`;
      } else {
        output = `${Math.round(area * 100) / 100} m`;
      }
    }
    if (geom instanceof LineString) {
      const length = getLength(geom, {
        projection
      });
      if (length > 1000) {
        output = `${Math.round((length / 1000) * 100) / 100} km`;
      } else {
        output = `${Math.round(length * 100) / 100} m`;
      }
    }
    return output;
  }

  // Builds mapfish-friendly object from measure layer
  function measureToPrint(measure) {
    let geom;
    let coord;
    let coords;
    let labelAlign;
    let strokeOpacity;
    let fillOpacity;
    let xDirection;
    const features = measure[0].getSource().getFeatures();
    const styles = {
      measure: {
        fillColor: '#0099ff',
        fillOpacity: 0.1,
        strokeColor: '#0099ff',
        strokeWidth: 1.5
      }
    };

    features.forEach((feature, index) => {
      feature.set('style', 'measure');
      geom = feature.getGeometry();

      if (geom instanceof LineString) {
        coords = geom.getCoordinates();
        coord = coords.pop();
        // Align label depending on how the feature is drawn
        xDirection = coord[0] - coords.pop()[0];
        labelAlign = xDirection > 0 ? 'lt' : 'rt';
        strokeOpacity = 1.0;
        fillOpacity = 1.0;
      }
      if (geom instanceof Polygon) {
        coord = geom.getInteriorPoint().getCoordinates();
        labelAlign = 'cm';
        strokeOpacity = 0.0;
        fillOpacity = 0.0;
      }

      /* Add a point for every feature in measure,
                point is used to hold label and some
                indication on where measure ended */
      features.push(new Feature({
        geometry: new Point(coord),
        style: `measure-${index}`
      }));

      styles[`measure-${index}`] = {
        label: measureFeature(feature),
        fontColor: '#0099ff',
        pointRadius: 2,
        fillColor: '#0099ff',
        strokeColor: '#0099ff',
        strokeOpacity,
        fillOpacity,
        labelAlign
      };
    });

    return {
      geoJson: new GeoJSON().writeFeaturesObject(features),
      type: 'vector',
      styleProperty: 'style',
      styles
    };
  }

  function buildLegend(layers, scale) {
    const themeLayers = [];
    const maxScaleDenomCompensatedScale = Number(scale) - 1;
    const legendObjects = layers.reduce((result, layer) => {
      const type = layer.get('type') || '';
      let url; let
        name;
      switch (type.toUpperCase()) {
        case 'WMS':
          url = fetchSourceUrl(layer);
          name = layer.get('name');
          // special case for theme layers
          // whether ArcGIS Server WMS layers or not
          if (layer.get('print_theme') === true) {
            themeLayers.push({
              sublayers: layer.get('sublayers'),
              title: layer.get('title'),
              name: layer.get('name'),
              print_theme: layer.get('print_theme'),
              ArcGIS: layer.get('ArcGIS'),
              url
            });
          } else if (layer.get('grouplayer') === true) { // special case for grouped layers
            const sublayers = layer.get('sublayers');
            for (let i = 0; i < sublayers.length; i += 1) {
              // theme layers might be in grouped layers
              if (sublayers[i].print_theme === true) {
                if (!sublayers[i].url) sublayers[i].url = url;
                themeLayers.push(sublayers[i]);
              } else {
                const subName = sublayers[i].title;
                const rule = sublayers[i].rule;
                const style = sublayers[i].style;
                const layername = sublayers[i].name;
                result.push({
                  name: subName,
                  icons: [`${url}/?REQUEST=GetLegendGraphic&transparent=true&service=WMS&VERSION=1.0.0&FORMAT=image/png&LAYER=${layername}&STYLE=${style}&RULE=${rule}&SCALE=${maxScaleDenomCompensatedScale}&legend_options=dpi:400`]
                });
              }
            }
          } else { // normal case, single layer
            result.push({
              name: layer.get('title'),
              icons: [`${url}/?REQUEST=GetLegendGraphic&transparent=true&service=WMS&VERSION=1.0.0&FORMAT=image/png&LAYER=${name}&SCALE=${maxScaleDenomCompensatedScale}&legend_options=dpi:400`]
            });
          }
          break;
        case 'WFS':
          url = fetchSourceUrl(layer);
          name = layer.get('name');
          result.push({
            name: layer.get('title'),
            icons: [`${url}/?REQUEST=GetLegendGraphic&transparent=true&service=WMS&VERSION=1.0.0&FORMAT=image/png&LAYER=${name}&SCALE=${maxScaleDenomCompensatedScale}&legend_options=dpi:400`]
          });
          break;
        default:
      }
      return result;
    }, []);

    // handle the cases for themelayers and add to same array as the rest of the layers
    // handle after to make sure any single layers is added before every theme layer
    themeLayers.forEach((layer) => {
      const sublayers = layer.sublayers;
      const name = layer.name;
      // newline for some separation between theme layers
      legendObjects.push({
        name: `\n${layer.title}`
      });
      if (layer.print_theme === true && !layer.ArcGIS) {
        for (let i = 0; i < sublayers.length; i += 1) {
          const subName = sublayers[i].title;
          const rule = sublayers[i].rule;
          // handle if another style is specified
          const url = layer.style
            ? `${layer.url}/?REQUEST=GetLegendGraphic&transparent=true&service=WMS&VERSION=1.0.0&FORMAT=image/png&LAYER=${name}&STYLE=${layer.style}&RULE=${rule}&SCALE=${scale}&legend_options=dpi:400`
            : `${layer.url}/?REQUEST=GetLegendGraphic&transparent=true&service=WMS&VERSION=1.0.0&FORMAT=image/png&LAYER=${name}&RULE=${rule}&SCALE=${scale}&legend_options=dpi:400`;
          legendObjects.push({
            name: subName,
            icons: [url]
          });
        }
      } else if (layer.print_theme === true && Boolean(layer.ArcGIS)) {
        for (let i = 0; i < sublayers.length; i += 1) {
          const subName = sublayers[i].title;
          const subUrl = sublayers[i].url;
          legendObjects.push({
            name: subName,
            icons: [subUrl]
          });
        }
      }
    });

    return legendObjects;
  }

  // Since mapfish cannot seem to return an url which is not localhost
  function newUrl(url) {
    const basePart = MapfishCreateUrl.substr(0, MapfishCreateUrl.indexOf('/', 8));
    const mapfishPart = url.substr(url.indexOf('/', 8), url.length - 1);
    return basePart + mapfishPart;
  }

  function convertToMapfishOptions(printOptions) {
    const scale = parseInt(printOptions.scale.split(/[: ]/).pop(), 10);
    let layers = printOptions.layers;
    const mapfishOptions = {
      layout: printOptions.layout,
      srs: viewer.getProjection().getCode(),
      units: viewer.getProjection().getUnits(), // TODO: Kolla upp om detta stämmer
      outputFilename: 'kartutskrift',
      outputFormat: printOptions.outputFormat,
      mapTitle: printOptions.title,
      layers: [],
      pages: [{
        comment: '',
        mapTitle: printOptions.title,
        center: printOptions.center,
        scale: printOptions.scale,
        dpi: printOptions.dpi,
        geodetic: false
      }],
      legends: [{
        classes: [],
        name: ''
      }]
    };
    const promise = new Promise((resolve) => {
      // get name of background map
      const backgroundLayer = layers.filter((layer) => layer.get('group') === 'background')[0];

      // assemble object to be pushed to layers. backgroundLayer will always contain 1 element
      if (backgroundLayer) {
        let url;
        if (backgroundLayer.getSource() instanceof TileWMS) {
          url = fetchSourceUrl(backgroundLayer);
        } else if (backgroundLayer.getSource() instanceof ImageWMS) { // ----------------------------ol
          url = fetchSourceUrl(backgroundLayer);
        } else {
          console.warn('Bakgrundslager är av okänd bildtyp: ', backgroundLayer.getSource());
        }
        const backgroundLayerObject = {
          type: backgroundLayer.get('type'),
          baseURL: url,
          format: backgroundLayer.getSource().getParams().FORMAT,
          layers: [backgroundLayer.getSource().getParams().LAYERS]
        };
        mapfishOptions.layers.push(backgroundLayerObject);
      } else {
        // tom
      }

      // filter background map from remaining layers.
      layers = layers.filter((layer) => layer.get('group') !== 'background' && typeof layer.get('name') !== 'undefined');

      // Set existing print_theme and sublayers properties to false unless handled manually
      // ArcGIS WMS theme layers and grouplayers layers are handled manually
      layers.forEach((layer) => {
        if (Boolean(layer.get('print_theme')) && !layer.get('ArcGIS') && !layer.get('grouplayer')) {
          layer.set('print_theme', false);
          layer.set('sublayers', false);
        }
      });

      // return Object[] filtered by baseURL and/or type
      const wmsLayers = buildLayersObjects(layers.filter((layer) => typeof layer.get('name') !== 'undefined'), 'WMS');
      const wfsLayers = buildLayersObjects(layers.filter((layer) => typeof layer.get('name') !== 'undefined'), 'WFS');

      if (wmsLayers.length !== 0) {
        wmsLayers.forEach((layer) => {
          mapfishOptions.layers.push(layer);
        });
      }
      if (wfsLayers.length !== 0) {
        wfsLayers.forEach((layer) => {
          mapfishOptions.layers.push(layer);
        });
      }

      // Both pin, draw and measure are vector types, mapfish needs other properties for them
      // Current version is mapfish V2 and the styles are similar to OL2
      const measureLayer = layers.filter((layer) => layer.get('name') === 'measure');
      if (measureLayer.length > 0) mapfishOptions.layers.push(measureToPrint(measureLayer));

      const pin = viewer.getFeatureinfo().getPin();
      if (pin) mapfishOptions.layers.push(pinToPrint(pin));

      let draw = viewer.getControlByName('draw');
      if (draw) {
        draw = JSON.parse(draw.getState().features);
        if (draw.features.length > 0) mapfishOptions.layers.push(drawToPrint(draw));
      }

      // build legend objects and add to mapfishconfig
      const promises = getLegendInfos(layers, scale);
      Promise.all(promises).then(
        responses => responses.map((response) => response),
        error => { console.error('Error.', error); }
      ).then(
        legendInfos => {
          layers = appendLegendInfos(layers, legendInfos);
        },
        error => { console.error('Error.', error); }
      ).finally(() => {
        const legendArray = buildLegend(layers.filter((layer) => (layer.get('name').indexOf('_bk_') === -1 && layer.get('name') !== 'measure')), scale);

        legendArray.forEach((obj) => {
          if (obj) mapfishOptions.legends[0].classes.push(obj);
        });

        resolve(mapfishOptions);
      });
    });
    return promise;
  }

  function executeMapfishCall(url, data) {
    // disable the print button while printing in progress
    viewer.getControlByName('printmenu').getComponents()[3].setState('disabled');

    const body = JSON.stringify(data);
    document.getElementById('o-dl-link').style.display = 'none';
    let progress = document.getElementById('o-dl-progress');

    if (!progressElementMem) {
      progressElementMem = document.getElementById('o-dl-progress');
    } else {
      progress.parentNode.replaceChild(progressElementMem, progress);
      progress = document.getElementById('o-dl-progress');
    }
    progress.style.display = 'inline-block';

    const request = $.ajax({
      type: 'POST',
      url,
      data: body,
      contentType: 'application/json',
      dataType: 'json',
      success(obj) {
        printStatus = 'success';
        viewer.getControlByName('printmenu').getComponents()[3].setState('initial');
        const urlToOpen = newUrl(obj.getURL);
        progress.style.display = 'none';
        window.open(urlToOpen);
      },
      error(obj) {
        printStatus = 'failure';
        viewer.getControlByName('printmenu').getComponents()[3].setState('initial');
        progress.parentNode.replaceChild(failureSpan, progress);
        failureSpan.style.display = 'block';

        const response = obj.responseText;
        const layerIndex = response.toLowerCase().search('layer=');

        if (layerIndex !== -1) {
          const longerstring = response.substring(layerIndex);
          const shorterstring = longerstring.split('&')[0].substring(6);
          const failingLayerTitle = viewer.getLayer(shorterstring).get('title');
          failureReason.innerHTML = `${layerErrorMessage} ${failingLayerTitle}.`;
          failureSpan.appendChild(failureReason);
        } else {
          failureReason.innerHTML = `${otherErrorMessage}`;
          failureSpan.appendChild(failureReason);
        }
      }
    });
    printStatus = '';
    return request;
  }

  return Component({
    onAdd(evt) {
      viewer = evt.target;
    },
    printMap(settings) {
      const url = MapfishCreateUrl;
      const promise = new Promise((resolve) => {
        convertToMapfishOptions(settings).then((data) => {
          executeMapfishCall(url, data).then((resp) => {
            resolve(resp);
          });
        });
      });
      return promise;
    },
    getPrintStatus() { return printStatus; },
    onInit() {},
    render() {
      this.dispatch('render');
    }
  });
};

export default Mapfishprint;
