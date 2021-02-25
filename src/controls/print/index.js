import { Component } from '../../ui';
import PrintComponent from './print-component';

const Print = function Print(options = {}) {
  const {
    icon = '#ic_print_24px',
    logo = {},
    northArrow = {},
    title = 'Skriv ut',
    headerText = '',
    headerPlaceholderText = 'Här kan du skriva en rubrik',
    headerAlignment = 'center',
    headerSizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    descriptionText = '',
    descriptionPlaceholderText = 'Här kan du skriva en beskrivning',
    descriptionAlignment = 'center',
    descriptionSizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    leftFooterText = '',
    showCreated = false,
    createdPrefix = '',
    scales = [],
    showScale = true,
    filename
  } = options;
  let {
    headerSize = 'h4',
    headerFormatIsVisible = false,
    descriptionSize = 'h4',
    descriptionFormatIsVisible = false,
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
        filename,
        map: viewer.getMap(),
        target: viewer.getId(),
        viewer,
        title: headerText,
        titlePlaceholderText: headerPlaceholderText,
        titleAlignment: headerAlignment,
        titleSizes: headerSizes,
        titleSize: headerSize,
        titleFormatIsVisible: headerFormatIsVisible,
        description: descriptionText,
        descriptionPlaceholderText,
        descriptionAlignment,
        descriptionSizes,
        descriptionSize,
        descriptionFormatIsVisible,
        leftFooterText,
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
