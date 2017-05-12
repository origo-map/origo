"use strict";

module.exports = function createForm(obj) {
  var id = obj.elId.slice(1);
  var cls = obj.cls || '';
  cls += id;
  cls += obj.isVisible ? "" : " o-hidden";
  var label = obj.title;
  var val = obj.isVisible ? obj.val : '';
  var type = obj.type;
  var maxLength = obj.maxLength ? ' maxlength="' + obj.maxLength + '" ' : '';
  var dropdownOptions = obj.options || [];
  var el;
  var checked;
  var firstOption;
  switch (type) {
    case 'text':
      el = '<div><label>' + label + '</label><br><input type="text" id="' + id + '" value="' + val + '"' + maxLength + '></div>';
      break;
    case 'textarea':
      el = '<div><label>' + label + '</label><br><textarea id="' + id + '"' + maxLength + 'rows="3">' + val + '</textarea></div>';
      break;
    case 'checkbox':
      checked = val ? ' checked' : '';
      el = '<div class="o-form-checkbox"><label>' + label + '</label><input type="checkbox" id="' + id + '" value="' + val + '"' + checked + '></div>';
      break;
    case 'dropdown':
      firstOption;
      if (val) {
        firstOption = '<option value="' + val + '" selected>' + val + '</option>';
      } else {
        firstOption = '<option value="" selected>Välj</option>';
      }
      el = '<div class="' + cls + '"><label>' + label + '</label><br><select id=' + id + '>' + firstOption;
      for (var i = 0; i < dropdownOptions.length; i++) {
        el += '<option value="' + dropdownOptions[i] + '">' + dropdownOptions[i] + '</option>';
      }
      el += '</select></div>';
      break;
  }
  return el;
}
