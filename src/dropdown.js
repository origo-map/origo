import utils from './utils';
import { dom } from './ui';

export default function dropDown(target, items, options) {
  const dataAttribute = `data-${options.dataAttribute}` || 'default';
  const targetEl = document.getElementById(target);
  const activeItem = options.active || undefined;
  const activeCls = 'o-active';
  let ul;
  let dropdownEvent;
  const li = [];
  const cls = 'o-dropdown-li';
  const icon = utils.createSvg({
    href: '#ic_check_24px',
    cls: 'o-icon-24'
  });

  function render() {
    items.forEach((item, index) => {
      const obj = {
        cls
      };
      const active = utils.createElement('span', icon, {
        cls: 'o-icon'
      });
      obj[dataAttribute] = item.value;
      if (item.value === activeItem) {
        obj.cls = activeCls;
      }
      li[index] = utils.createElement('li', item.name + active, obj);
    });
    ul = utils.createElement('ul', li.join(''), {
      cls: 'o-dropdown'
    });

    targetEl.appendChild(dom.html(ul));
  }

  function toggleActive(activeEl) {
    targetEl.querySelector(`li.${activeCls}`).classList.remove(activeCls);
    activeEl.classList.add(activeCls);
  }

  function addListener() {
    targetEl.getElementsByTagName('ul').item(0).addEventListener('click', (e) => {
      const activeEl = e.target;
      dropdownEvent = new CustomEvent('changeDropdown', {
        detail: {
          type: 'changeDropdown',
          dataAttribute: e.target.dataset[options.dataAttribute]
        }
      });
      targetEl.dispatchEvent(dropdownEvent);

      toggleActive(activeEl);
    });
  }

  /**
   * Marks the provided value as selected. Does NOT fire the changeDropdown event as it is assumed that caller controls this control and
   * already knows what to do.
   * @param {any} value
   */
  function select(value) {
    const optionslist = targetEl.getElementsByTagName('ul').item(0).getElementsByTagName('li');
    const length = optionslist.length;
    for (let ix = 0; ix < length; ix += 1) {
      if (optionslist.item(ix).attributes[dataAttribute].value === value) {
        toggleActive(optionslist.item(ix));
      }
    }
  }

  render();
  addListener();

  return {
    select
  };
}
