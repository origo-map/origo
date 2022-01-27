import Component from './component';
import Button from './button';
import { createStyle } from './dom/dom';

/**
 * Header component to be used with the collapse component.
 * By clicking on the header a collapse event is triggered,
 * which the collapse component listens to.
 */
export default function CollapseHeader(options = {}) {
  const {
    cls = '',
    icon = '#ic_chevron_right_24px',
    style: styleSettings,
    title = 'Title'
  } = options;

  const style = createStyle(styleSettings);
  const collapseEvent = 'collapse:toggle';

  const headerButton = Button({
    cls: 'icon-small compact round',
    icon,
    iconCls: 'rotate grey',
    style: {
      'align-self': 'flex-end'
    }
  });

  const titleCmp = Component({
    render() {
      return `<span id="${this.getId()}" class="grow">${title}</span>`;
    }
  });

  return Component({
    onInit() {
      this.addComponents([headerButton, titleCmp]);
    },
    onRender() {
      this.dispatch('render');
      const el = document.getElementById(this.getId());
      el.addEventListener('click', () => {
        const customEvt = new CustomEvent(collapseEvent, {
          bubbles: true
        });
        el.blur();
        el.dispatchEvent(customEvt);
      });
    },
    render: function render() {
      return `<div id="${this.getId()}" class="${cls} flex row align-center pointer collapse-header" id="${this.getId()}" style="${style}">
                ${titleCmp.render()}
                ${headerButton.render()}
              </div>`;
    }
  });
}
