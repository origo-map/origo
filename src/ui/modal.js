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
    closeIcon = '#ic_close_24px',
    style = '',
    newTabUrl = ''
  } = options;

  let modal;
  let screenEl;
  let titleEl;
  let headerEl;
  let contentEl;
  let closeButton;
  let newTabButton;

  const closeModal = function closeModal() {
    modal.parentNode.removeChild(modal);
  };

  return Component({
    closeModal,
    onInit() {
      screenEl = Element({
        cls: 'o-modal-screen'
      });

      const headerCmps = [];

      titleEl = Element({
        cls: 'flex row justify-start margin-top-small margin-left text-weight-bold',
        style: 'width: 100%;',
        innerHTML: `${title}`
      });
      headerCmps.push(titleEl);

      if (newTabUrl) {
        newTabButton = Button({
          cls: 'small round margin-top-small margin-right icon-smaller grey-lightest no-shrink',
          icon: '#ic_launch_24px',
          click() {
            window.open(newTabUrl);
          }
        });
        headerCmps.push(newTabButton);
      }

      closeButton = Button({
        cls: 'small round margin-top-small margin-right icon-smaller grey-lightest no-shrink',
        icon: closeIcon,
        validStates: ['initial', 'hidden'],
        click() {
          closeModal();
        }
      });
      headerCmps.push(closeButton);

      headerEl = Element({
        cls: 'flex row justify-end grey-lightest',
        components: headerCmps
      });

      contentEl = Element({
        cls: 'o-modal-content',
        innerHTML: `${content}`
      });

      this.addComponent(screenEl);
      this.addComponent(headerEl);
      this.addComponent(contentEl);

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
      let addStyle;
      if (style !== '') {
        addStyle = `style="${style}"`;
      } else {
        addStyle = '';
      }
      return `<div id="${this.getId()}" class="${cls} flex">
                  ${screenEl.render()}
                  <div class="o-modal" ${addStyle}>
                    ${headerEl.render()}
                    ${contentEl.render()}
                  </div>
                </div>`;
    }
  });
}
