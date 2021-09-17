const createForm = function createForm(obj) {
  const id = obj.elId;
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
  const elDiv = document.createElement('div');
  const elLabel = document.createElement('label');
  const elInput = document.createElement('input');
  const elButton = document.createElement('button');
  const elSpan = document.createElement('span');
  const readonly = obj.readonly ? ' readonly' : '';
  const disabled = obj.readonly ? ' disabled' : '';
  const required = obj.required ? ' required' : '';
  const name = obj.name ? obj.name : '';
  let el;
  let checked;
  let firstOption;
  const maxLengthText = maxLength ? `, max ${obj.maxLength} tecken` : '';
  switch (type) {
    case 'text':
      el = `<div class="validate ${cls}"><label>${label}</label><br><input type="text" name="text${maxLengthText}" id="${id}" value="${val}"${maxLength}${readonly}${required}></div>`;
      break;
    case 'textarea':
      el = `<div class="validate ${cls}"><label>${label}</label><br><textarea name="textarea${maxLengthText}" id="${id}" rows="3" ${maxLength}${readonly}${required}>${val}</textarea></div>`;
      break;
    case 'checkbox':
      checked = val ? ' checked' : '';
      el = `<div class="o-form-checkbox ${cls}"><label for="${id}">${label}</label><input type="checkbox" id="${id}" value="${val}"${checked}${disabled}></div>`;
      break;
    case 'dropdown':
      if (val) {
        firstOption = `<option value="${val}">${val}</option>`;
      } else {
        firstOption = '<option value="">Välj</option>';
      }
      el = `<div class="${cls}"><label>${label}</label><br><select id=${id}${disabled}>${firstOption}`;
      for (let i = 0; i < dropdownOptions.length; i += 1) {
        el += `<option value="${dropdownOptions[i]}">${dropdownOptions[i]}</option>`;
      }
      el += '</select></div>';
      break;
    case 'searchList':
      elDiv.id = obj.type;
      elLabel.innerHTML = label;
      elLabel.appendChild(document.createElement('br'));

      elDiv.setAttribute('class', `validate ${cls}`);
      elInput.setAttribute('id', id);
      elInput.setAttribute('name', name);
      elInput.setAttribute('type', 'searchList-input');
      elInput.setAttribute('class', 'awesomplete');
      elInput.setAttribute('o-list', `${JSON.stringify(obj.list)}`);
      elInput.setAttribute('o-config', `${JSON.stringify(obj.config || {})}`);
      elInput.setAttribute('maxlength', maxLength || 50);
      elInput.setAttribute('value', val);
      if (required) {
        elInput.setAttribute('required', required);
      }

      elButton.setAttribute('class', `dropdown-btn ${id}`);
      elButton.setAttribute('type', 'searchList-button');
      elSpan.setAttribute('class', 'caret');
      elButton.insertAdjacentElement('afterbegin', elSpan);

      elDiv.insertAdjacentElement('afterbegin', elLabel);
      elLabel.insertAdjacentElement('afterend', elInput);

      elDiv.querySelector('.awesomplete').insertAdjacentElement('afterend', elButton);
      el = elDiv.outerHTML;
      break;
    case 'image': {
      const imageClass = val ? '' : 'o-hidden';
      el = `<div class="validate ${cls}"><label>${label}</label><br>`;
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
      el = `<div class="validate ${cls}"><label>${label}</label><br><input type="date" name="datum" id="${id}" placeholder="ÅÅÅÅ-MM-DD" value="${val}"${readonly}${required}></div>`;
      break;
    case 'time':
      if (!val) {
        if (obj.defaultTime === false) {
          val = '';
        } else if (obj.defaultTime) {
          val = obj.defaultTime;
        } else {
          val = isoDate.slice(11, 19);
        }
      }
      el = `<div class="validate ${cls}"><label>${label}</label><br><input type="time" name="timmar, minuter och sekunder" id="${id}" placeholder="tt:mm:ss" value="${val}"${readonly}></div>`;
      break;
    case 'datetime':
      if (!val) {
        if (obj.defaultDatetime === false) {
          val = '';
        } else if (obj.defaultDatetime) {
          val = obj.defaultDatetime;
        } else {
          val = isoDate.slice(0, 19);
        }
      }
      el = `<div class="validate"><label>${label}</label><br><input type="datetime-local" name="datum och tid" id="${id}" placeholder="ÅÅÅÅ-MM-DDTtt:mm:ss" step="1" value="${val}"${readonly}></div>`;
      break;
    case 'color':
      if (!val) {
        val = obj.defaultColor ? obj.defaultColor : '';
      }
      el = `<div class="validate ${cls}"><label>${label}</label><br><input type="color" name="hexadecimal" id="${id}" value="${val}"${readonly}></div>`;
      break;
    case 'email':
      el = `<div class="validate ${cls}"><label>${label}</label><br><input type="email" name="epost" id="${id}" value="${val}"${readonly}${required}></div>`;
      break;
    case 'url':
      el = `<div class="validate ${cls}"><label>${label}</label><br><input type="url" name="hemsida" id="${id}" value="${val}"${readonly}${required}></div>`;
      break;
    case 'integer':
      el = `<div class="validate ${cls}"><label>${label}</label><br><input type="number" step="1" min="0" name="heltal" id="${id}" value="${val}"${readonly}${required}></div>`;
      break;
    case 'decimal':
      el = `<div class="validate ${cls}"><label>${label}</label><br><input type="number" step="0.01" min="0" name="decimaltal" id="${id}" value="${val}"${readonly}${required}></div>`;
      break;
    case 'hidden':
      el = `<input type="hidden ${cls}" id="${id}" value="${val}">`;
      break;
    default:
      break;
  }
  return el;
};

export default createForm;
