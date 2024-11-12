import { Component, Element as El, Button, dom } from '../ui';

const Link = function Link(options = {}) {
  const {
    icon = '#ic_launch_24px',
    placement = ['menu'],
    target = '_blank',
    url,
    title
  } = options;
  let mapMenu;
  let menuItem;
  let viewer;
  let mapTools;
  let screenButtonContainer;
  let screenButton;

  return Component({
    name: 'link',
    onAdd(evt) {
      viewer = evt.target;
      if (placement.indexOf('screen') > -1) {
        mapTools = `${viewer.getMain().getMapTools().getId()}`;
        screenButtonContainer = El({
          tagName: 'div',
          cls: 'flex column'
        });
        screenButton = Button({
          cls: 'o-link padding-small icon-smaller round light box-shadow',
          click() {
            window.open(url, target);
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
            window.open(url, target);
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

export default Link;
