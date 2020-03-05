import { Component, Button, Element as El, Collapse } from '../../ui';
import printSettingsTemplate from './print-settings.template';
import CustomSizeControl from './custom-size-control';
import DescriptionControl from './description-control';
import MarginControl from './margin-control';
import OrientationControl from './orientation-control';
import SizeControl from './size-control';
import TitleControl from './title-control';

const PrintSettings = function PrintSettings({
  closeIcon = '#ic_close_24px',
  initialSize,
  openIcon = '#ic_tune_24px',
  orientation = 'portrait',
  customSize,
  sizes
} = {}) {
  let headerComponent;
  let contentComponent;
  let openButton;
  let closeButton;
  let printSettingsContainer;
  let customSizeControl;

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
    onInit() {
      openButton = Button({
        cls: 'padding-small icon-smaller light text-normal',
        icon: openIcon,
        tooltipText: 'Visa inställningar',
        tooltipPlacement: 'east',
        state: 'initial',
        validStates: ['initial', 'hidden'],
        click() {
          toggle();
        }
      });
      closeButton = Button({
        cls: 'small round margin-top-small margin-right small icon-smaller grey-lightest',
        icon: closeIcon,
        state: 'hidden',
        validStates: ['initial', 'hidden'],
        click() {
          toggle();
        }
      });
      headerComponent = El({
        cls: 'flex row justify-end',
        style: { width: '100%' },
        components: [openButton, closeButton]
      });

      const orientationControl = OrientationControl({ orientation });
      const sizeControl = SizeControl({ initialSize, sizes });
      const titleControl = TitleControl({});
      const descriptionControl = DescriptionControl();
      const marginControl = MarginControl({ checked: true });
      customSizeControl = CustomSizeControl({
        state: initialSize === 'custom' ? 'active' : 'inital',
        height: customSize[0],
        width: customSize[1]
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
            titleControl
          });
        }
      });
      contentComponent.addComponents([customSizeControl, marginControl, orientationControl, sizeControl, titleControl, descriptionControl]);
      printSettingsContainer = Collapse({
        cls: 'no-print fixed flex column top-left rounded box-shadow bg-white overflow-hidden z-index-ontop-high',
        collapseX: true,
        collapseY: true,
        headerComponent,
        contentComponent
      });
      this.addComponent(printSettingsContainer);

      descriptionControl.on('change', evt => this.dispatch('change:description', evt));
      marginControl.on('change:check', evt => this.dispatch('change:margin', evt));
      orientationControl.on('change:orientation', evt => this.dispatch('change:orientation', evt));
      sizeControl.on('change:size', evt => this.dispatch('change:size', evt));
      sizeControl.on('change:size', this.onChangeSize.bind(this));
      customSizeControl.on('change:size', evt => this.dispatch('change:size-custom', evt));
      titleControl.on('change', evt => this.dispatch('change:title', evt));
    },
    onChangeSize(evt) {
      const visible = evt.size === 'custom';
      customSizeControl.dispatch('change:visible', { visible });
    },
    onRender() {
      this.dispatch('render');
    },
    render() {
      return printSettingsContainer.render();
    }
  });
};

export default PrintSettings;
