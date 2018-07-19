import $ from 'jquery';

const modal = function modal() {
  let isStatic;
  let $target;
  let modalEl;
  let extLink;

  function closeModal() {
    $('#o-modal').remove();
  }

  function render(title, content, cls, target) {
    modalEl = `<div id="o-modal" class="${cls}">
                <div class="o-modal-screen"></div>`;
    if (target === 'iframe') {
      modalEl += `<div class="o-modal-full"><div class="o-close-button"><svg class="o-icon-fa-times"><use xlink:href="#fa-times"></use></svg></div>
      <div class="o-external-link-button"><svg class="o-icon-fa-times"><use xlink:href="#fa-external-link"></use></svg></div>`;
      extLink = content;
    } else {
      modalEl += `<div class="o-modal">
                    <div class="o-close-button"><svg class="o-icon-fa-times"><use xlink:href="#fa-times"></use></svg></div>`;
    }
    modalEl += `<div class="o-modal-title">${title}</div>`;
    if (target === 'iframe') {
      modalEl += `<iframe src="${content}" class="o-modal-content-full"></iframe>`;
    } else {
      modalEl += `<div class="o-modal-content">${content}</div>`;
    }
    modalEl += `</div>
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
    if (extLink) {
      $('.o-external-link-button').click(() => {
        window.open(extLink, '_blank');
      });
    }
  }

  function createModal(modalTarget, options) {
    const title = options.title || '';
    const content = options.content || '';
    const cls = options.cls || '';
    const target = options.target || '';
    if (Object.prototype.hasOwnProperty.call(options, 'static')) {
      isStatic = options.static;
    } else {
      isStatic = false;
    }

    render(title, content, cls, target);
    $target = $(modalTarget);
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
