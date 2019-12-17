const createForm = function createForm(obj) {
  const id = obj.elId.slice(1);
  let cls = obj.cls || '';
  cls += id;
  cls += obj.isVisible ? '' : ' o-hidden';
  const label = obj.title;
  let val = obj.isVisible && obj.val != null ? obj.val : '';
  const type = obj.type;
  const maxLength = obj.maxLength ? ` maxlength="${obj.maxLength}"` : '';
  const dropdownOptions = obj.options || [];
  const today = new Date();
  const isoDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString();
  const readonly = obj.readonly ? ' readonly' : '';
  const disabled = obj.readonly ? ' disabled' : '';
  let el;
  let checked;
  let firstOption;
  switch (type) {
    case 'text':
      el = `<div><label>${label}</label><br><input type="text" id="${id}" value="${val}"${maxLength}${readonly}></div>`;
      break;
    case 'textarea':
      el = `<div><label>${label}</label><br><textarea id="${id}" rows="3"${maxLength}${readonly}>${val}</textarea></div>`;
      break;
    case 'checkbox':
      checked = val ? ' checked' : '';
      el = `<div class="o-form-checkbox"><label>${label}</label><input type="checkbox" id="${id}" value="${val}"${checked}${disabled}></div>`;
      break;
    case 'dropdown':
      if (val) {
        firstOption = `<option value="${val}" selected>${val}</option>`;
      } else {
        firstOption = '<option value="" selected>Välj</option>';
      }
      el = `<div class="${cls}"><label>${label}</label><br><select id=${id}${disabled}>${firstOption}`;
      for (let i = 0; i < dropdownOptions.length; i += 1) {
        el += `<option value="${dropdownOptions[i]}">${dropdownOptions[i]}</option>`;
      }
      el += '</select></div>';
      break;
    case 'image': {
      const imageClass = val ? '' : 'o-hidden';
      el = `<div class="${cls}"><label>${label}</label><br>`;
      el += `<img src="${val}" id="image-upload" class="${imageClass}"/>`;
      el += `<input type="file" name="bildfil" id="${id}" value="${val}" accept="image/*"${disabled}>`;
      el += `<input id="o-delete-image-button" class="${imageClass}" type="button" value="Ta bort bild"${disabled}>`;
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
      el = `<div><label>${label}</label><br><input type="date" name="datum" id="${id}" placeholder="ÅÅÅÅ-MM-DD" value="${val}"${readonly}></div>`;
      break;
    case 'time':
      if (!val) {
        if (obj.defaultTime === false) {
          val = '';
        } else if (obj.defaultTime) {
          val = obj.defaultTime;
        } else {
          val = isoDate.slice(11, 16);
        }
      }
      el = `<div><label>${label}</label><br><input type="time" name="timmar och minuter" id="${id}" placeholder="tt:mm" value="${val}"${readonly}></div>`;
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
      el = `<div><label>${label}</label><br><input type="datetime-local" name="datum och tid" id="${id}" placeholder="ÅÅÅÅ-MM-DDTtt:mm" value="${val}"${readonly}></div>`;
      break;
    case 'color':
      if (!val) {
        val = obj.defaultColor ? obj.defaultColor : '';
      }
      el = `<div><label>${label}</label><br><input type="color" name="hexadecimal" id="${id}" value="${val}"${readonly}></div>`;
      break;
    case 'email':
      el = `<div><label>${label}</label><br><input type="email" name="epost" id="${id}" value="${val}"${readonly}></div>`;
      break;
    case 'url':
      el = `<div><label>${label}</label><br><input type="url" name="hemsida" id="${id}" value="${val}"${readonly}></div>`;
      break;
    case 'integer':
      el = `<div><label>${label}</label><br><input type="number" step="1" min="0" name="heltal" id="${id}" value="${val}"${readonly}></div>`;
      break;
    case 'decimal':
      el = `<div><label>${label}</label><br><input type="number" step="0.01" min="0" name="decimaltal" id="${id}" value="${val}"${readonly}></div>`;
      break;
    case 'hidden':
      el = `<input type="hidden" id="${id}" value="${val}">`;
      break;
    default:
      break;
  }
  return el;
};

export default createForm;
