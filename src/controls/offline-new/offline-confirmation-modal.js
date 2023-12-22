import { Component, Button, dom, Element } from '../../ui';
import { html } from '../../ui/dom/dom';
import utils from '../../utils';

/**
 * Creates an offline confirmation modal component.
 *
 * @param {Object} options - The options for configuring the modal.
 * @param {string} options.title - The title of the confirmation modal.
 * @param {HTMLElement} options.content - The content or message element of the confirmation modal.
 * @param {string} options.target - The target ID or selector where the modal should be appended.
 * @returns {Component} The created confirmation modal component.
 */
const offlineConfirmationModal = function offlineConfirmationModal(options = {}) {
  const {
    title,
    content,
    target
  } = options;

  let modal;
  let component;

  /**
   * Remove modal.
   */
  const closeModal = function closeModal() {
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  };

  /**
   * Add components for the modal header.
   */
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
    ariaLabel: 'St�ng',
    click() {
      closeModal();
      component.dispatch('closed');
    }
  });

  headerComponents.push(closeButton);

  /**
   * Header element with components.
   */
  const headerElement = Element({
    cls: 'flex row justify-end grey-lightest draggable',
    components: headerComponents
  });

  /**
   * Create content element where
   * content can be injected.
   */
  const contentElement = Element({
    cls: 'o-modal-content'
  });

  /**
   * Create the modal element.
   */
  const modalElement = Element({
    cls: 'o-offline-confirmation-modal',
    components: [headerElement, contentElement]
  });

  /**
   * Wrap the modal into a wrapper element.
   */
  const wrapperElement = Element({
    cls: 'flex',
    components: [modalElement]
  });

  /**
 * Return the modal component.
 *
 * @returns {Component} The modal component with methods for controlling its behavior.
 */
  return Component({
    /**
   * Close the modal.
   */
    closeModal,

    /**
   * Hide the modal by adding the 'o-hidden' class.
   */
    hide() {
      modal.classList.add('o-hidden');
    },

    /**
   * Show the modal by removing the 'o-hidden' class.
   */
    show() {
      modal.classList.remove('o-hidden');
    },

    /**
   * Initialization logic executed when the modal component is created.
   */
    onInit() {
      // Add header and content components to the modal.
      this.addComponent(headerElement);
      this.addComponent(contentElement);

      // Listen for the 'render' event and call the onRender method.
      this.on('render', this.onRender);

      // Insert the modal into the DOM.
      document.getElementById(target).appendChild(html(this.render()));

      // Append HTML representation of the provided content to the content element.
      const contentDomElement = document.getElementById(contentElement.getId());
      contentDomElement.innerHTML = '';
      contentDomElement.appendChild(dom.html(content.render()));

      // Set the current component as 'component' and dispatch the 'render' event.
      component = this;
      this.dispatch('render');
    },

    /**
   * Callback method executed when the modal is rendered.
   */
    onRender() {
      // Retrieve the modal and make its box draggable.
      modal = document.getElementById(wrapperElement.getId());
      const modalBox = modal.getElementsByClassName('o-offline-confirmation-modal')[0];
      utils.makeElementDraggable(modalBox);
    },

    /**
   * Render method returning the HTML representation of the modal.
   *
   * @returns {string} The HTML representation of the modal.
   */
    render() {
      return wrapperElement.render();
    }
  });
};

/**
 * Offline Confirmation Modal module.
 * @module offlineConfirmationModal
 * @exports offlineConfirmationModal
 */
export default offlineConfirmationModal;
