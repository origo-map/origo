import Component from './component';
import Collapse from './collapse';
import El from './element';
import Button from './button';
import { html, createStyle } from './dom/dom';

export default function Dropdown(options = {}) {
  const {
    cls = '',
    containerCls = 'bg-white',
    buttonCls = 'padding-small rounded light box-shadow',
    buttonIconCls = '',
    buttonContainerCls = '',
    style: styleSettings,
    direction = 'down',
    text = ' '
  } = options;

  let containerElement;
  let contentComponent;
  let headerComponent;
  let footerComponent;
  let dropdownButton;

  const style = createStyle(styleSettings);

  const selectItem = function selectItem(item) {
    const customEvt = new CustomEvent('dropdown:select', {
      bubbles: true
    });
    document.getElementById(item.getId()).dispatchEvent(customEvt);
    dropdownButton.dispatch('click');
  };

  const setButtonText = function setButtonText(buttonText) {
    document.getElementById(`${dropdownButton.getId()}`).getElementsByTagName('span')[1].innerHTML = buttonText;
  };

  const setItems = function setItems(listItems) {
    listItems.forEach((listItem) => {
      const itemEl = El({
        tagName: 'li',
        cls: 'o-dropdown-li',
        innerHTML: `<span>${listItem}</span>`
      });

      document.getElementById(contentComponent.getId()).appendChild(html(itemEl.render()));

      document.getElementById(itemEl.getId()).addEventListener('click', () => {
        selectItem(itemEl);
      });
    });
  };

  const toggle = function toggle() {
    const customEvt = new CustomEvent('collapse:toggle', {
      bubbles: true
    });
    document.getElementById(dropdownButton.getId()).dispatchEvent(customEvt);
  };

  return Component({
    setButtonText,
    setItems,
    onInit() {
      let position;

      dropdownButton = Button({
        text,
        cls: `${buttonCls} o-dropdown-button width-100`,
        click() {
          toggle();
        },
        style: {
          padding: '0 .5rem'
        },
        icon: `#ic_arrow_drop_${direction}_24px`,
        iconCls: `${buttonIconCls} icon-smaller flex`,
        textCls: 'flex'
      });

      if (direction === 'down') {
        position = 'top';
        headerComponent = El({
          cls: `${buttonContainerCls} collapse-header flex row justify-end`,
          components: [dropdownButton]
        });
      }

      if (direction === 'up') {
        position = 'bottom';
        footerComponent = El({
          cls: `${buttonContainerCls} collapse-header flex row justify-end`,
          components: [dropdownButton]
        });
      }

      contentComponent = Component({
        render() {
          return `<ul class="o-dropdown" id="${this.getId()}"></ul>`;
        }
      });

      containerElement = Collapse({
        cls: `${containerCls} absolute overflow-hidden`,
        contentCls: '',
        style: `${position}:0; border-radius: .625rem;`,
        collapseX: false,
        headerComponent,
        contentComponent,
        footerComponent
      });

      this.addComponent(containerElement);
    },
    onRender() {
      setButtonText(text);
      this.dispatch('render');
    },
    render() {
      return `<div id="${this.getId()}" class="${cls}" style="${style}">${containerElement.render()}</div>`;
    }
  });
}
