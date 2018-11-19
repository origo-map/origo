import cu from 'ceeu';
import modal from '../modal';

const About = function About(options = {}) {
  let {
    buttonText
  } = options;
  const {
    content = '<p></p>',
    icon = '#ic_help_outline_24px',
    title = 'Om kartan'
  } = options;

  let viewer;
  let mapMenu;
  let menuItem;

  function openModal() {
    modal.createModal(`#${viewer.getId()}`, {
      title,
      content
    });
    modal.showModal();
    mapMenu.close();
  }

  return cu.Component({
    name: 'about',
    onAdd(evt) {
      if (!buttonText) buttonText = title;
      viewer = evt.target;
      mapMenu = viewer.getControlByName('mapmenu');
      menuItem = mapMenu.MenuItem({
        click() {
          openModal();
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
