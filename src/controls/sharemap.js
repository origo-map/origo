import { Component, Modal } from '../ui';
import permalink from '../permalink/permalink';

const ShareMap = function ShareMap(options = {}) {
  let {
    target,
    configName // <-- retrieve configName from options if provided
  } = options;

  const {
    localization
  } = options;

  function localize(key) {
    return localization.getStringByKeys({ targetParentKey: 'sharemap', targetKey: key });
  }

  const {
    icon = '#ic_screen_share_outline_24px',
    title = localize('title'),
    storeMethod,
    serviceEndpoint
  } = options;
  let viewer;
  let mapMenu;
  let menuItem;
  let modal;

  // --- New function to get configName also for inline config ---
  function getConfigName() {
    // Check if we received a configName via options or as a global variable
    // Otherwise, use 'inline' as fallback
    return configName || window.config || 'inline';
  }

  const createContent = function createContent() { // Copy and paste the link to share the map.
    const shareMapInstruction = localize('shareMapInstruction');
    return `<div class="o-share-link"><input type="text"></div><i>${shareMapInstruction}</i>`;
  };

  const createLink = function createLink(data) {
    // Include configName so the permalink is identified correctly
    const url = permalink.getPermalink(viewer, data, getConfigName());
    const inputElement = document.getElementsByClassName('o-share-link')[0].firstElementChild;

    inputElement.value = url;
    inputElement.select();
  };

  return Component({
    name: 'sharemap',
    addParamsToGetMapState(key, callback) {
      permalink.addParamsToGetMapState(key, callback, getConfigName());
    },
    onInit() {
      if (storeMethod && serviceEndpoint) {
        permalink.setSaveOnServerServiceEndpoint(serviceEndpoint);
      }
    },
    onAdd(evt) {
      viewer = evt.target;
      target = viewer.getId();
      mapMenu = viewer.getControlByName('mapmenu');
      menuItem = mapMenu.MenuItem({
        click() {
          mapMenu.close();
          modal = Modal({
            title: localize('linkToMap'),
            content: createContent(),
            target
          });
          this.addComponent(modal);
          if (storeMethod === 'saveStateToServer') {
            // Send configName to the backend save function!
            permalink.saveStateToServer(viewer, getConfigName()).then((data) => {
              createLink(data);
            });
          } else {
            createLink();
          }
        },
        icon,
        title
      });
      this.addComponent(menuItem);
      this.render();
    },
    render() {
      mapMenu.appendMenuItem(menuItem);
      this.dispatch('render');
    }
  });
};

export default ShareMap;
