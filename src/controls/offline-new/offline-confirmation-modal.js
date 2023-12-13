import { Component, Button, dom, Element } from '../../ui';
import { html } from '../../ui/dom/dom';
import utils from '../../utils';

const offlineConfirmationModal = function offlineConfirmationModal(options = {}) {
  const {
    title,
    content,
    target
  } = options;

  let modal;
  let component;

  const closeModal = function closeModal() {
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  };

  const headerComponents = [];

  const titleElement = Element({
    cls: 'flex row justify-start margin-y-smaller margin-left text-weight-bold',
    style: 'width: 100%;',
    innerHTML: title
  });

  headerComponents.push(titleElement);

  const closeButton = Button({
    cls: 'small round margin-top-smaller margin-bottom-auto margin-right icon-smaller grey-lightest no-shrink',
    icon: '#ic_close_24px',
    validStates: ['initial', 'hidden'],
    ariaLabel: 'Stäng',
    click() {
      closeModal();
      component.dispatch('closed');
    }
  });

  headerComponents.push(closeButton);

  const headerElement = Element({
    cls: 'flex row justify-end grey-lightest draggable',
    components: headerComponents
  });

  const contentElement = Element({
    cls: 'o-modal-content'
  });

  const modalElement = Element({
    cls: 'o-offline-confirmation-modal',
    components: [headerElement, contentElement]
  });

  const wrapperElement = Element({
    cls: 'flex',
    components: [modalElement]
  });

  return Component({
    closeModal,
    hide() {
      modal.classList.add('o-hidden');
    },
    show() {
      modal.classList.remove('o-hidden');
    },
    onInit() {
      this.addComponent(headerElement);
      this.addComponent(contentElement);

      this.on('render', this.onRender);
      
      document.getElementById(target).appendChild(html(this.render()));

      const contentDomElement = document.getElementById(contentElement.getId());
      contentDomElement.innerHTML = '';
      contentDomElement.appendChild(dom.html(content.render()));

      component = this;
      this.dispatch('render');
    },
    onRender() {
      modal = document.getElementById(wrapperElement.getId());
      const modalBox = modal.getElementsByClassName('o-offline-confirmation-modal')[0];
      utils.makeElementDraggable(modalBox);
    },
    render() {
      return wrapperElement.render();
    }
  });
}

export default offlineConfirmationModal;
