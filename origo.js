import { Feature as olFeature, Collection as olCollection, Overlay as olOverlay } from 'ol';
import * as olGeom from 'ol/geom';
import { fromCircle, fromExtent } from 'ol/geom/Polygon';
import * as olInteraction from 'ol/interaction';
import { createBox } from 'ol/interaction/Draw';
import * as olLayer from 'ol/layer';
import * as olSource from 'ol/source';
import * as olStyle from 'ol/style';
import * as olFormat from 'ol/format';
import polyfill from './src/utils/polyfill';
import * as ui from './src/ui';
import Viewer from './src/viewer';
import loadResources from './src/loadresources';
import titleCase from './src/utils/titlecase';
import * as origoControls from './src/controls';
import supports from './src/utils/supports';
import renderError from './src/utils/rendererror';
import Style from './src/style';
import featurelayer from './src/featurelayer';
import getFeatureInfo from './src/getfeatureinfo';
import getFeature from './src/getfeature';
import * as Utils from './src/utils';
import dropdown from './src/dropdown';
import { renderSvgIcon } from './src/utils/legendmaker';
import SelectedItem from './src/models/SelectedItem';
import 'core-js/stable';
import 'regenerator-runtime/runtime';

const Origo = function Origo(configPath, options = {}) {
  let viewer;
  const origoConfig = {
    controls: [],
    crossDomain: true,
    target: '#app-wrapper',
    svgSpritePath: 'css/svg/',
    svgSprites: ['fa-icons.svg', 'material-icons.svg', 'miscellaneous.svg', 'origo-icons.svg', 'custom.svg'],
    breakPoints: {
      xs: [240, 320],
      s: [320, 320],
      m: [500, 500],
      l: [768, 500]
    },
    breakPointsPrefix: 'o-media',
    defaultControls: [
      { name: 'scaleline' },
      { name: 'zoom' },
      { name: 'rotate' },
      { name: 'attribution' },
      { name: 'fullscreen' }
    ]
  };

  const isSupported = supports();
  const el = options.target || origoConfig.target;
  if (!isSupported) {
    renderError('browser', el);
    return null;
  }
  polyfill();

  const initControls = (controlDefs) => {
    const controls = [];
    controlDefs.forEach((def) => {
      if ('name' in def) {
        const controlName = titleCase(def.name);
        const controlOptions = def.options || {};
        if (controlName in origoControls) {
          const control = origoControls[controlName](controlOptions);
          controls.push(control);
        }
      }
    });
    return controls;
  };

  const api = () => viewer;
  const getConfig = () => origoConfig;

  return ui.Component({
    api,
    getConfig,
    onInit() {
      const defaultConfig = Object.assign({}, origoConfig, options);
      const request = loadResources(configPath, defaultConfig);
      if (request) {
        request.then((data) => {
          const viewerOptions = data.options;
          viewerOptions.controls = initControls(viewerOptions.controls);
          const target = viewerOptions.target;
          viewer = Viewer(target, viewerOptions);
          this.dispatch('load', viewer);
        });
      }
    }
  });
};

olInteraction.Draw.createBox = createBox;
olGeom.Polygon.fromCircle = fromCircle;
olGeom.Polygon.fromExtent = fromExtent;
Origo.controls = origoControls;
Origo.ui = ui;
Origo.Style = Style;
Origo.featurelayer = featurelayer;
Origo.getFeatureInfo = getFeatureInfo;
Origo.getFeature = getFeature;
Origo.ol = [];
Origo.ol.geom = olGeom;
Origo.ol.interaction = olInteraction;
Origo.ol.layer = olLayer;
Origo.ol.source = olSource;
Origo.ol.style = olStyle;
Origo.ol.Feature = olFeature;
Origo.ol.Collection = olCollection;
Origo.ol.Overlay = olOverlay;
Origo.ol.format = olFormat;
Origo.Utils = Utils;
Origo.dropdown = dropdown;
Origo.renderSvgIcon = renderSvgIcon;
Origo.SelectedItem = SelectedItem;

export default Origo;
