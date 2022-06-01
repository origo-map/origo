import LayerGroup from 'ol/layer/Group';
import ImageLayer from 'ol/layer/Image';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorImageLayer from 'ol/layer/VectorImage';
import { OSM, WMTS, XYZ, ImageWMS, ImageArcGISRest, Cluster } from 'ol/source';
import TileArcGISRest from 'ol/source/TileArcGISRest';
import Layer from '../../layer';
import agsMap from '../../layer/agsmap';
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
    createdComponent,
    closeButton
  } = options;

  let {
    resolution
  } = options;

  let isActive = false;
  let layersWithChangedSource = [];
  let layersOriginalStyles = [];

  // Will become an issue if 150 dpi is no longer the "standard" dpi setting
  const multiplyByFactor = function multiplyByFactor(value) {
    return value * (resolution / 150);
  };

  const isValidSource = function isValidSource(source) {
    return (!(source instanceof OSM) && !(source instanceof XYZ) && !(source instanceof WMTS));
  };

  const isVector = function isVector(layer) {
    return layer instanceof VectorLayer || layer instanceof VectorImageLayer;
  };

  const isImage = function isImage(layer) {
    return layer instanceof TileLayer || layer instanceof ImageLayer;
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

  const getVisibleLayers = function getVisibleLayers() {
    const layers = [];
    map.getLayers().getArray().filter(layer => layer.getVisible()).forEach(layer => {
      if (layer instanceof LayerGroup) {
        const layersGroup = layer.getLayers().getArray();
        layersGroup.forEach(layerInGroup => {
          layers.push(layerInGroup);
        });
      } else {
        layers.push(layer);
      }
    });
    return layers;
  };

  const getSourceType = function getSourceType(layer) {
    const mapSource = viewer.getMapSource();
    const sourceName = layer.get('sourceName');
    const source = layer.getSource();
    const url = source instanceof ImageWMS || source instanceof ImageArcGISRest ? source.getUrl() : source.getUrls()[0];

    if ((typeof mapSource[sourceName].type === 'string' && mapSource[sourceName].type === 'Geoserver') || url.includes('geoserver')) {
      return 'Geoserver';
    } else if ((typeof mapSource[sourceName].type === 'string' && mapSource[sourceName].type === 'QGIS') || url.includes('qgis')) {
      return 'QGIS';
    } else if ((typeof mapSource[sourceName].type === 'string' && mapSource[sourceName].type === 'ArcGIS') || source instanceof TileArcGISRest || source instanceof ImageArcGISRest || layer.getProperties().type === 'AGS_MAP') {
      return 'ArcGIS';
    }
    return 'Unknown source type';
  };

  // Resize CSS Rules to compensate for changing resolution
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

    const paddingExtraSmall = getCssRule('.o-ui .padding-x-small');
    if (paddingExtraSmall) {
      paddingExtraSmall.style.paddingLeft = `${multiplyByFactor(0.5)}rem`;
      paddingExtraSmall.style.paddingBottom = `${multiplyByFactor(0.5)}rem`;
      paddingExtraSmall.style.paddingRight = `${multiplyByFactor(0.5)}rem`;
    }

    const controlRule = getCssRule('.o-ui .control');
    if (controlRule) {
      controlRule.style.borderRadius = `${multiplyByFactor(0.5)}rem`;
      controlRule.style.boxShadow = `0 ${multiplyByFactor(4)}px ${multiplyByFactor(6)}px 0 rgb(0 0 0 / 20%)`;
    }
  };

  // Resize north arrow, top right of the map
  const resizeNorthArrow = function resizeNorthArrow(northArrowComponentId) {
    const el = document.getElementById(northArrowComponentId);
    if (el) {
      el.style.height = `${multiplyByFactor(5)}rem`;
      el.style.paddingRight = `${multiplyByFactor(0.5)}rem`;
    }
  };

  // Resize Origo logo and print attribution, bottom left of the map
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

    const attributionLinkRule = getCssRule('.o-map .print-attribution a');
    if (attributionLinkRule) {
      attributionLinkRule.style.fontSize = `${multiplyByFactor(0.625)}rem`;
    }
  };

  // Resize the title component, displaying a textfield at the top of the map
  const resizeTitleComponent = function resizeTitleComponent(titleComponentId) {
    const el = document.getElementById(titleComponentId);
    if (el) {
      el.style.marginBottom = `${multiplyByFactor(0.5)}rem`;
    }
  };

  // Resize the description component, displaying a textfield at the bottom of the map
  const resizeDescriptionComponent = function resizeDescriptionComponent(descriptionComponentId) {
    const el = document.getElementById(descriptionComponentId);
    if (el) {
      el.style.marginBottom = `${multiplyByFactor(0.5)}rem`;
    }
  };

  // Resizes the created component, displaying timestamp at the bottom of the map
  const resizeCreatedComponent = function resizeCreatedComponent(createdComponentId) {
    const el = document.getElementById(createdComponentId);
    if (el) {
      el.style.fontSize = `${multiplyByFactor(0.75)}rem`;
      el.style.lineHeight = `${multiplyByFactor(1.125)}rem`;
    }
  };

  // Sets static top-right style to compensate for the CSS Rule '.o-ui .top-right' changing
  const resizeCloseButton = function resizeCloseButton(closeButtonId) {
    const el = document.getElementById(closeButtonId);
    if (el) {
      el.style.top = '1rem';
      el.style.right = '1rem';
    }
  };

  // Scalebar is re-rendered so this function needs to wait until the rendering is complete
  const resizeScalebarElements = function resizeScalebarElements() {
    const scaleBarInner = document.getElementsByClassName('ol-scale-bar-inner')[0];
    if (scaleBarInner) {
      scaleBarInner.style.width = `${multiplyByFactor(scaleBarInner.style.width)}px`;
    }

    const scaleText = document.getElementsByClassName('ol-scale-text')[0];
    if (scaleText) {
      scaleText.style.width = `${multiplyByFactor(scaleText.style.width)}px`;
    }

    const firstScaleStepMarker = document.getElementsByClassName('ol-scale-step-marker')[0];
    if (firstScaleStepMarker) {
      firstScaleStepMarker.style.top = `${multiplyByFactor(0)}px`;
    }

    const secondScaleStepMarker = document.getElementsByClassName('ol-scale-step-marker')[1];
    if (secondScaleStepMarker) {
      secondScaleStepMarker.style.top = `${multiplyByFactor(-10)}px`;
    }

    const thirdScaleStepMarker = document.getElementsByClassName('ol-scale-step-marker')[2];
    if (thirdScaleStepMarker) {
      thirdScaleStepMarker.style.top = `${multiplyByFactor(-10)}px`;
    }

    const scaleStepText = document.getElementsByClassName('ol-scale-step-text')[0];
    if (scaleStepText) {
      scaleStepText.style.marginLeft = `${multiplyByFactor(-3)}px`;
    }
  };

  // Resize CSS Rules for Scalebar
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

  // Resizes the legend, changing fontsize and icon width and height
  const resizeLegendComponent = function resizeLegendComponent() {
    const el = document.querySelector('#legendContainer');
    if (el) {
      el.style.fontSize = `${multiplyByFactor(1)}rem`;
      if (el.parentElement) {
        el.parentElement.style.left = `${multiplyByFactor(1)}rem`;
        el.parentElement.style.top = `${multiplyByFactor(1)}rem`;
        el.parentElement.style.minWidth = `${multiplyByFactor(220)}px`;
      }

      const itemRule = getCssRule('.o-ui .list > li, .o-ui .list > .item');
      if (itemRule) {
        itemRule.style.paddingBottom = `${multiplyByFactor(0.25)}rem`;
        itemRule.style.paddingTop = `${multiplyByFactor(0.25)}rem`;
      }

      const lastChildRule = getCssRule('.o-ui .list > li:last-child, .o-ui .list > .item:last-child');
      if (lastChildRule) {
        lastChildRule.style.paddingBottom = `${multiplyByFactor(0.5)}rem`;
      }

      const firstChildRule = getCssRule('.o-ui .list > li:first-child, .o-ui .list > .item:first-child');
      if (firstChildRule) {
        firstChildRule.style.paddingTop = `${multiplyByFactor(0.5)}rem`;
      }

      const icons = document.getElementsByClassName('legend-icon');
      if (icons.length > 0) {
        Array.from(icons).forEach(icon => {
          const style = icon.style;
          style.width = `${multiplyByFactor(1.5)}rem`;
          style.height = `${multiplyByFactor(1.5)}rem`;
        });
      }
    }
  };

  const changeWfsThemeLayer = function changeWfsThemeLayer(layer, styleName, styles) {
    const layerOption = viewer.getViewerOptions().layers.find(option => option.style && option.style === styleName);
    const newStyles = [...styles];
    if (layerOption) {
      const layerName = layer.get('name');
      if (!(layersOriginalStyles.some(layerInArr => layerInArr.layerName === layerName))) {
        layersOriginalStyles.push({
          layerName,
          styleName,
          styles: JSON.parse(JSON.stringify(newStyles))
        });
      }

      const originalStyle = layersOriginalStyles.find(item => item.layerName === layerName);
      if (originalStyle) {
        originalStyle.styles.forEach((style, index) => {
          if (style[0].stroke) {
            newStyles[index][0].stroke.width = multiplyByFactor(style[0].stroke.width || 1);
          }
        });

        viewer.setStyle(styleName, newStyles);
        const newLayer = Layer(layerOption, viewer);
        layer.setStyle(newLayer.getStyle());
      }
    }
  };

  const resetWfsThemeLayers = function resetWfsThemeLayers() {
    layersOriginalStyles.forEach(item => {
      const currentLayer = map.getLayers().getArray().find(layer => layer.get('name') === item.layerName && layer.get('type') === 'WFS');
      if (currentLayer) {
        const layerOption = viewer.getViewerOptions().layers.find(option => option.style && option.style === item.styleName);
        if (layerOption) {
          viewer.setStyle(item.styleName, item.styles);
          const newLayer = Layer(layerOption, viewer);
          currentLayer.setStyle(newLayer.getStyle());
        }
      }
    });
  };

  // Alters layer in map, if vector then set scale for feature, if image set DPI parameter for source
  const setLayerScale = function setLayerScale(layer) {
    const source = layer.getSource();

    if (isVector(layer)) {
      const styleName = layer.get('styleName');
      const styles = viewer.getStyle(styleName);

      if (styles && styles.length > 1) {
        changeWfsThemeLayer(layer, styleName, styles);
      } else if (styleName && styles && styles.length === 1) {
        const newStyle = Style.createStyle({
          style: styleName,
          viewer
        })();
        if (newStyle) {
          const styleScale = multiplyByFactor(1.5);
          newStyle.forEach(style => {
            const image = style.getImage();
            if (image) {
              const imageScale = image.getScale() ? multiplyByFactor(image.getScale()) : styleScale;
              image.setScale(imageScale);
            }

            const stroke = style.getStroke();
            if (stroke) {
              const strokeWidth = stroke.getWidth() ? multiplyByFactor(stroke.getWidth()) : styleScale;
              stroke.setWidth(strokeWidth);
            }

            const text = style.getText();
            if (text) {
              const textScale = text.getScale() ? multiplyByFactor(text.getScale()) : styleScale;
              text.setScale(textScale);
            }
          });
          layer.setStyle(newStyle);
        }
      }
    }

    if (isImage(layer) && isValidSource(source)) {
      const params = source.getParams();
      if (getSourceType(layer) === 'Geoserver') {
        params.format_options = `dpi:${resolution}`;
      } else if (getSourceType(layer) === 'QGIS' || getSourceType(layer) === 'ArcGIS') {
        params.DPI = `${resolution}`;
        if (layersWithChangedSource.includes(layer.get('name')) && source instanceof ImageWMS && params.SIZE[0] > 0 && params.SIZE[1] > 0) {
          params.SIZE = `${multiplyByFactor(params.SIZE[0])},${multiplyByFactor(params.SIZE[1])}`;
        }
        source.refresh();
      }
    }
  };

  // "Resets" layer by removing DPI parameter
  const resetLayerScale = function resetLayerScale(layer) {
    const source = layer.getSource();

    if (isImage(layer) && isValidSource(source)) {
      const params = source.getParams();

      if (getSourceType(layer) === 'Geoserver' && params.format_options) {
        delete params.format_options;
      } else if ((getSourceType(layer) === 'QGIS' || getSourceType(layer) === 'ArcGIS') && params.DPI) {
        // Creates ImageArcGISRest source and sets it as layer source, removing ImageWMS as source.
        // This can be removed once OpenLayers has support for DPI parameter on ImageArcGISRest.
        if (layer.getProperties().type === 'AGS_MAP' && source instanceof ImageWMS) {
          const props = layer.getProperties();
          props.source = props.sourceName;
          const agsmap = agsMap(props, viewer);
          layer.setProperties({ source: agsmap.getSource() });
        } else {
          delete params.DPI;
        }
        source.refresh();
      }
    }
  };

  // Alters all visible layers, for when entering print preview or changing DPI
  const updateLayers = function updateLayers() {
    getVisibleLayers().forEach(layer => {
      setLayerScale(layer);
    });
  };

  // "Resets" all visible layers, for when exiting print preview
  const resetLayers = function resetLayers() {
    getVisibleLayers().forEach(layer => {
      resetLayerScale(layer);
    });
  };

  // Sets new distance for cluster to compensate for DPI changes
  const setClusterDistance = function setClusterDistance(layer) {
    const source = layer.getSource();
    const properties = source.getProperties();

    if (properties && properties.clusterDistance) {
      source.setDistance(multiplyByFactor(properties.clusterDistance));
    }
  };

  // Update each feature in cluster with a re-scaled size
  // ISSUE: Currently this causes map to render, being part of the 'rendercomplete' listener
  //        it causes an infinite loop. Also I have yet to find an effecient way of updating the
  //        the cluster styles and setting the styles to the features.
  // eslint-disable-next-line no-unused-vars
  const updateClusterFeatures = function updateClusterFeatures(layer) {
    const source = layer.getSource();
    const clusterStyleName = layer.getProperties().clusterStyle;
    const styleName = layer.get('styleName');

    if (styleName && clusterStyleName) {
      const clusterStyleSettings = viewer.getStyle(clusterStyleName);
      const clusterStyleList = Style.createStyleList(clusterStyleSettings);

      if (clusterStyleList) {
        const styleScale = multiplyByFactor(0.5);

        clusterStyleList.forEach(styleList => {
          styleList.forEach(style => {
            const image = style.getImage();

            if (image) {
              source.getFeatures().forEach(feature => {
                image.setScale(styleScale);
                feature.setStyle(styleList);
              });
            }
          });
        });
      }
    }
  };

  const changeSourceToImageWMS = function chagneSourceToImageWMS(layer, size) {
    const source = layer.getSource();
    const props = layer.getProperties();
    const projection = source.getProjection();
    const code = projection.getCode().split(':')[1];

    const newSource = new ImageWMS(({
      url: `${source.getUrl()}/export?`,
      crossOrigin: 'anonymous',
      projection,
      ratio: 1,
      params: {
        F: 'image',
        TRANSPARENT: true,
        layers: `show:${props.id}`,
        FORMAT: 'PNG32',
        BBOXSR: code,
        IMAGESR: code,
        SIZE: `${multiplyByFactor(size[0])},${multiplyByFactor(size[1])}`,
        // No other way to access ImageWrapper and its extent
        // eslint-disable-next-line no-underscore-dangle
        BBOX: source.image_.extent,
        DPI: resolution
      }
    }));
    layer.setProperties({ source: newSource });
  };

  const updateLayerWithChangedSource = function updateLayerWithChangedSource(layer, size) {
    const source = layer.getSource();
    const params = source.getParams();

    if (params.SIZE !== size.join()) {
      params.SIZE = `${size[0]},${size[1]}`;
      source.refresh();
    }
  };

  return Component({
    onInit() {
      // Since the ScaleLine re-renders we need to wait for it to be done before changing inline styles of elements
      map.on('rendercomplete', () => {
        resizeScalebarElements();
        const size = map.getSize();

        if (size[0] > 0 && size[1] > 0) {
          getVisibleLayers().forEach(layer => {
            const source = layer.getSource();
            if (isActive) {
              if (layer.getProperties().type === 'AGS_MAP' && source instanceof ImageArcGISRest) {
                changeSourceToImageWMS(layer, size);
                layersWithChangedSource.push(layer.get('name'));
              } else if (isVector(layer) && source instanceof Cluster) {
                setClusterDistance(layer);
                // updateClusterFeatures(layer);
              } else if (layersWithChangedSource.includes(layer.get('name')) && source instanceof ImageWMS) {
                updateLayerWithChangedSource(layer, size);
              }
            }
          });
        }
      });
    },
    updateLayers() {
      updateLayers();
      isActive = true;
    },
    resetLayers() {
      resolution = 150;
      updateLayers();
      resetLayers();
      resetWfsThemeLayers();
      isActive = false;
      layersWithChangedSource = [];
      layersOriginalStyles = [];
    },
    setResolution(newResolution) {
      resolution = newResolution;
      resizeRules();
      resizeNorthArrow(northArrowComponent.getId());
      resizeLogo(logoComponent.getId());
      resizeTitleComponent(titleComponent.getId());
      resizeDescriptionComponent(descriptionComponent.getId());
      resizeCreatedComponent(createdComponent.getId());
      resizeCloseButton(closeButton.getId());
      resizeLegendComponent();
      resizeScalebarRules();
    }
  });
}
