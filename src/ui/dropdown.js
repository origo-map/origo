import Component from './component';
import Collapse from './collapse';
import El from './element';
import Button from './button';
import { html, createStyle } from './dom/dom';

export default function Dropdown(options = {}) {
  const {
    cls = '',
    containerCls = 'collapse-container',
    contentCls = 'bg-white',
    contentStyle = '',
    buttonCls = 'padding-small rounded light box-shadow',
    buttonIconCls = '',
    buttonContainerCls = '',
    style: styleSettings,
    direction = 'down',
    ariaLabel = '',
    buttonTextCls = 'flex'
  } = options;
  let {
    text = ' ',
    items = []
  } = options;

  let containerElement;
  let contentComponent;
  let headerComponent;
  let footerComponent;
  let dropdownButton;

  const style = createStyle(styleSettings);

  const selectItem = function selectItem(itemEl, doClick = true) {
    const value = document.getElementById(itemEl.getId()).getAttribute('data-value');
    const customEvt = new CustomEvent('dropdown:select', {
      bubbles: true,
      detail: JSON.parse(value) // Pass the value in the event detail
    });
    document.getElementById(itemEl.getId()).dispatchEvent(customEvt);
    if (doClick) dropdownButton.dispatch('click');
  };

  const setButtonText = function setButtonText(buttonText) {
    text = buttonText;
    document.getElementById(`${dropdownButton.getId()}`).getElementsByTagName('span')[1].innerHTML = text;
  };

  const getItems = function getItems() {
    const contentCmps = contentComponent.getComponents();
    if (contentCmps) return contentCmps;
    return false;
  };

  const setItems = function setItems(listItems) {
    // Check if listItems are strings (or numbers) and if so then convert them to objects for backward compatibility
    items = listItems.map(item => {
      if (typeof item === 'string') {
        return { label: item, value: item };
      }
      if (typeof item === 'number') {
        return { label: item, value: item };
      }
      return item;
    });

    const contentEl = document.getElementById(contentComponent.getId());
    if (contentEl) {
      contentComponent.clearComponents();
      contentEl.replaceChildren();
      items.forEach((listItem) => {
        const itemEl = El({
          tagName: 'li',
          innerHTML: `<span>${listItem.label}</span>`, // Use label for display
          attributes: { data: { value: JSON.stringify(listItem.value) } } // Employ the data prop for the value (will become a data-value attribute)
        });
        contentComponent.addComponent(itemEl);
        contentEl.appendChild(html(itemEl.render()));
        document.getElementById(itemEl.getId()).addEventListener('click', () => {
          selectItem(itemEl);
        });
      });
    }
  };

  const toggle = function toggle() {
    const customEvt = new CustomEvent('collapse:toggle', {
      bubbles: true
    });
    document.getElementById(dropdownButton.getId()).dispatchEvent(customEvt);
  };

  return Component({
    setButtonText,
    getItems,
    setItems,
    selectItem,
    toggle,
    onInit() {
      let position;

      dropdownButton = Button({
        text,
        cls: `${buttonCls}`,
        click() {
          toggle();
        },
        style: {
          padding: '0 .5rem',
          overflow: 'hidden'
        },
        icon: `#ic_arrow_drop_${direction}_24px`,
        iconCls: `${buttonIconCls} icon-smaller flex`,
        ariaLabel,
        textCls: buttonTextCls
      });

      if (direction === 'down') {
        position = 'top';
        headerComponent = El({
          cls: `${buttonContainerCls} collapse-header`,
          components: [dropdownButton]
        });
      }

      if (direction === 'up') {
        position = 'bottom';
        footerComponent = El({
          cls: `${buttonContainerCls} collapse-header`,
          components: [dropdownButton]
        });
      }

      contentComponent = Component({
        render() {
          return `<ul id="${this.getId()}"></ul>`;
        }
      });

      containerElement = Collapse({
        cls: 'dropdown',
        containerCls,
        contentCls: `${contentCls}`,
        contentStyle: `${position}:calc(100% + 2px);${contentStyle}`,
        collapseX: false,
        headerComponent,
        contentComponent,
        footerComponent
      });

      this.addComponent(containerElement);
    },
    onRender() {
      setButtonText(text);
      setItems(items);
      this.dispatch('render');
    },
    render() {
      return `<div id="${this.getId()}" class="${cls} relative" style="${style}">${containerElement.render()}</div>`;
    }
  });
}
