import { Component } from '../../ui';
import PrintComponent from './print-component';

const Print = function Print(options = {}) {
  const {
    icon = '#ic_print_24px',
    logo = {},
    northArrow = {},
    title = 'Skriv ut',
    showCreated = false,
    createdPrefix = '',
    scales = [],
    showScale = true
  } = options;
  let {
    showNorthArrow = true
  } = options;

  let viewer;
  let mapMenu;
  let menuItem;

  return Component({
    name: 'print',
    onInit() {
      if ('visible' in northArrow) {
        showNorthArrow = northArrow.visible;
      }
    },
    onAdd(evt) {
      viewer = evt.target;
      const printComponent = PrintComponent({
        logo,
        northArrow,
        target: viewer.getId(),
        map: viewer.getMap(),
        viewer,
        showCreated,
        createdPrefix,
        showNorthArrow,
        scales,
        showScale
      });
      mapMenu = viewer.getControlByName('mapmenu');
      menuItem = mapMenu.MenuItem({
        click() {
          mapMenu.close();
          printComponent.render();
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

export default Print;
