import cu from 'ceeu';

const Mapmenu = function Mapmenu({
  closeIcon = '#ic_close_24px',
  menuIcon = '#ic_menu_24px'
} = {}) {
  let headerComponent;
  let contentComponent;
  let menuButton;
  let closeButton;
  let mapMenu;
  let viewer;
  let target;

  const toggle = function toggle() {
    if (menuButton.getState() === 'hidden') {
      menuButton.setState('initial');
      closeButton.setState('hidden');
    } else {
      menuButton.setState('hidden');
      closeButton.setState('initial');
    }
    const customEvt = new CustomEvent('collapse:toggle', {
      bubbles: true
    });
    document.getElementById(menuButton.getId()).dispatchEvent(customEvt);
  };

  const close = function close() {
    menuButton.setState('initial');
    closeButton.setState('hidden');
    const customEvt = new CustomEvent('collapse:collapse', {
      bubbles: true
    });
    document.getElementById(menuButton.getId()).dispatchEvent(customEvt);
  };

  const MenuItem = function MenuItem({
    icon,
    click,
    title = ''
  } = {}) {
    const button = cu.Button({
      cls: 'icon-smaller compact no-grow',
      click,
      icon
    });
    const titleCmp = cu.Element({ cls: 'grow padding-left', innerHTML: title });
    return cu.Component({
      close,
      onInit() {
        this.addComponent(button);
      },
      onRender() {
        this.dispatch('render');
        document.getElementById(titleCmp.getId()).addEventListener('click', () => {
          button.dispatch('click');
        });
      },
      render() {
        return `<li class="flex row align-center padding-x padding-y-smaller hover pointer">
                  ${button.render()}
                  ${titleCmp.render()}
                </li>`;
      }
    });
  };

  return cu.Component({
    name: 'mapmenu',
    close,
    MenuItem,
    appendMenuItem(menuItem) {
      const menuItemEl = cu.dom.html(menuItem.render());
      document.getElementById(contentComponent.getId()).appendChild(menuItemEl);
    },
    onAdd(evt) {
      viewer = evt.target;
      target = `${viewer.getMain().getId()}`;
      this.on('render', this.onRender);
      this.addComponents([mapMenu]);
      this.render();
    },
    onInit() {
      menuButton = cu.Button({
        cls: 'padding-y-small padding-x icon-small light',
        icon: menuIcon,
        text: 'Meny',
        tooltipText: 'Meny',
        tooltipPlacement: 'west',
        state: 'initial',
        validStates: ['initial', 'hidden'],
        click() {
          toggle();
        }
      });
      closeButton = cu.Button({
        cls: 'small round margin-top-small margin-right small icon-smaller grey-lightest',
        icon: closeIcon,
        state: 'hidden',
        validStates: ['initial', 'hidden'],
        click() {
          toggle();
        }
      });
      headerComponent = cu.Element({
        cls: 'flex row justify-end',
        style: { width: '100%' },
        components: [menuButton, closeButton]
      });
      contentComponent = cu.Component({
        render() {
          return `<div class="relative width-12"><ul class="padding-y-small" id="${this.getId()}""></ul></div>`;
        }
      });
      mapMenu = cu.Collapse({
        cls: 'absolute flex column top-right rounded box-shadow bg-white overflow-hidden',
        headerComponent,
        contentComponent
      });
    },
    render() {
      const menuEl = cu.dom.html(mapMenu.render());
      document.getElementById(target).appendChild(menuEl);
      this.dispatch('render');
    }
  });
};

export default Mapmenu;
