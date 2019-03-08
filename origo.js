import polyfill from './src/utils/polyfill';
import * as ui from './src/ui';
import Viewer from './src/viewer';
import loadResources from './src/loadresources';
import titleCase from './src/utils/titlecase';
import * as origoControls from './src/controls';
import supports from './src/utils/supports';
import renderError from './src/utils/rendererror';

const Origo = function Origo(configPath, options = {}) {
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

  const getConfig = () => origoConfig;

  return ui.Component({
    getConfig,
    onInit() {
      const defaultConfig = Object.assign({}, origoConfig, options);
      const request = loadResources(configPath, defaultConfig);
      if (request) {
        request.then((data) => {
          const viewerOptions = data.options;
          viewerOptions.controls = initControls(viewerOptions.controls);
          const target = viewerOptions.target;
          const viewer = Viewer(target, viewerOptions);
          this.dispatch('load', viewer);
        });
      }
    }
  });
};

Origo.controls = origoControls;
Origo.ui = ui;

export default Origo;
