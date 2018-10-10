import cu from 'ceeu';
import modal from '../modal';

const About = function About(options = {}) {
  let {
    buttonText,
    content,
    title
  } = options;

  const defaultContent = '<p></p>';
  const defaultTitle = 'Om kartan';
  let viewer;
  let aboutButton;
  let aboutElement;

  function openModal() {
    modal.createModal(`#${viewer.getId()}`, {
      title,
      content
    });
    modal.showModal();
  }

  return cu.Component({
    onAdd(evt) {
      viewer = evt.target;
      this.addComponents([aboutButton]);
      this.render();
    },
    onInit() {
      if (!title) title = defaultTitle;
      if (!buttonText) buttonText = defaultTitle;
      if (!content) content = defaultContent;

      aboutButton = cu.Button({
        id: 'o-about-button',
        cls: 'o-menu-button',
        click() {
          openModal();
        },
        text: title,
        icon: '#ic_help_outline_24px',
        iconCls: 'o-button-icon'
      });

      const rendered = aboutButton.render();

      aboutElement = cu.Element({
        cls: '',
        tagName: 'li',
        innerHTML: `${rendered}`
      });
    },
    render() {
      const htmlString = aboutElement.render();
      const el = cu.dom.html(htmlString);
      document.getElementById('o-menutools').appendChild(el);
      this.dispatch('render');
    }
  });
};

export default About;
