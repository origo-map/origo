import { Component, Button, Element as El, dom } from '../ui';
import utils from '../utils';

const Infowindow = function Infowindow(options = {}) {
  const {
    closeIcon = '#ic_close_24px',
    title = 'Inforuta',
    viewer,
    type = 'floating',
    contentComponent = El({
      tagName: 'div',
      cls: 'padding-y-small overflow-auto text-small'
    })
  } = options;
  let {
    isActive = false
  } = options;
  let headerComponent;
  let titleComponent;
  let infowindow;
  let iwEl;
  let closeButton;

  const toggle = function toggle() {
    iwEl.classList.toggle('faded');
    isActive = !isActive;
  };

  const close = function close() {
    if (isActive) {
      toggle();
    }
  };

  const changeContent = function changeContent(component, objTitle) {
    document.getElementById(titleComponent.getId()).innerHTML = objTitle || title;
    const contentEl = document.getElementById(contentComponent.getId());
    while (contentEl.hasChildNodes()) {
      contentEl.removeChild(contentEl.firstChild);
    }
    contentComponent.clearComponents();
    contentComponent.addComponent(component);
    if (!isActive) {
      toggle();
    }
    const el = dom.html(`<div id="${component.getId()}">${component.render()}</div>`);
    contentEl.appendChild(el);
    component.dispatch('render');
  };

  return Component({
    name: 'infowindow',
    close,
    changeContent,
    onAdd() {
      this.on('render', this.onRender);
      this.render();
    },
    onInit() {
      let iwElCls = isActive ? '' : ' faded';
      let iwElStyle = '';
      let hcElCls = '';

      switch (type) {
        case 'floating':
          hcElCls = ' draggable move';
          iwElStyle = 'top: 4rem; left: 4rem; max-height: calc(100% - (6rem))';
          break;
        case 'left':
          iwElCls += ' top-left no-margin height-full';
          break;
        default:
          hcElCls = ' draggable move';
          iwElStyle = 'top: 4rem; left: 4rem; max-height: calc(100% - (6rem))';
      }

      closeButton = Button({
        cls: 'small round margin-top-smaller margin-bottom-auto margin-right icon-smaller grey-lightest no-shrink o-tooltip',
        ariaLabel: 'Stäng',
        icon: closeIcon,
        click() {
          toggle();
        }
      });

      titleComponent = El({
        cls: 'flex row justify-start margin-y-smaller margin-left text-weight-bold',
        style: { width: '100%' },
        innerHTML: title
      });

      headerComponent = El({
        cls: `flex row justify-end grey-lightest${hcElCls}`,
        style: { width: '100%' },
        components: [titleComponent, closeButton]
      });

      infowindow = El({
        cls: `absolute flex column control bg-white overflow-hidden z-index-top no-select${iwElCls}`,
        style: iwElStyle,
        collapseX: true,
        components: [headerComponent, contentComponent]
      });

      this.addComponent(infowindow);
    },
    render() {
      const newEl = dom.html(infowindow.render());
      document.getElementById(viewer.getMain().getId()).appendChild(newEl);
      iwEl = document.getElementById(infowindow.getId());
      utils.makeElementDraggable(iwEl);
      this.dispatch('render');
    }
  });
};

export default Infowindow;
