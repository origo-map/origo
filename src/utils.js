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
  createInput: function(options) {
    /**
     *
     * @type {Object}
     * cls: Class for the outermost div
     * iconCls : Class for the SVG icon if any
     * id: The ID for the outermost containing div. It is used to scope the rest of the classes as well
     * includeDropdown: Whether the input element should have an associated dropdown list. If true then one needs to provide listOptions
     * listOptions: The options for the dropdown list. It should be an array of objects with the keys "text" and "value", e.g., {text: "MyTest", value: "MyValue"}
     * src: The ID of the SVG in question. The SVG file needs to have been imported using the svgSprites property in OrigoConfig
     * tooltipPlacement: Where the tooltip will show. Presumed to be "north", "east", "south", "west"
     * tooltipText: The text for the tooltip.
     * val: The initial value of the input field
     */

    var tooltip = '';
    var text = '';
    var cls = options.cls || '';
    var iconCls = options.iconCls || '';
    var placement = options.tooltipPlacement || 'east';
    if (options.text) {
      text = '<span class="o-input-icon">' + options.text + '</span>';
    }
    if (options.tooltipText) {
      tooltip = '<span data-tooltip="' + options.tooltipText + '" data-placement="' + placement + '"></span>';
    }
    var el = '<div id="' + options.id + '" class="o-button-container o-tooltip">' +
      '<input id="' + (options.id + '-input') + '" class="o-input ' + cls + '" value="' + options.val + '" />';
    if (options.includeDropdown) {
      var listOptions = '';
      //Add dropdown icon with downward-facing caret
      el = el +
        '<div class="o-svg-container">' +
        '<svg class="o-icon-fa-home ' + iconCls + '">' +
        '<use xlink:href="' + options.src + '"></use>' +
        '</svg>' +
        '</div>';

      //Create options list
      if (options.listOptions) {
        options.listOptions.forEach(function(listOption) {
          listOptions = listOptions +
            '<li data-value="' + listOption.value + '">' + listOption.text + '</li>';
        });
      }
      //Add container for dropdown list icon with downward-facing caret
      el = el +
        '<div class="o-input-dropdown-list">' +
        '<ul>' +
        listOptions +
        '</ul>' +
        '</div>';
    }
    el = el +
      tooltip +
      '</div>';

    return el;
  },
};
