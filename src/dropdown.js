import $ from 'jquery';
import utils from './utils';

export default function dropDown(target, items, options) {
  const dataAttribute = `data-${options.dataAttribute}` || 'default';
  const $target = $(`#${target}`);
  const activeItem = options.active || undefined;
  const activeCls = 'o-active';
  let ul;
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
    $target.append(ul);
  }

  function toggleActive($active) {
    $target.find('li').removeClass(activeCls);
    $active.addClass(activeCls);
  }

  function addListener() {
    $target.on('click', 'ul', (e) => {
      const $active = $(e.target);
      $target.trigger({
        type: 'changeDropdown',
        dataAttribute: $(e.target).data(options.dataAttribute)
      });
      toggleActive($active);
    });
  }

  render();
  addListener();
}
