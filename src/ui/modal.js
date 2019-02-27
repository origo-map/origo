// import $ from 'jquery';
import Component from './component';
import Element from './element';
import Button from './button';
import { html } from './dom/dom';

export default function Modal(options = {}) {
  const {
    title = '',
    content = '',
    cls = '',
    isStatic = options.static,
    target,
    closeIcon = '#ic_close_24px'
  } = options;

  let modal;
  let screenEl;
  let titleEl;
  let headerEl;
  let contentEl;
  let closeButton;

  const closeModal = function closeModal() {
    modal.parentNode.removeChild(modal);
  };

  return Component({
    closeModal,
    onInit() {
      screenEl = Element({
        cls: 'o-modal-screen'
      });

      titleEl = Element({
        cls: 'flex row justify-start margin-top-small margin-left text-weight-bold',
        style: 'width: 100%;',
        innerHTML: `${title}`
      });

      closeButton = Button({
        cls: 'small round margin-top-small margin-right icon-smaller grey-lightest no-shrink',
        icon: closeIcon,
        validStates: ['initial', 'hidden'],
        click() {
          closeModal();
        }
      });

      headerEl = Element({
        cls: 'flex row justify-end grey-lightest',
        components: [titleEl, closeButton]
      });

      contentEl = Element({
        cls: 'o-modal-content',
        innerHTML: `${content}`
      });

      this.addComponent(screenEl);
      this.addComponent(headerEl);
      this.addComponent(contentEl);

      headerEl.addComponent(titleEl);
      headerEl.addComponent(closeButton);

      this.on('render', this.onRender);
      document.getElementById(target).appendChild(html(this.render()));
      this.dispatch('render');
    },
    onRender() {
      modal = document.getElementById(this.getId());
      document.getElementById(screenEl.getId()).addEventListener('click', () => {
        if (!isStatic) {
          closeButton.dispatch('click');
        }
      });
    },
    render() {
      return `<div id="${this.getId()}" class="${cls} flex">
                  ${screenEl.render()}
                  <div class="o-modal">
                    ${headerEl.render()}
                    ${contentEl.render()}
                  </div>
                </div>`;
    }
  });
}
