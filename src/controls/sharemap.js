import { Component, Modal } from '../ui';
import permalink from '../permalink/permalink';

const ShareMap = function ShareMap(options = {}) {
  let {
    target
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

  const createContent = function createContent() { // Kopiera och klistra in länken för att dela kartan.
    const shareMapInstruction = localize('shareMapInstruction');
    return `<div class="o-share-link"><input type="text"></div><i>${shareMapInstruction}</i>`;
  };

  const createLink = function createLink(data) {
    const url = permalink.getPermalink(viewer, data);
    const inputElement = document.getElementsByClassName('o-share-link')[0].firstElementChild;

    inputElement.value = url;
    inputElement.select();
  };

  return Component({
    name: 'sharemap',
    addParamsToGetMapState(key, callback) {
      permalink.addParamsToGetMapState(key, callback);
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
            permalink.saveStateToServer(viewer).then((data) => {
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
