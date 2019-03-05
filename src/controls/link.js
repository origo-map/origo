import { Component } from '../ui';

const Link = function Link(options = {}) {
  const {
    icon = '#ic_launch_24px',
    url,
    title
  } = options;
  let mapMenu;
  let menuItem;
  let viewer;

  return Component({
    name: 'link',
    onAdd(evt) {
      viewer = evt.target;
      mapMenu = viewer.getControlByName('mapmenu');
      menuItem = mapMenu.MenuItem({
        click() {
          mapMenu.close();
          window.open(url);
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

export default Link;
