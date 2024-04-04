import { Icon, Component, Modal } from '../ui';

let viewer;
let defaults = {
  toaster: {
    status: 'light',
    title: 'Meddelande',
    duration: 5000
  },
  modal: {
    status: 'light',
    title: 'Meddelande',
    duration: 0
  }
};

function getClass(status) {
  let cls;
  if (status === 'primary') {
    cls = 'logger-primary';
  } else if (status === 'success') {
    cls = 'logger-success';
  } else if (status === 'info') {
    cls = 'logger-info';
  } else if (status === 'warning') {
    cls = 'logger-warning';
  } else if (status === 'danger') {
    cls = 'logger-danger';
  } else {
    cls = 'logger-light';
  }
  return cls;
}

const createModal = function createModal(options) {
  const modalSettings = { ...defaults.modal, ...options };
  const {
    title = '',
    message = '',
    duration,
    status
  } = modalSettings;
  const contentCls = getClass(status);

  let modal = Modal({
    title,
    content: message,
    target: viewer.getId(),
    contentCls
  });

  if (duration && duration > 0) {
    setTimeout(() => {
      modal.closeModal();
      modal = null;
    }, duration);
  }
};

const createToaster = function createToaster(options = {}) {
  const toasterSettings = { ...defaults.toaster, ...options };
  const {
    status,
    duration,
    icon,
    title = '',
    message = ''
  } = toasterSettings;

  const toaster = document.createElement('div');
  const parentElement = document.getElementById(viewer.getId());
  parentElement.appendChild(toaster);
  toaster.classList.add('toaster');
  const contentCls = getClass(status);
  toaster.classList.add(contentCls);

  const content = `
  <div>
  <span class="padding-0 icon">
  ${icon ? Icon({ icon, cls: `${contentCls} icon-medium`, style: 'vertical-align:bottom' }).render() : ''}
  </span>
  <span class="margin-y-smaller text-weight-bold text-large">${title}</span>
  </div>
  <span>${message}</span>
  `;
  toaster.innerHTML = content;

  setTimeout(() => {
    toaster.parentNode.removeChild(toaster);
  }, duration > 0 ? duration : 5000);
};

const Logger = function Logger(options = {}) {
  defaults = { ...defaults, ...options };
  return Component({
    name: 'logger',
    createModal,
    createToaster,
    onAdd(evt) {
      viewer = evt.target;
      this.render();
    },
    render() {
      this.dispatch('render');
    }
  });
};

export default Logger;
