import { Component, Button, Modal } from '../ui';

const Splash = function Splash(options = {}) {
  const defaultTitle = 'Om kartan';
  const defaultContent = '';
  const cls = 'o-splash';
  const style = options.style || '';
  let viewer;
  let hideButton;
  let modal;
  let component;
  let contentKey;
  let visibilityKey;

  let {
    title,
    content,
    target,
    hideButtonVisible,
    hideText,
    confirmText
  } = options;

  const {
    url
  } = options;

  const addButton = function addButton() {
    const hideButtonHtml = hideButton.render();
    content += hideButtonHtml;
    return content;
  };

  const clearLocalStorage = function clearLocalStorage() {
    localStorage.removeItem(visibilityKey);
    localStorage.removeItem(contentKey);
  };

  const setLocalStorage = function setLocalStorage() {
    const newContent = localStorage.getItem(contentKey) !== content;
    if (localStorage.getItem(visibilityKey) !== 'false' || content) {
      localStorage.setItem(contentKey, content);
      if (newContent) {
        localStorage.setItem(visibilityKey, 'true');
      }
    }
  };

  const createModal = function createModal(modalContent) {
    content = modalContent;

    if (hideButton) {
      setLocalStorage();
      component.addComponent(hideButton);
      content = addButton();
    } else {
      clearLocalStorage();
    }

    if (localStorage.getItem(visibilityKey) !== 'false') {
      modal = Modal({
        title,
        content,
        cls,
        target,
        style
      });
      component.dispatch('render');
    }
  };

  return Component({
    name: 'splash',
    onInit() {
      if (!title) title = defaultTitle;
      if (!content) content = defaultContent;
      if (options.hideButton) {
        hideButtonVisible = Object.prototype.hasOwnProperty.call(options.hideButton, 'visible') ? options.hideButton.visible : false;
        hideText = Object.prototype.hasOwnProperty.call(options.hideButton, 'hideText') ? options.hideButton.hideText : 'Visa inte igen';
        confirmText = Object.prototype.hasOwnProperty.call(options.hideButton, 'confirmText') ? options.hideButton.confirmText : 'Är du säker på att du inte vill se informationen igen?';
      }
      if (hideButtonVisible) {
        hideButton = Button({
          cls: 'rounded margin-top-small padding-y grey-lightest',
          style: 'display: block;',
          text: hideText,
          click() {
            const proceed = window.confirm(confirmText);
            if (proceed) {
              modal.closeModal();
              localStorage.setItem(visibilityKey, false);
            }
          }
        });
      }
    },
    onAdd(evt) {
      component = this;
      viewer = evt.target;
      target = viewer.getId();
      contentKey = `splashContent;${window.location.pathname};${viewer.getMapName().split('.')[0]}`;
      visibilityKey = `splashVisibility;${window.location.pathname};${viewer.getMapName().split('.')[0]}`;
      if (!title) title = defaultTitle;
      if (!content) content = defaultContent;

      if (url) {
        const fullUrl = url;
        const req = new Request(`${fullUrl}`);
        fetch(req).then(response => response.text().then((text) => {
          createModal(text);
          if (modal) {
            this.addComponent(modal);
          }
        }));
      } else {
        createModal(content);
        if (modal) {
          this.addComponent(modal);
        }
      }
    }
  });
};

export default Splash;
