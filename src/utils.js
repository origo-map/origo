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
  }
};
