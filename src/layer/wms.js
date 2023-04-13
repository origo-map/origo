import TileWMSSource from 'ol/source/TileWMS';
import ImageWMSSource from 'ol/source/ImageWMS';
import tile from './tile';
import maputils from '../maputils';
import image from './image';

function createTileSource(options) {
  const sourceOptions = {
    attributions: options.attribution,
    url: options.url,
    gutter: options.gutter,
    crossOrigin: options.crossOrigin,
    projection: options.projection,
    tileGrid: options.tileGrid,
    params: {
      LAYERS: options.id,
      TILED: true,
      VERSION: options.version,
      FORMAT: options.format,
      STYLES: options.style
    }
  };
  if (options.params) {
    Object.keys(options.params).forEach((element) => {
      sourceOptions.params[element] = options.params[element];
    });
  }
  return new TileWMSSource((sourceOptions));
}

function createImageSource(options) {
  const sourceOptions = {
    attributions: options.attribution,
    url: options.url,
    crossOrigin: 'anonymous',
    projection: options.projection,
    params: {
      LAYERS: options.id,
      VERSION: options.version,
      FORMAT: options.format,
      STYLES: options.style
    }
  };
  if (options.params) {
    Object.keys(options.params).forEach((element) => {
      sourceOptions.params[element] = options.params[element];
    });
  }
  return new ImageWMSSource((sourceOptions));
}

function createWmsStyle({ wmsOptions, source, viewer, initialStyle = false }) {
  let maxResolution = viewer.getResolutions()[viewer.getResolutions().length - 1];
  let newStyle;

  if (initialStyle) {
    if (wmsOptions.stylePicker) {
      newStyle = wmsOptions.stylePicker.find(style => style.initialStyle);
    } else {
      newStyle = {
        defaultWMSServerStyle: true,
        hasThemeLegend: wmsOptions.hasThemeLegend || false,
        legendParams: wmsOptions.legendParams || false
      };
    }
  } else {
    newStyle = wmsOptions.stylePicker[wmsOptions.altStyleIndex];
  }

  const legendParams = wmsOptions.stylePicker ? newStyle.legendParams : wmsOptions.legendParams;

  if ((legendParams) && (Object.keys(legendParams).find(key => key.toUpperCase() === 'SCALE'))) {
    maxResolution = undefined;
  }

  let getLegendString;
  let styleName;

  if (newStyle.defaultWMSServerStyle) {
    getLegendString = source.getLegendUrl(maxResolution, legendParams);
    styleName = `${wmsOptions.name}_WMSServerDefault`;
  } else {
    getLegendString = source.getLegendUrl(maxResolution, {
      STYLE: newStyle.style,
      ...legendParams
    });
    styleName = newStyle.style;
  }

  const hasThemeLegend = newStyle.hasThemeLegend || false;
  const style = [[{
    icon: {
      src: `${getLegendString}`
    },
    extendedLegend: hasThemeLegend
  }]];
  viewer.addStyle(styleName, style);
  return styleName;
}

function createWmsLayer(wmsOptions, source, viewer) {
  const wmsOpts = wmsOptions;
  const wmsSource = source;

  function setInitialStyle() {
    if (!(wmsOpts.stylePicker.some(style => style.initialStyle === true))) {
      wmsOpts.stylePicker[0].initialStyle = true;
    }
  }

  if (wmsOptions.stylePicker) {
    setInitialStyle();
    let pickedStyle;
    if (wmsOptions.altStyleIndex > -1) {
      wmsOpts.defaultStyle = createWmsStyle({ wmsOptions, source, viewer, initialStyle: true });
      wmsOpts.styleName = createWmsStyle({ wmsOptions, source, viewer });
      wmsOpts.style = wmsOptions.styleName;
      pickedStyle = wmsOptions.stylePicker[wmsOptions.altStyleIndex];
    } else {
      wmsOpts.styleName = createWmsStyle({ wmsOptions, source, viewer, initialStyle: true });
      wmsOpts.defaultStyle = wmsOpts.styleName;
      wmsOpts.style = wmsOptions.styleName;
      pickedStyle = wmsOpts.stylePicker.find(style => style.initialStyle === true);
    }
    if (!(pickedStyle.defaultWMSServerStyle)) {
      wmsSource.getParams().STYLES = wmsOptions.styleName;
    }
  } else if (wmsOpts.styleName === 'default') {
    wmsOpts.styleName = createWmsStyle({ wmsOptions, source, viewer, initialStyle: true });
    wmsOpts.style = wmsOptions.styleName;
  }
}

const wms = function wms(layerOptions, viewer) {
  const wmsDefault = {
    featureinfoLayer: null
  };
  const sourceDefault = {
    crossOrigin: 'anonymous',
    version: '1.1.1',
    gutter: 0,
    format: 'image/png'
  };
  const wmsOptions = Object.assign(wmsDefault, layerOptions);
  const renderMode = wmsOptions.renderMode || 'tile';
  wmsOptions.name.split(':').pop();
  const sourceOptions = Object.assign(sourceDefault, viewer.getMapSource()[layerOptions.source]);
  sourceOptions.attribution = wmsOptions.attribution;
  sourceOptions.crossOrigin = wmsOptions.crossOrigin ? wmsOptions.crossOrigin : sourceOptions.crossOrigin;
  sourceOptions.projection = viewer.getProjection();
  sourceOptions.id = wmsOptions.id;
  sourceOptions.filter = wmsOptions.filter;
  sourceOptions.filterType = wmsOptions.filterType;
  sourceOptions.params = wmsOptions.sourceParams;
  sourceOptions.format = wmsOptions.format ? wmsOptions.format : sourceOptions.format;
  if (!wmsOptions.stylePicker) {
    const styleSettings = viewer.getStyle(wmsOptions.styleName);
    const wmsStyleObject = styleSettings ? styleSettings[0].find(s => s.wmsStyle) : undefined;
    sourceOptions.style = wmsStyleObject ? wmsStyleObject.wmsStyle : '';
  }

  if (wmsOptions.tileGrid) {
    sourceOptions.tileGrid = maputils.tileGrid(wmsOptions.tileGrid);
  } else if (sourceOptions.tileGrid) {
    sourceOptions.tileGrid = maputils.tileGrid(sourceOptions.tileGrid);
  } else {
    sourceOptions.tileGrid = viewer.getTileGrid();

    if (wmsOptions.extent) {
      // FIXME: there is no "extent" property to set. Code has no effect. Probably must create a new grid from viewer.getTileGridSettings .
      sourceOptions.tileGrid.extent = wmsOptions.extent;
    }
  }

  if (renderMode === 'image') {
    const source = createImageSource(sourceOptions);
    createWmsLayer(wmsOptions, source, viewer);
    return image(wmsOptions, source);
  }

  const source = createTileSource(sourceOptions);
  createWmsLayer(wmsOptions, source, viewer);
  return tile(wmsOptions, source);
};

export default wms;
