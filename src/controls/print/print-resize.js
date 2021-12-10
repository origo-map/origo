import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import { OSM } from 'ol/source';
import TileArcGISRest from 'ol/source/TileArcGISRest';
import Style from '../../style';
import { Component } from '../../ui';

export default function PrintResize(options = {}) {
  const {
    map,
    viewer,
    logoComponent,
    northArrowComponent,
    titleComponent,
    descriptionComponent,
    createdComponent
  } = options;

  let {
    resolution
  } = options;

  // Will become an issue if 150 dpi is no longer the "standard" dpi setting
  const multiplyByFactor = function multiplyByFactor(value) {
    return value * (resolution / 150);
  };

  const getCssRule = function getCssRule(selector) {
    const rules = document.styleSheets[0].cssRules;
    for (let i = 0; i < rules.length; i += 1) {
      if (rules[i].selectorText === selector) {
        return rules[i];
      }
    }
    return undefined;
  };

  const getSourceType = function getSourceType(layer) {
    const mapSource = viewer.getMapSource();
    const sourceName = layer.get('sourceName');
    const source = layer.getSource();

    if ((typeof mapSource[sourceName].type === 'string' && mapSource[sourceName].type === 'Geoserver') || source.getUrls()[0].includes('geoserver')) {
      return 'Geoserver';
    } else if ((typeof mapSource[sourceName].type === 'string' && mapSource[sourceName].type === 'QGIS') || source.getUrls()[0].includes('qgis')) {
      return 'QGIS';
    } else if ((typeof mapSource[sourceName].type === 'string' && mapSource[sourceName].type === 'ArcGIS') || source instanceof TileArcGISRest) {
      return 'ArcGIS';
    }
    return 'Unknown source type';
  };

  const resizeRules = function resizeRules() {
    const h4Rule = getCssRule('.o-ui h4, .o-ui .h4');
    if (h4Rule) {
      h4Rule.style.fontSize = `${multiplyByFactor(1.5)}rem`;
    }

    const paddingLeftRule = getCssRule('.o-ui .padding-left');
    if (paddingLeftRule) {
      paddingLeftRule.style.paddingLeft = `${multiplyByFactor(0.75)}rem`;
    }

    const paddingRightRule = getCssRule('.o-ui .padding-right');
    if (paddingRightRule) {
      paddingRightRule.style.paddingRight = `${multiplyByFactor(0.75)}rem`;
    }

    const paddingYRule = getCssRule('.o-ui .padding-y');
    if (paddingYRule) {
      paddingYRule.style.paddingBottom = `${multiplyByFactor(0.75)}rem`;
      paddingYRule.style.paddingTop = `${multiplyByFactor(0.75)}rem`;
    }

    const printMarginRule = getCssRule('.o-map .print-margin');
    if (printMarginRule) {
      printMarginRule.style.padding = `${multiplyByFactor(10)}mm ${multiplyByFactor(10) * 1.5}mm`;
    }

    const bottomLeftRule = getCssRule('.o-ui .bottom-left');
    if (bottomLeftRule) {
      bottomLeftRule.style.bottom = `${multiplyByFactor(1)}rem`;
      bottomLeftRule.style.left = `${multiplyByFactor(1)}rem`;
    }

    const bottomRightRule = getCssRule('.o-ui .bottom-right');
    if (bottomRightRule) {
      bottomRightRule.style.bottom = `${multiplyByFactor(1)}rem`;
      bottomRightRule.style.right = `${multiplyByFactor(1)}rem`;
    }

    const topRightRule = getCssRule('.o-ui .top-right');
    if (topRightRule) {
      topRightRule.style.top = `${multiplyByFactor(1)}rem`;
      topRightRule.style.right = `${multiplyByFactor(1)}rem`;
    }

    const paddingBottomSmall = getCssRule('.o-ui .padding-bottom-small');
    if (paddingBottomSmall) {
      paddingBottomSmall.style.paddingBottom = `${multiplyByFactor(0.5)}rem`;
    }
  };

  const resizeNorthArrow = function resizeNorthArrow(northArrowComponentId) {
    const el = document.getElementById(northArrowComponentId);
    if (el) {
      el.style.height = `${multiplyByFactor(5)}rem`;
      el.style.paddingRight = `${multiplyByFactor(0.5)}rem`;
    }
  };

  const resizeLogo = function resizeLogo(logoComponentId) {
    const logoEl = document.getElementById(logoComponentId);
    if (logoEl) {
      logoEl.style.height = `${multiplyByFactor(5)}rem`;
    }

    const attributionRule = getCssRule('.o-map .print-attribution');
    if (attributionRule) {
      attributionRule.style.fontSize = `${multiplyByFactor(0.625)}rem`;
      attributionRule.style.padding = `${multiplyByFactor(0.1875)}rem`;
    }
  };

  const resizeTitleComponent = function resizeTitleComponent(titleComponentId) {
    const el = document.getElementById(titleComponentId);
    if (el) {
      el.style.marginBottom = `${multiplyByFactor(0.5)}rem`;
    }
  };

  const resizeDescriptionComponent = function resizeDescriptionComponent(descriptionComponentId) {
    const el = document.getElementById(descriptionComponentId);
    if (el) {
      el.style.marginBottom = `${multiplyByFactor(0.5)}rem`;
    }
  };

  const resizeCreatedComponent = function resizeCreatedComponent(createdComponentId) {
    const el = document.getElementById(createdComponentId);
    if (el) {
      el.style.fontSize = `${multiplyByFactor(0.75)}rem`;
      el.style.lineHeight = `${multiplyByFactor(1.125)}rem`;
    }
  };

  // Scalebar is re-rendered so this function needs to wait until the rendering is complete
  const resizeScalebarElements = function resizeScalebarElements() {
    if (document.getElementsByClassName('ol-scale-bar-inner')[0]) {
      document.getElementsByClassName('ol-scale-bar-inner')[0].style.width = `${multiplyByFactor(118)}px`;
    }

    if (document.getElementsByClassName('ol-scale-text')[0]) {
      document.getElementsByClassName('ol-scale-text')[0].style.width = `${multiplyByFactor(118)}px`;
    }

    if (document.getElementsByClassName('ol-scale-step-marker')[0]) {
      document.getElementsByClassName('ol-scale-step-marker')[0].style.top = `${multiplyByFactor(0)}px`;
    }

    if (document.getElementsByClassName('ol-scale-step-marker')[1]) {
      document.getElementsByClassName('ol-scale-step-marker')[1].style.top = `${multiplyByFactor(-10)}px`;
    }

    if (document.getElementsByClassName('ol-scale-step-marker')[2]) {
      document.getElementsByClassName('ol-scale-step-marker')[2].style.top = `${multiplyByFactor(-10)}px`;
    }

    if (document.getElementsByClassName('ol-scale-step-text')[0]) {
      document.getElementsByClassName('ol-scale-step-text')[0].style.marginLeft = `${multiplyByFactor(-3)}px`;
    }
  };

  const resizeScalebarRules = function resizeScalebarRules() {
    const scaleTextRule = getCssRule('.o-map .ol-scale-text');
    if (scaleTextRule) {
      scaleTextRule.style.bottom = `${multiplyByFactor(25)}px`;
      scaleTextRule.style.fontSize = `${multiplyByFactor(14)}px`;
    }

    const scaleStepMarkerRule = getCssRule('.o-map .ol-scale-step-marker');
    if (scaleStepMarkerRule) {
      scaleStepMarkerRule.style.height = `${multiplyByFactor(15)}px`;
      scaleStepMarkerRule.style.width = `${multiplyByFactor(1)}px`;
    }

    const scaleSinglebarRule = getCssRule('.o-map .ol-scale-singlebar');
    if (scaleSinglebarRule) {
      scaleSinglebarRule.style.height = `${multiplyByFactor(10)}px`;
      scaleSinglebarRule.style.borderWidth = `${multiplyByFactor(1)}px`;
    }

    const scaleStepTextRule = getCssRule('.o-map .ol-scale-step-text');
    if (scaleStepTextRule) {
      scaleStepTextRule.style.bottom = `${multiplyByFactor(-5)}px`;
      scaleStepTextRule.style.fontSize = `${multiplyByFactor(12)}px`;
    }
  };

  const updateLayers = function updateLayers() {
    const visibleLayers = map.getLayers().getArray().filter(layer => layer.getVisible());

    visibleLayers.forEach(layer => {
      if (layer instanceof VectorLayer) {
        const styleName = layer.get('styleName');
        if (styleName) {
          const newStyle = Style.createStyle({
            style: styleName,
            viewer
          })();
          const styleScale = multiplyByFactor(1.5);
          newStyle.forEach(style => {
            const image = style.getImage();
            if (image) {
              image.setScale(styleScale);
            }
          });
          layer.getSource().getFeatures().forEach(feature => {
            feature.setStyle(newStyle);
          });
        }
      }

      if (layer instanceof TileLayer && !(layer.getSource() instanceof OSM)) {
        const params = layer.getSource().getParams();

        if (getSourceType(layer, viewer) === 'Geoserver') {
          params.format_options = `dpi:${resolution}`;
        } else if (getSourceType(layer, viewer) === 'QGIS' || getSourceType(layer, viewer) === 'ArcGIS') {
          params.DPI = `${resolution}`;
        }
      }
    });
  };

  const resetLayers = function resetLayers() {
    const visibleLayers = map.getLayers().getArray().filter(layer => layer.getVisible());

    visibleLayers.forEach(layer => {
      if (layer instanceof VectorLayer) {
        layer.getSource().getFeatures().forEach(feature => {
          // Remove styles instead?
          feature.getStyle().forEach(style => {
            const image = style.getImage();
            if (image) {
              image.setScale(1);
            }
          });
        });
      }

      if (layer instanceof TileLayer && !(layer.getSource() instanceof OSM)) {
        const params = layer.getSource().getParams();

        if (getSourceType(layer, viewer) === 'Geoserver' && params.format_options) {
          delete params.format_options;
        } else if ((getSourceType(layer, viewer) === 'QGIS' || getSourceType(layer, viewer) === 'ArcGIS') && params.DPI) {
          delete params.DPI;
        }
      }
    });
  };

  return Component({
    onInit() {
      // Since the ScaleLine re-renders we need to wait for it to be done before changing inline styles of elements
      map.on('rendercomplete', () => {
        resizeScalebarElements();
      });
    },
    updateLayers,
    resetLayers,
    setResolution(newResolution) {
      resolution = newResolution;
      resizeRules();
      resizeNorthArrow(northArrowComponent.getId());
      resizeLogo(logoComponent.getId());
      resizeTitleComponent(titleComponent.getId());
      resizeDescriptionComponent(descriptionComponent.getId());
      resizeCreatedComponent(createdComponent.getId());
      resizeScalebarRules();
    }
  });
}
