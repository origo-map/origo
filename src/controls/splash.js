import { Component, Modal } from '../ui';

const Splash = function Splash(options = {}) {
  const defaultTitle = 'Om kartan';
  const defaultContent = '<p></p>';
  const cls = 'o-splash';
  let viewer;
  let modal;

  let {
    title,
    content,
    target
  } = options;

  const {
    url
  } = options;

  return Component({
    name: 'splash',
    onAdd(evt) {
      viewer = evt.target;
      target = viewer.getId();
      if (!title) title = defaultTitle;

      if (url) {
        const fullUrl = viewer.getBaseUrl() + url;
        const req = new Request(`${fullUrl}`);
        fetch(req).then(response => response.text().then((text) => {
          content = text;
          this.render();
        }));
      } else {
        if (!content) content = defaultContent;
        this.render();
      }
    },
    render() {
      modal = Modal({
        title,
        content,
        cls,
        target
      });
      this.addComponent(modal);
      this.dispatch('render');
    }
  });
};

export default Splash;
