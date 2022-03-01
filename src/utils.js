export default {
  createButton(options) {
    let tooltip = '';
    let text = '';
    const cls = options.cls || '';
    const iconCls = options.iconCls || '';
    const placement = options.tooltipPlacement || 'east';
    if (options.text) {
      text = `<span class="o-button-text">${options.text}</span>`;
    }
    if (options.tooltipText) {
      tooltip = `<span data-tooltip="${options.tooltipText}" data-placement="${placement}"></span>`;
    }
    const el = `<div id="${options.id}" class="o-button-container o-tooltip">
      <button class="o-button ${cls}">${text}
      <svg class="${iconCls}">
      <use xlink:href="${options.src}"></use>
      </svg>
      </button>
      ${tooltip}
      </div>`;
    return el;
  },
  createListButton(options) {
    const el = `<li>
      <div id="${options.id}-button" class="o-menu-button">
      <div class="o-button-icon">
      <svg class="${options.iconCls}">
      <use xlink:href="${options.src}"></use>
      </svg>
      </div>
      ${options.text}
      </div>
      </li>`;
    return el;
  },
  createElement(el, val, attributes) {
    const prefix = `<${el}`;
    const suffix = `</${el}>`;
    const attributeNames = attributes ? Object.getOwnPropertyNames(attributes) : [];
    const attributeList = attributeNames.map((name) => {
      let res = '';
      if (name === 'cls') {
        res = ` ${'class'.concat('=', '"', attributes[name], '"')}`;
      } else {
        res = ` ${name.concat('=', '"', attributes[name], '"')}`;
      }
      return res;
    });
    const element = prefix.concat(attributeList.join(' '), '>', val, suffix);
    return element;
  },
  createSvg(props) {
    const use = this.createElement('use', '', {
      'xlink:href': props.href
    });
    return this.createElement('svg', use, {
      cls: props.cls
    });
  },
  makeElementDraggable(el) {
    const touchMode = 'ontouchstart' in document.documentElement;
    const elmnt = el;
    let pos1 = 0;
    let pos2 = 0;
    let pos3 = 0;
    let pos4 = 0;

    function elementDrag(evt) {
      const e = evt || window.event;
      e.preventDefault();

      const clientX = e.clientX === undefined ? e.touches[0].clientX : e.clientX;
      const clientY = e.clientY === undefined ? e.touches[0].clientY : e.clientY;
      pos1 = pos3 - clientX;
      pos2 = pos4 - clientY;
      pos3 = clientX;
      pos4 = clientY;

      elmnt.style.top = `${elmnt.offsetTop - pos2}px`;
      elmnt.style.left = `${elmnt.offsetLeft - pos1}px`;
    }

    function closeDragElement() {
      elmnt.classList.toggle('grabbing');

      if (touchMode) {
        elmnt.ontouchend = null;
        elmnt.ontouchmove = null;
      } else {
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }

    function dragMouseDown(evt) {
      const e = evt || window.event;
      elmnt.classList.toggle('grabbing');
      pos3 = e.clientX;
      pos4 = e.clientY;

      if (touchMode) {
        elmnt.ontouchend = closeDragElement;
        elmnt.ontouchmove = elementDrag;
      } else {
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
      }
    }

    if (touchMode) {
      elmnt.ontouchstart = dragMouseDown;
    } else {
      elmnt.onmousedown = dragMouseDown;
    }
  }
};

export { default as slugify } from './utils/slugify';
export { default as exportToFile } from './utils/exporttofile';
