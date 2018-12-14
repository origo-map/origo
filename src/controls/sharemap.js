import { Component } from '../ui';
import modal from '../modal';
import permalink from '../permalink/permalink';

const ShareMap = function ShareMap(options = {}) {
  const {
    icon = '#ic_screen_share_outline_24px',
    title = 'Dela karta'
  } = options;
  let viewer;
  let mapMenu;
  let menuItem;

  const createContent = function createContent() {
    return '<div class="o-share-link"><input type="text"></div>' +
      '<i>Kopiera och klistra in länken för att dela kartan.</i>';
  };

  const createLink = function createLink() {
    const url = permalink.getPermalink(viewer);
    const inputElement = document.getElementsByClassName('o-share-link')[0].firstElementChild;
    inputElement.value = url;
    inputElement.select();
  };

  const openModal = function openModal() {
    modal.createModal(`#${viewer.getId()}`, {
      title: 'Länk till karta',
      content: createContent()
    });
    modal.showModal();
    createLink(); // Add link to input
    mapMenu.close();
  };

  return Component({
    name: 'sharemap',
    onAdd(evt) {
      viewer = evt.target;
      mapMenu = viewer.getControlByName('mapmenu');
      menuItem = mapMenu.MenuItem({
        click() {
          openModal();
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
