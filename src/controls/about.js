import { Component, Modal } from '../ui';

const About = function About(options = {}) {
  let {
    buttonText,
    target
  } = options;
  const {
    content = '<p></p>',
    icon = '#ic_help_outline_24px',
    title = 'Om kartan'
  } = options;

  let viewer;
  let mapMenu;
  let menuItem;
  let modal;

  return Component({
    name: 'about',
    onAdd(evt) {
      if (!buttonText) buttonText = title;
      viewer = evt.target;
      target = viewer.getId();
      mapMenu = viewer.getControlByName('mapmenu');
      menuItem = mapMenu.MenuItem({
        click() {
          modal = Modal({
            title,
            content,
            target
          });
          this.addComponent(modal);
          mapMenu.close();
        },
        icon,
        title: buttonText
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

export default About;
