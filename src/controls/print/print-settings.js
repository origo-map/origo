import {
  Component, Button, Element as El, Collapse
} from '../../ui';
import printSettingsTemplate from './print-settings.template';
import CustomSizeControl from './custom-size-control';
import DescriptionControl from './description-control';
import MarginControl from './margin-control';
import OrientationControl from './orientation-control';
import SizeControl from './size-control';
import TitleControl from './title-control';
import CreatedControl from './created-control';
import NorthArrowControl from './north-arrow-control';
import PrintLegendControl from './print-legend-control';
import RotationControl from './rotation-control';
import SetScaleControl from './set-scale-control';
import ResolutionControl from './resolution-control';
import ShowScaleControl from './show-scale-control';

const PrintSettings = function PrintSettings(options = {}) {
  const {
    closeIcon = '#ic_close_24px',
    openIcon = '#ic_tune_24px',
    map,
    title,
    titlePlaceholderText,
    titleAlignment,
    titleSizes,
    titleSize,
    titleFormatIsVisible,
    description,
    descriptionPlaceholderText,
    descriptionAlignment,
    descriptionSizes,
    descriptionSize,
    descriptionFormatIsVisible,
    sizes,
    size,
    sizeCustomMinHeight,
    sizeCustomMaxHeight,
    sizeCustomMinWidth,
    sizeCustomMaxWidth,
    orientation,
    resolutions,
    resolution,
    scales,
    scaleInitial,
    settingsExpanded,
    showMargins,
    showCreated,
    showScale,
    showNorthArrow,
    showPrintLegend,
    rotation,
    rotationStep,
    localize
  } = options;

  let headerComponent;
  let contentComponent;
  let openButton;
  let closeButton;
  let printSettingsContainer;
  let customSizeControl;
  let northArrowControl;
  let printLegendControl;
  let rotationControl;
  let setScaleControl;

  // Set tabindex for all settings buttons to include or exclude in taborder depending on if expanded or not
  const setTabIndex = function setTabIndex() {
    let idx = -1;
    if (openButton.getState() === 'hidden') {
      idx = 0;
      document.getElementById(closeButton.getId()).focus();
    } else {
      document.getElementById(openButton.getId()).focus();
    }
    for (let i = 0; i < document.getElementById(contentComponent.getId()).getElementsByTagName('button').length; i += 1) {
      document.getElementById(contentComponent.getId()).getElementsByTagName('button')[i].tabIndex = idx;
    }
    for (let j = 0; j < document.getElementById(contentComponent.getId()).getElementsByTagName('input').length; j += 1) {
      document.getElementById(contentComponent.getId()).getElementsByTagName('input')[j].tabIndex = idx;
    }
    for (let h = 0; h < document.getElementById(contentComponent.getId()).getElementsByTagName('textarea').length; h += 1) {
      document.getElementById(contentComponent.getId()).getElementsByTagName('textarea')[h].tabIndex = idx;
    }
  };

  const toggle = function toggle() {
    if (openButton.getState() === 'hidden') {
      openButton.setState('initial');
      closeButton.setState('hidden');
    } else {
      openButton.setState('hidden');
      closeButton.setState('initial');
    }
    const customEvt = new CustomEvent('collapse:toggle', {
      bubbles: true
    });
    setTabIndex();
    document.getElementById(openButton.getId()).dispatchEvent(customEvt);
  };

  const close = function close() {
    openButton.setState('initial');
    closeButton.setState('hidden');
    const customEvt = new CustomEvent('collapse:collapse', {
      bubbles: true
    });
    document.getElementById(openButton.getId()).dispatchEvent(customEvt);
  };

  return Component({
    close,
    getScaleControl() { return setScaleControl; },
    onInit() {
      openButton = Button({
        cls: 'padding-small icon-smaller round light box-shadow',
        icon: openIcon,
        tooltipText: localize('settingsButtonTooltip'),
        tooltipPlacement: 'east',
        state: settingsExpanded === true ? 'hidden' : 'initial',
        validStates: ['initial', 'hidden'],
        click() {
          toggle();
        }
      });
      closeButton = Button({
        cls: 'small round margin-top-small margin-right small icon-smaller grey-lightest',
        icon: closeIcon,
        state: settingsExpanded === true ? 'initial' : 'hidden',
        validStates: ['initial', 'hidden'],
        ariaLabel: localize('closeButtonAriaLabel'),
        click() {
          toggle();
        }
      });
      headerComponent = El({
        cls: 'flex row justify-end',
        style: { width: '100%' },
        components: [openButton, closeButton]
      });

      const orientationControl = OrientationControl({ orientation, localize });
      const sizeControl = SizeControl({
        initialSize: size,
        sizes: Object.keys(sizes),
        localize
      });
      const titleControl = TitleControl({
        title,
        titlePlaceholderText,
        titleAlignment,
        titleSizes,
        titleSize,
        titleFormatIsVisible,
        localize
      });
      const descriptionControl = DescriptionControl({
        description,
        descriptionPlaceholderText,
        descriptionAlignment,
        descriptionSizes,
        descriptionSize,
        descriptionFormatIsVisible,
        localize
      });
      const marginControl = MarginControl({ checked: showMargins });
      const createdControl = CreatedControl({ checked: showCreated });
      const resolutionControl = resolutions.length > 1 ? ResolutionControl({
        initialResolution: resolution,
        resolutions
      }) : undefined;
      const showScaleControl = ShowScaleControl({ checked: showScale });
      northArrowControl = NorthArrowControl({ showNorthArrow });
      printLegendControl = PrintLegendControl({ showPrintLegend });
      rotationControl = map.getView().getConstraints().rotation(180) === 180 ? RotationControl({ rotation, rotationStep, map, localize }) : undefined;
      customSizeControl = CustomSizeControl({
        minHeight: sizeCustomMinHeight,
        maxHeight: sizeCustomMaxHeight,
        minWidth: sizeCustomMinWidth,
        maxWidth: sizeCustomMaxWidth,
        height: sizes.custom ? sizes.custom[0] : sizeCustomMinHeight,
        width: sizes.custom ? sizes.custom[1] : sizeCustomMinWidth,
        state: size === 'custom' ? 'active' : 'initial',
        localize
      });
      setScaleControl = SetScaleControl(map, {
        scales,
        initialScale: scaleInitial,
        localize
      });

      contentComponent = Component({
        onRender() { this.dispatch('render'); },
        render() {
          return printSettingsTemplate({
            id: this.getId(),
            customSizeControl,
            descriptionControl,
            marginControl,
            orientationControl,
            sizeControl,
            titleControl,
            createdControl,
            northArrowControl,
            rotationControl,
            setScaleControl,
            resolutionControl,
            showScaleControl,
            printLegendControl,
            localize
          });
        }
      });
      const components = [customSizeControl, marginControl, orientationControl, sizeControl, titleControl, descriptionControl, createdControl, northArrowControl, printLegendControl, setScaleControl, showScaleControl];
      if (rotationControl) { components.push(rotationControl); }
      if (resolutions.length > 1) { components.push(resolutionControl); }
      contentComponent.addComponents(components);
      printSettingsContainer = Collapse({
        cls: 'flex column',
        containerCls: 'collapse-container no-margin height-full',
        collapseX: true,
        collapseY: true,
        headerComponent,
        contentComponent,
        mainCls: 'collapse-scroll',
        expanded: settingsExpanded === true
      });
      this.addComponent(printSettingsContainer);

      descriptionControl.on('change:description', (evt) => this.dispatch('change:description', evt));
      descriptionControl.on('change:descriptionSize', (evt) => this.dispatch('change:descriptionSize', evt));
      descriptionControl.on('change:descriptionAlign', (evt) => this.dispatch('change:descriptionAlign', evt));
      marginControl.on('change:check', (evt) => this.dispatch('change:margin', evt));
      orientationControl.on('change:orientation', (evt) => this.dispatch('change:orientation', evt));
      sizeControl.on('change:size', (evt) => this.dispatch('change:size', evt));
      sizeControl.on('change:size', this.onChangeSize.bind(this));
      customSizeControl.on('change:size', (evt) => this.dispatch('change:size-custom', evt));
      titleControl.on('change:title', (evt) => this.dispatch('change:title', evt));
      titleControl.on('change:titleSize', (evt) => this.dispatch('change:titleSize', evt));
      titleControl.on('change:titleAlign', (evt) => this.dispatch('change:titleAlign', evt));
      createdControl.on('change:check', (evt) => this.dispatch('change:created', evt));
      northArrowControl.on('change:check', (evt) => this.dispatch('change:northarrow', evt));
      printLegendControl.on('change:check', (evt) => this.dispatch('change:printlegend', evt));
      if (resolutionControl) {
        resolutionControl.on('change:resolution', (evt) => this.dispatch('change:resolution', evt));
      }
      setScaleControl.on('change:scale', (evt) => this.dispatch('change:scale', evt));
      showScaleControl.on('change:check', (evt) => this.dispatch('change:showscale', evt));
    },
    onChangeSize(evt) {
      const visible = evt.size === 'custom';
      customSizeControl.dispatch('change:visible', { visible });
    },
    onRender() {
      if (rotationControl) { rotationControl.setRotation(); }
      this.dispatch('render');
      setTabIndex();
    },
    render() {
      return printSettingsContainer.render();
    }
  });
};

export default PrintSettings;
