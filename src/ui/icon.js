import Component from './component';
import typeOfIcon from './utils/typeoficon';
import { createStyle, html } from './dom/dom';

export default function Icon(options = {}) {
  let {
    icon
  } = options;
  const {
    cls = '',
    title = '',
    style: styleOptions
  } = options;

  let iconType = typeOfIcon(icon);
  const style = createStyle(styleOptions);

  return Component({
    render() {
      if (iconType === 'image') {
        return `
          <img class="${cls}" style="${style}" src=${icon} title="${title}" alt="${title}">
        `;
      }
      if (iconType === 'sprite') {
        let titleEl = '';
        if (title) {
          titleEl = `
            <title>${title}</title>
            `;
        }
        return `
          <svg id="${this.getId()}" class="${cls}" style="${style}">${titleEl}
            <use xlink:href=${icon}></use>
          </svg>
        `;
      }
      if (iconType === 'svg' || iconType === 'img') {
        return icon;
      }
      return '';
    },
    update() {
      const el = document.getElementById(this.getId());
      if (el) {
        const newEl = html(this.render());
        el.parentNode.replaceChild(newEl, el);
      }
    },
    setIcon(newIcon) {
      iconType = typeOfIcon(newIcon);
      icon = newIcon;
      this.update();
    }
  });
}
