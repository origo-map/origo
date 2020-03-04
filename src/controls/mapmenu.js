import {
  Component, Button, Element as El, dom
} from '../ui';

const Mapmenu = function Mapmenu({
  autoHide = 'never',
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
  let isExpanded = false;
  let mapMenuEl;
  let menuButtonEl;

  const toggle = function toggle() {
    mapMenuEl.classList.toggle('faded');
    menuButtonEl.classList.toggle('faded');
    isExpanded = !isExpanded;
  };

  const close = function close() {
    if (isExpanded) {
      toggle();
    }
  };

  const onMapClick = function onMapClick() {
    if (autoHide === 'always') {
      close();
    } else if (autoHide === 'mobile') {
      const size = viewer.getSize();
      if (size === 'm' || size === 's' || size === 'xs') {
        close();
      }
    }
  };

  const MenuItem = function MenuItem({
    icon,
    click,
    title = ''
  } = {}) {
    const button = Button({
      cls: 'icon-smaller compact no-grow',
      click,
      icon
    });
    const titleCmp = El({ cls: 'grow padding-left', innerHTML: title });
    return Component({
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

  return Component({
    name: 'mapmenu',
    close,
    MenuItem,
    appendMenuItem(menuItem) {
      const menuItemEl = dom.html(menuItem.render());
      document.getElementById(contentComponent.getId()).appendChild(menuItemEl);
    },
    onAdd(evt) {
      viewer = evt.target;
      target = document.getElementById(viewer.getMain().getId());
      this.on('render', this.onRender);
      this.addComponents([mapMenu, menuButton]);
      this.render();
      viewer.getMap().on('click', onMapClick);
    },
    onInit() {
      const menuButtonCls = isExpanded ? ' faded' : '';
      menuButton = Button({
        icon: menuIcon,
        cls: `control icon-smaller medium round absolute light top-right${menuButtonCls}`,
        tooltipText: 'Meny',
        tooltipPlacement: 'west',
        click() {
          toggle();
        }
      });
      closeButton = Button({
        cls: 'small round margin-top-small margin-right-small icon-smaller grey-lightest',
        icon: closeIcon,
        click() {
          toggle();
        }
      });
      headerComponent = El({
        cls: 'flex row justify-end',
        style: { width: '100%' },
        components: [closeButton]
      });
      contentComponent = Component({
        render() {
          return `<div class="relative width-12"><ul class="padding-y-small" id="${this.getId()}""></ul></div>`;
        }
      });
      mapMenu = El({
        cls: 'absolute flex column top-right control box bg-white overflow-hidden faded',
        collapseX: true,
        components: [headerComponent, contentComponent]
      });
    },
    render() {
      const menuEl = dom.html(mapMenu.render());
      target.appendChild(menuEl);
      mapMenuEl = document.getElementById(mapMenu.getId());
      const el = dom.html(menuButton.render());
      target.appendChild(el);
      menuButtonEl = document.getElementById(menuButton.getId());
      this.dispatch('render');
    }
  });
};

export default Mapmenu;
