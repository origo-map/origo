import { Component, Modal } from '../ui';
import permalink from '../permalink/permalink';

const ShareMap = function ShareMap(options = {}) {
  let {
    target,
    storeMethod,
    serviceEndpoint
  } = options;

  const {
    icon = '#ic_screen_share_outline_24px',
    title = 'Dela karta'
  } = options;
  let viewer;
  let mapMenu;
  let menuItem;
  let modal;

  const createContent = function createContent() {
    return '<div class="o-share-link"><input type="text"></div>' +
      '<i>Kopiera och klistra in länken för att dela kartan.</i>';
  };

  const createLink = function createLink(data) {
    const url = permalink.getPermalink(viewer, data);
    const inputElement = document.getElementsByClassName('o-share-link')[0].firstElementChild;
    inputElement.value = url;
    inputElement.select();
  };

  return Component({
    name: 'sharemap',
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
            title: 'Länk till karta',
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
