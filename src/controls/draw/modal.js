import $ from 'jquery';

const modal = function modal() {
  let isStatic;
  let $target;
  let modalEl;

  function closeModal() {
    $('#o-modal').remove();
  }

  function render(title, content, cls) {
    modalEl = `<div id="o-modal" class="${cls}">
                <div class="o-modal-screen"></div>
                <div class="o-modal">
                  <div class="o-close-button"><svg class="o-icon-fa-times"><use xlink:href="#fa-times"></use></svg></div>
                  <div class="o-modal-title">${title}</div>
                  <div class="o-modal-content">${content}</div>
                </div>
              </div>`;
  }

  function bindUIActions() {
    if (isStatic === false) {
      $('.o-modal-screen, .o-close-button').click(() => {
        closeModal();
      });
    } else {
      $('.o-close-button').click(() => {
        closeModal();
      });
    }
  }

  function createModal(modalTarget, options) {
    const title = options.title || '';
    const content = options.content || '';
    const cls = options.cls || '';
    if (Object.prototype.hasOwnProperty.call(options, 'static')) {
      isStatic = options.static;
    } else {
      isStatic = false;
    }

    render(title, content, cls);
    $target = $(`#${modalTarget}`);
  }

  function showModal() {
    $target.prepend(modalEl);
    bindUIActions();
  }

  return {
    createModal,
    showModal,
    closeModal
  };
};

export default modal();
