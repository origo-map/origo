import { Component, Modal } from '../ui';

const Splash = function Splash(options = {}) {
  const defaultTitle = 'Om kartan';
  const defaultContent = '';
  const cls = 'o-splash';
  let viewer;

  let {
    title,
    content,
    target
  } = options;

  const {
    url
  } = options;

  const createModal = function createModal(modalContent) {
    return Modal({
      title,
      content: modalContent,
      cls,
      target
    });
  };

  return Component({
    name: 'splash',
    onAdd(evt) {
      viewer = evt.target;
      target = viewer.getId();
      if (!title) title = defaultTitle;
      if (!content) content = defaultContent;

      if (url) {
        const fullUrl = viewer.getBaseUrl() + url;
        const req = new Request(`${fullUrl}`);
        fetch(req).then(response => response.text().then((text) => {
          this.addComponent(createModal(text));
        }));
      } else {
        this.addComponent(createModal(content));
      }
    }
  });
};

export default Splash;
