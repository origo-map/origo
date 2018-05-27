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
  var today = new Date(); 
  var isoDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString();
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
    case 'image':
      var imageClass = val ? '' : 'o-hidden';
      el = '<div class="' + cls + '"><label>' + label + '</label><br>';
      el += '<img src="' + val + '" id="image-upload" class="' + imageClass + '"/>';
      el += '<input type="file" id="' + id + '" value="' + val + '" accept="image/*">';
      el += '<input id="o-delete-image-button" class="' + imageClass + '" type="button" value="Ta bort bild">';
      el += '</div>';
      break;
    case 'date':
      if (!val) {
        if (obj.defaultDate === false) {
          val = '';
        } else if (obj.defaultDate) {
          val = obj.defaultDate;
        } else {
          val = isoDate.slice(0, 10);
        }
      }
      el = '<div><label>' + label + '</label><br><input type="date" id="' + id + '" placeholder="YYYY-MM-DD" value="' + val + '"></div>';
      break;
    case 'datetime':
      if (!val) {
        if (obj.defaultDatetime === false) {
          val = '';
        } else if (obj.defaultDatetime) {
          val = obj.defaultDatetime;
        } else {
          val = isoDate.slice(0, 16);
        }
      }
      el = '<div><label>' + label + '</label><br><input type="datetime-local" id="' + id + '" placeholder="YYYY-MM-DDThh:mm" value="' + val + '"></div>';
      break;
    case 'color':
      if (!val) {
        val = obj.defaultColor ? obj.defaultColor : '';
      }
      el = '<div><label>' + label + '</label><br><input type="color" id="' + id + '" value="' + val + '"></div>';
      break;
  }
  return el;
}
