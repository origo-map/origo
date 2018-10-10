import cu from 'ceeu';

const Link = function Link(options = {}) {
  let url;
  let title;
  let linkButton;
  let linkElement;

  return cu.Component({
    onAdd() {
      this.on('render', this.onRender);
      this.addComponents([linkButton]);
      this.render();
    },
    onInit() {
      url = options.url;
      title = options.title;
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
