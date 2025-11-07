import { Feature as olFeature, Collection as olCollection, Overlay as olOverlay } from 'ol';
import * as olGeom from 'ol/geom';
import { fromCircle, fromExtent } from 'ol/geom/Polygon';
import * as olInteraction from 'ol/interaction';
import { createBox } from 'ol/interaction/Draw';
import * as olLayer from 'ol/layer';
import * as olSource from 'ol/source';
import * as olStyle from 'ol/style';
import * as olFormat from 'ol/format';
import * as ui from './src/ui';
import Viewer from './src/viewer';
import loadResources from './src/loadresources';
import titleCase from './src/utils/titlecase';
import * as origoControls from './src/controls';
import * as origoExtensions from './src/extensions';
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
import 'elm-pep';
import 'pepjs';
import 'drag-drop-touch';
import permalink from './src/permalink/permalink';
import * as Loader from './src/loading';
import Spinner from './src/utils/spinner';
import layerType from './src/layer/layertype';

const Origo = function Origo(configPath, options = {}) {
  /** Reference to the returned Component */
  let origo;
  let viewer;
  const origoConfig = {
    controls: [],
    featureinfoOptions: {},
    crossDomain: true,
    target: '#app-wrapper',
    keyboardEventTarget: document,
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
      { name: 'localization' },
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

  const initControls = async (controlDefs) => {
    const locControlDefs = controlDefs.shift(); // Localization is first of the defaultControls;

    if (!(locControlDefs.options)) {
      locControlDefs.options = {
        localeId: 'sv-SE'
      };
    }

    // a potential loc query param for Localization needs to be set
    const localizationComponent = origoControls.Localization(locControlDefs.options);
    localizationComponent.options = locControlDefs.options;

    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('loc')) {
      const localization = searchParams.get('loc');
      localizationComponent.setLocale(localization);
    }

    const restControls = await Promise.all(
      controlDefs
        .filter((def) => 'name' in def)
        .map(async (def) => {
          // support both built-in and user-supplied (which might be lazy-loaded) controls
          const controlFactory = origoControls[titleCase(def.name)] ?? options.controls[def.name];
          if (!controlFactory) {
            throw new Error(`Unknown control '${def.name}'`);
          }

          const controlOptions = { ...def.options, localization: localizationComponent };
          // controlFactory can be either a function to create a control (built-in and non-lazy loaded) or a function
          // to create a Promise that loads the function that creates the control
          const controlOrLazyLoadedFactory = await controlFactory(controlOptions);
          const control = typeof controlOrLazyLoadedFactory === 'function' ? controlOrLazyLoadedFactory(controlOptions) : controlOrLazyLoadedFactory;
          control.options = { ...control.options, ...controlOptions };
          return control;
        })
    );
    return [localizationComponent, ...restControls];
  };

  const initExtensions = (extensionDefs) => {
    const extensions = [];
    extensionDefs.forEach((def) => {
      if ('name' in def) {
        const extensionName = titleCase(def.name);
        const extensionOptions = def.options || {};
        if (extensionName in origoExtensions) {
          const extension = origoExtensions[extensionName](extensionOptions);
          extensions.push(extension);
        }
      }
    });
    return extensions;
  };

  const api = () => viewer;
  const getConfig = () => origoConfig;

  api.controls = () => origoControls;
  api.extensions = () => origoExtensions;

  /** Helper that initialises a new viewer  */
  const initViewer = () => {
    // Merge default config with user-provided options
    const defaultConfig = Object.assign({}, origoConfig, options);

    // Load configuration (supports both external JSON and inline)
    loadResources(configPath, defaultConfig)
      .then((data) => {
        const viewerOptions = data.options;

        // Initialize controls (zoom, scale, etc.)
        viewerOptions.controls = initControls(viewerOptions.controls);

        // Initialize extensions (plugins)
        viewerOptions.extensions = initExtensions(viewerOptions.extensions || []);

        const target = viewerOptions.target;
        viewer = Viewer(target, viewerOptions);

        // Wait for the map to be fully loaded (layers, controls, etc.)
        viewer.on('loaded', () => {
          // Check URL for ?mapStateId= parameter
          const urlParams = new URLSearchParams(window.location.search);
          const mapStateId = urlParams.get('mapStateId');

          if (mapStateId) {
            // Fetch and parse the saved map state from server
            permalink.readStateFromServer(mapStateId).then(state => {
              if (state) {
                try {
                  const view = viewer.getMap().getView();

                  // Restore center
                  if (state.center) {
                    view.setCenter(state.center);
                  }

                  // Restore zoom level
                  if (state.zoom !== undefined) {
                    view.setZoom(state.zoom);
                  }

                  // Restore layer visibility, legend, opacity, and style
                  if (state.layers) {
                    Object.keys(state.layers).forEach(name => {
                      const layer = viewer.getLayer(name);
                      if (layer) {
                        const l = state.layers[name];

                        // Visibility
                        if (l.visible !== undefined) {
                          layer.setVisible(l.visible);
                        }

                        // Legend toggle
                        if (l.legend !== undefined) {
                          layer.set('legend', l.legend);
                        }

                        // Opacity (stored as 0–100, convert to 0–1)
                        if (l.opacity !== undefined) {
                          layer.setOpacity(l.opacity);
                        }

                        // Alternate style index
                        if (l.altStyleIndex !== undefined) {
                          layer.set('altStyleIndex', l.altStyleIndex);
                          // Optional: trigger style change if needed
                          // viewer.getStyleManager()?.setActiveStyle(layer, l.altStyleIndex);
                        }
                      }
                    });
                  }

                  // Restore legend control state (expanded/collapsed)
                  if (state.legend) {
                    const legend = viewer.getControlByName('legend');
                    if (legend && legend.setVisible) {
                      const isExpanded = Array.isArray(state.legend)
                        ? state.legend.includes('expanded')
                        : state.legend.includes('expanded');
                      legend.setVisible(isExpanded);
                    }
                  }

                  // Restore pin (feature info marker)
                  if (state.pin) {
                    const featureinfo = viewer.getFeatureinfo();
                    if (featureinfo && featureinfo.setPin) {
                      featureinfo.setPin(state.pin, true);
                    }
                  }

                  // Restore selected feature
                  if (state.feature) {
                    const featureinfo = viewer.getFeatureinfo();
                    if (featureinfo && featureinfo.setFeatureId) {
                      featureinfo.setFeatureId(state.feature);
                    }
                  }

                  // Restore map name (if using map switching)
                  if (state.map) {
                    viewer.setMapName(state.map);
                  }

                  console.log('Map state restored from ?mapStateId=', mapStateId);
                } catch (err) {
                  console.error('Failed to apply map state:', err);
                }
              }
            }).catch(err => {
              console.error('Failed to load map state:', err);
            });
          }

          // Notify extensions that the viewer is ready
          origo.dispatch('load', viewer);
        });
      })
      .catch(error => {
        console.error('Failed to load configuration:', error);
        renderError(error);
      });
  };
  // Add a listener to handle a new sharemap when using hash format.
  window.addEventListener('hashchange', (ev) => {
    const newParams = permalink.parsePermalink(ev.newURL);

    if (newParams.map) {
      // "Reboot" the application by creating a new viewer instance using the original configuration and the new sharemap state
      initViewer();
    }
  });

  return ui.Component({
    api,
    getConfig,
    onInit() {
      const defaultConfig = Object.assign({}, origoConfig, options);
      const base = document.createElement('base');
      base.href = defaultConfig.baseUrl;
      document.getElementsByTagName('head')[0].appendChild(base);
      origo = this;
      initViewer();
    }
  });
};

olInteraction.Draw.createBox = createBox;
olGeom.Polygon.fromCircle = fromCircle;
olGeom.Polygon.fromExtent = fromExtent;
Origo.controls = origoControls;
Origo.extensions = origoExtensions;
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
Origo.Loader = {};
Origo.Loader.show = Loader.showLoading;
Origo.Loader.hide = Loader.hideLoading;
Origo.Loader.withLoading = Loader.withLoading;
Origo.Loader.getInlineSpinner = Spinner;
Origo.layerType = layerType;

export default Origo;
