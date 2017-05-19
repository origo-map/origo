 "use strict";

var $ = require('jquery');
var utils = require('./utils');

module.exports = function(target, items, options) {
  var dataAttribute = 'data-' + options.dataAttribute || 'default';
  var $target = $('#' + target);
  var activeItem = options.active || undefined;
  var activeCls = 'o-active';
  var ul;
  var li = [];
  var cls = 'o-dropdown-li';
  var icon = utils.createSvg({
    href: '#ic_check_24px',
    cls: 'o-icon-24'
  });
  render();
  addListener();

  function render() {
    items.forEach(function(item, index) {
      var obj = {
        cls: cls
      };
      var active = utils.createElement('span', icon, {
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

  function addListener() {
    $target.on('click', 'ul', function(e) {
      var $active = $(e.target);
      $target.trigger({
        type: 'changeDropdown',
        dataAttribute: $(e.target).data(options.dataAttribute)
      });
      toggleActive($active);
    });
  }

  function toggleActive($active) {
    $target.find('li').removeClass(activeCls);
    $active.addClass(activeCls);
  }
};
