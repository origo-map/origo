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
  const options = obj.options || [];
  const freetextOptionPrefix = obj.freetextOptionPrefix ? obj.freetextOptionPrefix : 'freetext_option:';
  const freetextOptionValueSeparator = obj.freetextOptionValueSeparator ? obj.freetextOptionValueSeparator : '=';
  let el;
  let firstOption;
  let checked;
  const maxLengthText = maxLength ? `, max ${obj.maxLength} tecken` : '';
  switch (type) {
    case 'text':
      el = `<div class="validate ${cls}"><label>${label}<br><input type="text" name="text${maxLengthText}" id="${id}" value="${val}"${maxLength}${readonly}${required}></label></div>`;
      break;
    case 'textarea':
      el = `<div class="validate ${cls}"><label>${label}<br><textarea name="textarea${maxLengthText}" id="${id}" rows="3" ${maxLength}${readonly}${required}>${val}</textarea></label></div>`;
      break;
    case 'checkbox':
      checked = (obj.config && obj.config.uncheckedValue ? obj.config.uncheckedValue !== val : val) ? ' checked' : '';
      el = `<div class="o-form-checkbox ${cls}"><label for="${id}"><input type="checkbox" id="${id}" value="${val}"${checked}${disabled}/>${label}</label></div>`;
      break;
    case 'checkboxgroup':
      el = `<div class="o-form-checkbox"><label>${label}</label><br />`;
      options.forEach((opt, index) => {
        const option = opt.text;
        const subtype = opt.type ? opt.type : '';
        const value = opt.value ? opt.value : option;
        let textboxVal;
        let disable;
        // If this is choice with possibility of adding free text add a text input else only a checkbox
        if (subtype === 'textbox') {
          let matchingValue = '';
          if (Array.isArray(val)) {
            checked = val.some(item => item.startsWith(`${freetextOptionPrefix}${option}${freetextOptionValueSeparator}`)) ? ' checked' : '';
            matchingValue = val.find(match => match.startsWith(`${freetextOptionPrefix}${option}${freetextOptionValueSeparator}`));
          }
          textboxVal = checked ? matchingValue.split(`${freetextOptionValueSeparator}`)[1] : '';
          disable = checked ? '' : ' disabled';
          el += `<input id="${id}-${index}" type="checkbox" name="${name}" data-index="${index}" value="${value}"${checked}> ${option}: `;
          el += `<input id="${id}-${index}-text" type="text" value="${textboxVal}"${maxLength} style="width: auto; padding:0; margin:0; line-height:1.3rem;" ${disable} autocomplete="off">`;
          el += '<br>';
        } else {
          checked = val.includes(option.trim()) ? ' checked' : '';
          el += `<input id="${id}-${index}" type="checkbox" name="${name}" data-index="${index}" value="${value}"${checked}> ${option}<br>`;
        }
      });
      el += '<br></div>';
      break;
    case 'dropdown':
      if (val) {
        firstOption = `<option value="${val}">${val}</option>`;
      } else {
        firstOption = '<option value="">Välj</option>';
      }
      el = `<div class="validate ${cls}"><label>${label}<br><select id=${id}${disabled}${required}>${firstOption}`;
      for (let i = 0; i < dropdownOptions.length; i += 1) {
        el += `<option value="${dropdownOptions[i]}">${dropdownOptions[i]}</option>`;
      }
      el += '</select></label></div>';
      break;
    case 'searchList':
      elLabel.innerHTML = label;
      elLabel.appendChild(document.createElement('br'));

      elDiv.setAttribute('class', `validate ${obj.type} ${cls}`);
      elInput.setAttribute('id', id);
      elInput.setAttribute('name', name);
      elInput.setAttribute('type', 'input');
      elInput.setAttribute('class', 'awesomplete');
      elInput.setAttribute('maxlength', maxLength || 50);
      elInput.setAttribute('value', val);
      if (required) {
        elInput.required = true;
      }

      elButton.setAttribute('class', `dropdown-btn ${id}`);
      elButton.setAttribute('type', 'button');
      elButton.tabIndex = -1;
      elSpan.setAttribute('class', 'caret');
      elButton.insertAdjacentElement('afterbegin', elSpan);

      elDiv.insertAdjacentElement('afterbegin', elLabel);
      elLabel.insertAdjacentElement('afterend', elInput);

      elDiv.querySelector('.awesomplete').insertAdjacentElement('afterend', elButton);
      // This removes all handlers and serialises data-attribs, so eventhandlers must be added later.
      el = elDiv.outerHTML;
      break;
    case 'image': {
      const imageClass = val ? '' : 'o-hidden';
      el = `<div class="validate ${cls}"><label>${label}<br>`;
      el += `<img src="${val}" id="image-upload" class="${imageClass}"/>`;
      el += `<input type="file" name="bildfil" id="${id}" accept="image/*"${disabled}></label>`;
      el += `<input id="o-delete-image-button" class="${imageClass}" type="button" aria-label="Ta bort bild" value="Ta bort bild"${disabled}>`;
      el += '</div>';
      break;
    }
    case 'date':
      if (!val) {
        if (obj.defaultDate === false || obj.defaultDate === 'undefined') {
          val = '';
        } else {
          val = isoDate.slice(0, 10);
        }
      }
      if (val.length > 10) {
        val = val.slice(0, 10);
      }
      el = `<div class="validate ${cls}"><label>${label}<br><input type="date" name="datum" id="${id}" placeholder="åååå-MM-dd" value="${val}"${readonly}${required}></label></div>`;
      break;
    case 'time':
      if (!val) {
        if (obj.defaultTime === false || obj.defaultDate === 'undefined') {
          val = '';
        } else {
          val = isoDate.slice(11, 19);
        }
      }
      if (val.endsWith('.000')) {
        val = val.slice(0, -4);
      } else if (val.length > 8) {
        val = val.slice(11, 19);
      }
      el = `<div class="validate ${cls}"><label>${label}<br><input type="time" name="timmar, minuter och sekunder" id="${id}" step="1" placeholder="--:--:--" value="${val}"${readonly}${required}></label></div>`;
      break;
    case 'datetime':
      if (!val) {
        if (obj.defaultDatetime === false || obj.defaultDate === 'undefined') {
          val = '';
        } else {
          val = isoDate.slice(0, 19);
        }
      }
      if (val.endsWith('.000')) {
        val = val.slice(0, -4);
      } else if (val.length > 19) {
        val = val.slice(0, 19);
      }
      el = `<div class="validate"><label>${label}<br><input type="datetime-local" name="datum och tid" id="${id}" step="1" placeholder="åååå-MM-dd --:--:--" value="${val}"${readonly}${required}></label></div>`;
      break;
    case 'color':
      if (!val) {
        val = obj.defaultColor ? obj.defaultColor : '';
      }
      el = `<div class="validate ${cls}"><label>${label}<br><input type="color" name="hexadecimal" id="${id}" value="${val}"${readonly}></label></div>`;
      break;
    case 'email':
      el = `<div class="validate ${cls}"><label>${label}<br><input type="email" name="epost" id="${id}" value="${val}"${readonly}${required}></label></div>`;
      break;
    case 'url':
      el = `<div class="validate ${cls}"><label>${label}<br><input type="url" name="hemsida" id="${id}" value="${val}"${readonly}${required}></label></div>`;
      break;
    case 'integer':
      el = `<div class="validate ${cls}"><label>${label}<br><input type="number" step="1" min="0" name="heltal" id="${id}" value="${val}"${readonly}${required}></label></div>`;
      break;
    case 'decimal':
      el = `<div class="validate ${cls}"><label>${label}<br><input type="number" step="0.01" min="0" name="decimaltal" id="${id}" value="${val}"${readonly}${required}></label></div>`;
      break;
    case 'hidden':
      // Note that an input with type="hidden" is not the same as an input with class="o-hidden". Type hidden is to roundtrip values invisible to the user
      // class o-hidden is to temporarily hide an input as logic in view says it should not be visible right now (batch edit or constraints).
      el = `<input class="${cls}" type="hidden" id="${id}" value="${val}">`;
      break;
    default:
      break;
  }
  return el;
};

export default createForm;
