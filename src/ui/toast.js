import { Button, Component, dom, Icon } from '../ui';

export default function Toast(options = {}) {
  const { target, duration = 3000, title = '', message = '', status = 'success', icon = '#ic_check_24px', closeIcon = '#ic_close_24px' } = options;

  let toast;
  let toastElement;
  let closeBtnComponent;
  let iconComponent;

  function getStatusClass(_status) {
    switch (_status) {
      case 'success':
        return 'o-toast-success';
      case 'error':
        return 'o-toast-error';
      case 'warning':
        return 'o-toast-warning';
      default:
        return 'o-toast-info';
    }
  }

  function getStatusIcon(_status) {
    switch (_status) {
      case 'success':
        return '#ic_check_24px';
      case 'error':
        return '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>';
      case 'warning':
        return '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m40-120 440-760 440 760H40Zm138-80h604L480-720 178-200Zm302-40q17 0 28.5-11.5T520-280q0-17-11.5-28.5T480-320q-17 0-28.5 11.5T440-280q0 17 11.5 28.5T480-240Zm-40-120h80v-200h-80v200Zm40-100Z"/></svg>';
      default:
        return '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M440-280h80v-240h-80v240Zm40-320q17 0 28.5-11.5T520-640q0-17-11.5-28.5T480-680q-17 0-28.5 11.5T440-640q0 17 11.5 28.5T480-600Zm0 520q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>';
    }
  }

  function create() {
    // Render and add the toast element to the parent, hidden by default
    const targetElement = document.getElementById(target.getId());
    targetElement.appendChild(dom.html(toast.render()));
    toastElement = document.getElementById(toast.getId());
    toastElement.classList.toggle('o-hidden', true);

    toast.dispatch('render'); // Tell our children that we have rendered
  }

  function remove() {
    toastElement.parentNode.removeChild(toastElement);
  }

  function hide() {
    toastElement.classList.remove('fade-in');
    toastElement.classList.toggle('fade-out', true);
    setTimeout(
      () => {
        remove();
      },
      250 // This should smaller than the fade-out duration
    );
  }

  function show() {
    create();
    toastElement.classList.toggle('o-hidden', false);
    toastElement.classList.toggle('fade-in', true);
    // Set up timeout to close the toast after duration
    setTimeout(() => {
      hide();
    }, duration);
  }

  function onInit() {
    toast = this; // Save a reference to ourself (Better way?)
    closeBtnComponent = Button({
      cls: 'btn-close',
      icon: closeIcon,
      click() {
        hide();
      }
    });

    iconComponent = icon ? Icon({
      icon: getStatusIcon(status),
      cls: 'o-toast-icon'
    }) : '';

    this.addComponent(closeBtnComponent);
    this.addComponent(iconComponent);

    // this.dispatch('render'); // Beacuse we create our toast on demand we need to dispatch render when we create the toast
  }

  function onRender() {
    // Called after the component have been rendered by it's parent so we can hook on event listeners
    console.log('onRender');
  }

  function render() {
    return `<div id="${this.getId()}" role="alert" class="o-ui o-toast ${getStatusClass(status)}">
                <div class="wrapper">
                    <span class="icon">
                        ${iconComponent.render()}
                    </span>

                    <div class="title-content">
                        <strong class="title">${title}</strong>
                        <p class="description">${message}</p>
                    </div>
                    ${closeBtnComponent.render()}                    
                </div>
            </div>`;
  }

  return Component({
    remove,
    hide,
    show,
    onInit,
    // onAdd,
    render,
    onRender
  });
}
