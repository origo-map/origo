 "use strict";

var $ = require('jquery');
var createElement = require('./utils')['createElement'];

module.exports = function(target, items, options) {
  var dataAttribute = 'data-' + options.dataAttribute || 'default';
  var $target = $('#' + target);
  var ul;
  var li = [];
  var cls = 'o-dropdown-menu';
  items.forEach(function(item, index) {
    var obj = {
      cls: cls
    };
    obj[dataAttribute] = item.value;
    li[index] = createElement('li', item.name, obj);
  });
  ul = createElement('ul', li.join(''), {});
  $target.append(ul);
  $target.on('click', 'ul', function(e) {
    var $active = $(e.target);
    $.event.trigger({
      type: 'changeDropdown',
      dataAttribute: $(e.target).data(options.dataAttribute)
    });
    toggleActive($active);
  });

  function toggleActive($active) {
    $target.find('li').removeClass('o-active');
    $active.addClass('o-active');
  }
};
