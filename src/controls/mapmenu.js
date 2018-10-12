import cu from 'ceeu';

let closeButton;
let mapMenu;
let mapMenuButton;

let options;
let isActive;

function toggleMenu() {
  document.getElementById(mapMenu.getId()).classList.toggle('o-mapmenu-show');
}

function getTarget() {
  return mapMenu;
}

const Mapmenu = function Mapmenu(opt = {}) {
  let viewer;
  let target;
  options = opt;

  return cu.Component({
    name: 'mapmenu',
    toggleMenu,
    onAdd(evt) {
      viewer = evt.target;
      target = `${viewer.getMain().getId()}`;
      this.on('render', this.onRender);
      this.addComponents([mapMenuButton]);
      this.addComponents([mapMenu]);
      this.addComponents([closeButton]);
      this.render();

      const breakPointSize = options.breakPointSize || 'l';
      const breakPoint = viewer.getBreakPoints(breakPointSize);
      isActive = options.isActive || false;

      if (isActive && document.getElementById(target).offsetWidth >= breakPoint[0]) {
        toggleMenu();
      }
    },
    onInit() {
      mapMenuButton = cu.Button({
        cls: 'o-mapmenu-button padding-small icon-smaller rounded light box-shadow absolute',
        icon: '#fa-bars',
        text: 'Meny',
        textCls: 'o-button-text',
        tooltipText: 'Meny',
        tooltipPlacement: 'west',
        click() {
          toggleMenu();
        }
      });

      closeButton = cu.Button({
        cls: 'o-mapmenu-button-close padding-small icon-smaller rounded light absolute',
        icon: '#fa-times',
        tooltipText: 'Stäng meny',
        tooltipPlacement: 'west',
        click() {
          toggleMenu();
        }
      });

      mapMenu = cu.Element({
        cls: 'o-mapmenu',
        innerHTML: '<div class="o-block"><ul id="o-menutools"><li></li></ul></div>'
      });
    },
    render() {
      const buttonHtmlString = mapMenuButton.render();
      const closeButtonHtmlString = closeButton.render();
      const menuHtmlString = mapMenu.render();

      const menuButtonEl = cu.dom.html(buttonHtmlString);
      const closeButtonEl = cu.dom.html(closeButtonHtmlString);
      const menuEl = cu.dom.html(menuHtmlString);

      document.getElementById(target).appendChild(menuButtonEl);
      document.getElementById(target).appendChild(menuEl);
      document.getElementById('o-menutools').appendChild(closeButtonEl);

      this.dispatch('render');
    }
  });
};

export default Mapmenu;

// export default {
//   Mapmenu,
//   toggleMenu,
//   getTarget
// };
