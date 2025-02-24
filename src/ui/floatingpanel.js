import Component from './component';
import El from './element';
import Button from './button';
import { html } from './dom/dom';
import utils from '../utils';

const FloatingPanel = function FloatingPanel(options = {}) {
  const {
    closeIcon = '#ic_close_24px',
    title = 'Inforuta',
    viewer,
    type = 'floating',
    removeOnClose = false,
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
  let floatingPanel;
  let fpEl;
  let fpCmp;
  let closeButton;

  const hide = function hide() {
    fpEl?.classList.add('faded');
    fpCmp?.dispatch('hide');
    isActive = false;
  };

  const show = function show() {
    fpEl?.classList.remove('faded');
    fpCmp?.dispatch('show');
    isActive = true;
  };

  const remove = function remove() {
    fpEl?.parentNode.removeChild(fpEl);
    fpCmp?.dispatch('remove');
  };

  const getContentElement = function getContentElement() {
    return document.getElementById(contentComponent.getId());
  };

  const changeContent = function changeContent(component, objTitle) {
    document.getElementById(titleComponent.getId()).innerHTML = objTitle || title;
    const contentEl = document.getElementById(contentComponent.getId());
    while (contentEl.hasChildNodes()) {
      contentEl.removeChild(contentEl.firstChild);
    }
    contentComponent.clearComponents();
    contentComponent.addComponent(component);
    const el = html(`<div id="${component.getId()}">${component.render()}</div>`);
    contentEl.appendChild(el);
    component.dispatch('render');
  };

  return Component({
    name: 'floatingPanel',
    hide,
    show,
    remove,
    getStatus() { return isActive; },
    changeContent,
    getContentElement,
    onAdd() {
      this.render();
    },
    onInit() {
      fpCmp = this;
      let fpElCls = isActive ? '' : ' faded';
      let fpElStyle = '';
      let hcElCls = '';

      switch (type) {
        case 'floating':
          hcElCls = ' draggable move';
          fpElStyle = 'top: 4rem; left: 4rem; max-height: calc(100% - (6rem))';
          break;
        case 'left':
          fpElCls += ' top-left no-margin height-full';
          break;
        default:
          hcElCls = ' draggable move';
          fpElStyle = 'top: 4rem; left: 4rem; max-height: calc(100% - (6rem))';
      }

      closeButton = Button({
        cls: 'small round margin-top-small margin-right-small icon-smaller grey-lightest o-tooltip',
        ariaLabel: 'Stäng',
        icon: closeIcon,
        click() {
          if (removeOnClose) {
            remove();
          } else {
            hide();
          }
        }
      });

      titleComponent = El({
        cls: 'flex row justify-start margin-top-small margin-left text-weight-bold padding-right',
        style: { width: '100%' },
        innerHTML: title
      });

      headerComponent = El({
        cls: `flex row justify-end grey-lightest${hcElCls}`,
        style: { width: '100%' },
        components: [titleComponent, closeButton]
      });

      floatingPanel = El({
        cls: `absolute flex column control bg-white overflow-hidden z-index-top no-select${fpElCls}`,
        style: fpElStyle,
        collapseX: true,
        components: [headerComponent, contentComponent]
      });

      this.addComponent(floatingPanel);
    },
    render() {
      if (document.getElementById(floatingPanel.getId())) {
        console.error('Already rendered');
      } else {
        const newEl = html(floatingPanel.render());
        document.getElementById(viewer.getMain().getId()).appendChild(newEl);
        fpEl = document.getElementById(floatingPanel.getId());
        utils.makeElementDraggable(fpEl);
        this.dispatch('render');
      }
    }
  });
};

export default FloatingPanel;
