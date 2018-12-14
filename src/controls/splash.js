import { Component } from '../ui';
import modal from '../modal';

const Splash = function Splash(options = {}) {
  const defaultTitle = 'Om kartan';
  const defaultContent = '<p></p>';
  const cls = 'o-splash';
  let viewer;

  let {
    title,
    content
  } = options;

  const {
    url
  } = options;

  function openModal() {
    modal.createModal(`#${viewer.getId()}`, {
      title,
      content,
      cls
    });
    modal.showModal();
  }

  return Component({
    name: 'splash',
    onAdd(evt) {
      viewer = evt.target;
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
      openModal();
      this.dispatch('render');
    }
  });
};

export default Splash;
