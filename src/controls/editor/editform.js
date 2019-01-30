const createForm = function createForm(obj) {
  const id = obj.elId.slice(1);
  let cls = obj.cls || '';
  cls += id;
  cls += obj.isVisible ? '' : ' o-hidden';
  const label = obj.title;
  let val = obj.isVisible ? obj.val : '';
  const type = obj.type;
  const maxLength = obj.maxLength ? ` maxlength="${obj.maxLength}" ` : '';
  const dropdownOptions = obj.options || [];
  const today = new Date();
  const isoDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString();
  let el;
  let checked;
  let firstOption;
  switch (type) {
    case 'text':
      el = `<div><label>${label}</label><br><input type="text" id="${id}" value="${val}" ${maxLength}></div>`;
      break;
    case 'textarea':
      el = `<div><label>${label}</label><br><textarea id="${id}" ${maxLength} rows="3">${val}</textarea></div>`;
      break;
    case 'checkbox':
      checked = val ? ' checked' : '';
      el = `<div class="o-form-checkbox"><label>${label}</label><input type="checkbox" id="${id}" value="${val}"${checked}></div>`;
      break;
    case 'dropdown':
      if (val) {
        firstOption = `<option value="${val}" selected>${val}</option>`;
      } else {
        firstOption = '<option value="" selected>Välj</option>';
      }
      el = `<div class="${cls}"><label>${label}</label><br><select id=${id}>${firstOption}`;
      for (let i = 0; i < dropdownOptions.length; i += 1) {
        el += `<option value="${dropdownOptions[i]}">${dropdownOptions[i]}</option>`;
      }
      el += '</select></div>';
      break;
    case 'image': {
      const imageClass = val ? '' : 'o-hidden';
      el = `<div class="${cls}"><label>${label}</label><br>`;
      el += `<img src="${val}" id="image-upload" class="${imageClass}"/>`;
      el += `<input type="file" id="${id}" value="${val}" accept="image/*">`;
      el += `<input id="o-delete-image-button" class="${imageClass}" type="button" value="Ta bort bild">`;
      el += '</div>';
      break;
    }
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
      el = `<div><label>${label}</label><br><input type="date" id="${id}" placeholder="YYYY-MM-DD" value="${val}"></div>`;
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
      el = `<div><label>${label}</label><br><input type="datetime-local" id="${id}" placeholder="YYYY-MM-DDThh:mm" value="${val}"></div>`;
      break;
    case 'color':
      if (!val) {
        val = obj.defaultColor ? obj.defaultColor : '';
      }
      el = `<div><label>${label}</label><br><input type="color" id="${id}" value="${val}"></div>`;
      break;
    default:
      break;
  }
  return el;
};

export default createForm;
