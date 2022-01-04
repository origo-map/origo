import { Component, Element as El, Button, dom } from '../../ui';
import PrintComponent from './print-component';

const Print = function Print(options = {}) {
  const {
    icon = '#ic_print_24px',
    placement = ['menu'],
    logo = {},
    northArrow = {},
    title = 'Skriv ut',
    headerText = '',
    headerPlaceholderText = 'Här kan du skriva en rubrik',
    headerAlignment = 'center',
    headerSizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    headerSize = 'h4',
    headerFormatIsVisible = false,
    descriptionText = '',
    descriptionPlaceholderText = 'Här kan du skriva en beskrivning',
    descriptionAlignment = 'center',
    descriptionSizes = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    descriptionSize = 'h4',
    descriptionFormatIsVisible = false,
    sizes = {
      a3: [420, 297],
      a4: [297, 210],
      custom: [297, 210]
    },
    sizeInitial = 'a4',
    sizeCustomMinHeight = 50,
    sizeCustomMaxHeight = 420,
    sizeCustomMinWidth = 50,
    sizeCustomMaxWidth = 420,
    orientation = 'portrait',
    resolutions = [
      { label: 'Låg', value: 75 },
      { label: 'Mellan', value: 150 },
      { label: 'Hög', value: 300 }
    ],
    resolution = 150,
    scales = [],
    scaleInitial,
    showMargins = true,
    showCreated = false,
    createdPrefix = '',
    showScale = true,
    rotation = 0,
    rotationStep = 1,
    leftFooterText = '',
    filename,
    mapInteractionsActive = false,
    supressResolutionsRecalculation = false
  } = options;
  let {
    showNorthArrow = true
  } = options;

  let viewer;
  let mapTools;
  let screenButtonContainer;
  let screenButton;
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
        sizes,
        size: sizeInitial,
        sizeCustomMinHeight,
        sizeCustomMaxHeight,
        sizeCustomMinWidth,
        sizeCustomMaxWidth,
        orientation,
        resolutions,
        resolution,
        scales,
        scaleInitial,
        showMargins,
        showCreated,
        createdPrefix,
        showScale,
        showNorthArrow,
        rotation,
        rotationStep,
        leftFooterText,
        mapInteractionsActive,
        supressResolutionsRecalculation
      });
      if (placement.indexOf('screen') > -1) {
        mapTools = `${viewer.getMain().getMapTools().getId()}`;
        screenButtonContainer = El({
          tagName: 'div',
          cls: 'flex column'
        });
        screenButton = Button({
          cls: 'o-print padding-small margin-bottom-smaller icon-smaller round light box-shadow',
          click() {
            printComponent.render();
          },
          icon,
          tooltipText: title,
          tooltipPlacement: 'east'
        });
        this.addComponent(screenButton);
      }
      if (placement.indexOf('menu') > -1) {
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
      }
      this.render();
    },
    render() {
      if (placement.indexOf('screen') > -1) {
        let htmlString = `${screenButtonContainer.render()}`;
        let el = dom.html(htmlString);
        document.getElementById(mapTools).appendChild(el);
        htmlString = screenButton.render();
        el = dom.html(htmlString);
        document.getElementById(screenButtonContainer.getId()).appendChild(el);
      }
      if (placement.indexOf('menu') > -1) {
        mapMenu.appendMenuItem(menuItem);
      }
      this.dispatch('render');
    }
  });
};

export default Print;
