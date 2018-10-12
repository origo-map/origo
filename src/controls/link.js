import cu from 'ceeu';

const Link = function Link(options = {}) {
  const {
    url,
    title
  } = options;
  let linkButton;
  let linkElement;

  return cu.Component({
    name: 'link',
    onAdd() {
      this.addComponents([linkButton]);
      this.render();
    },
    onInit() {
      linkButton = cu.Button({
        id: 'o-link-button',
        cls: 'o-menu-button',
        click() {
          window.open(url);
        },
        text: title,
        icon: '#ic_launch_24px',
        iconCls: 'o-button-icon'
      });

      const rendered = linkButton.render();
      linkElement = cu.Element({
        cls: '',
        tagName: 'li',
        innerHTML: `${rendered}`
      });
    },
    render() {
      const htmlString = linkElement.render();
      const el = cu.dom.html(htmlString);
      document.getElementById('o-menutools').appendChild(el);
      this.dispatch('render');
    }
  });
};

export default Link;
