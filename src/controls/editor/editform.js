/**
 * Generates a form element dynamically based on the provided configuration object.
 * @param {Object} obj - The configuration object for creating the form element.
 * @param {string} obj.elId - The ID of the HTML element.
 * @param {string} obj.cls - Additional CSS classes.
 * @param {boolean} obj.isVisible - Determines if the element is visible.
 * @param {string} obj.title - The label for the form element.
 * @param {*} obj.val - The value of the element.
 * @param {string} obj.type - The type of the form element (e.g., 'text', 'checkbox').
 * @param {number} [obj.maxLength] - Maximum length for input fields.
 * @param {Array} [obj.options] - Options for dropdowns or checkboxes.
 * @param {boolean} [obj.readonly] - Whether the field is readonly.
 * @param {boolean} [obj.required] - Whether the field is required.
 * @param {string} [obj.name] - The name attribute for the element.
 * @param {string} [obj.defaultDate] - Default value for date fields.
 * @param {string} [obj.defaultColor] - Default color value for color fields.
 * @returns {string} The HTML string for the form element.
 */
const createForm = function createForm(obj) {
  // Basic setup of variables
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

  // Switch statement to handle different field types
  switch (type) {
    case 'text':
      // Create a text input
      el = `<div class="validate ${cls}"><label for="${id}">${label}<br><input type="text" name="text${maxLengthText}" id="${id}" class="o-editor-input" value="${val}"${maxLength}${readonly}${required}></label></div>`;
      break;
    case 'textarea':
      // Create a textarea
      el = `<div class="validate ${cls}"><label for="${id}">${label}<br><textarea name="textarea${maxLengthText}" id="${id}" rows="3" class="o-editor-input" ${maxLength}${readonly}${required}>${val}</textarea></label></div>`;
      break;
    case 'checkbox':
      // Create a checkbox
      checked = (obj.config && obj.config.uncheckedValue ? obj.config.uncheckedValue !== val : val) ? ' checked' : '';
      el = `<div class="o-form-checkbox ${cls}"><label for="${id}"><input type="checkbox" id="${id}" class="o-editor-input" value="${val}"${checked}${disabled}/>${label}</label></div>`;
      break;
    case 'checkboxgroup':
      // Create a group of checkboxes
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
          el += `<input id="${id}-${index}" type="checkbox" name="${name}" data-index="${index}" class="o-editor-input" aria-label="Val för att aktivera ${label} ${value}" value="${value}"${checked}> ${option}: `;
          el += `<input id="${id}-${index}-text" type="text" value="${textboxVal}"${maxLength} style="width: auto; padding:0; margin:0; line-height:1.3rem;" class="o-editor-input" aria-label="Värde för ${label} ${value}" ${disable} autocomplete="off">`;
          el += '<br>';
        } else {
          checked = val.includes(value.trim()) ? ' checked' : '';
          el += `<input id="${id}-${index}" type="checkbox" name="${name}" data-index="${index}" class="o-editor-input" aria-label="Val för ${label} ${value}" value="${value}"${checked}> ${option}<br>`;
        }
      });
      el += '<br></div>';
      break;
    case 'dropdown':
      // Create a dropdown
      if (val) {
        firstOption = `<option value="${val}">${val}</option>`;
      } else {
        firstOption = '<option value="">Välj</option>';
      }
      el = `<div class="validate ${cls}"><label for="${id}">${label}<br><select class="o-editor-input" id=${id}${disabled}${required}>${firstOption}`;
      for (let i = 0; i < dropdownOptions.length; i += 1) {
        el += `<option value="${dropdownOptions[i]}">${dropdownOptions[i]}</option>`;
      }
      el += '</select></label></div>';
      break;
    case 'searchList':
      // Create a searchList input
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
      // Create a image input
      const imageClass = val ? '' : 'o-hidden';
      el = `<div class="validate ${cls}"><label for="${id}">${label}<br>`;
      el += `<img src="${val}" id="image-upload" class="${imageClass}"/>`;
      el += `<input type="file" name="bildfil" id="${id}" class="o-editor-input" accept="image/*"${disabled}></label>`;
      el += `<input id="o-delete-image-button" class="${imageClass}" type="button" class="o-editor-input" aria-label="Ta bort bild" value="Ta bort bild"${disabled}>`;
      el += '</div>';
      break;
    }
    case 'date':
      // Create a date input
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
      el = `<div class="validate ${cls}"><label for="${id}">${label}<br><input type="date" name="datum" id="${id}" class="o-editor-input" placeholder="åååå-MM-dd" value="${val}"${readonly}${required}></label></div>`;
      break;
    case 'time':
      // Create a time input
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
      el = `<div class="validate ${cls}"><label for="${id}">${label}<br><input type="time" name="timmar, minuter och sekunder" id="${id}" step="1" class="o-editor-input" placeholder="--:--:--" value="${val}"${readonly}${required}></label></div>`;
      break;
    case 'datetime':
      // Create a datetime input
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
      el = `<div class="validate"><label for="${id}">${label}<br><input type="datetime-local" name="datum och tid" id="${id}" step="1" class="o-editor-input" placeholder="åååå-MM-dd --:--:--" value="${val}"${readonly}${required}></label></div>`;
      break;
    case 'color':
      // Create a color input
      if (!val) {
        val = obj.defaultColor ? obj.defaultColor : '';
      }
      el = `<div class="validate ${cls}"><label for="${id}"${label}<br><input type="color" name="hexadecimal" id="${id}" class="o-editor-input" value="${val}"${readonly}></label></div>`;
      break;
    case 'email':
      // Create a email input
      el = `<div class="validate ${cls}"><label for="${id}">${label}<br><input type="email" name="epost" id="${id}" class="o-editor-input" value="${val}"${readonly}${required}></label></div>`;
      break;
    case 'url':
      // Create a url input
      el = `<div class="validate ${cls}"><label for="${id}">${label}<br><input type="url" name="hemsida" id="${id}" class="o-editor-input" value="${val}"${readonly}${required}></label></div>`;
      break;
    case 'integer':
      // Create a integer number input
      el = `<div class="validate ${cls}"><label for="${id}">${label}<br><input type="number" step="1" min="0" class="o-editor-input" name="heltal" id="${id}" value="${val}"${readonly}${required}></label></div>`;
      break;
    case 'decimal':
      // Create a decimal number input
      el = `<div class="validate ${cls}"><label for="${id}">${label}<br><input type="number" step="0.01" min="0" class="o-editor-input" name="decimaltal" id="${id}" value="${val}"${readonly}${required}></label></div>`;
      break;
    case 'hidden':
      // Create a image input
      // Note that an input with type="hidden" is not the same as an input with class="o-hidden". Type hidden is to roundtrip values invisible to the user
      // class o-hidden is to temporarily hide an input as logic in view says it should not be visible right now (batch edit or constraints).
      el = `<input class="${cls}" type="hidden" id="${id}" value="${val}">`;
      break;
    default:
      // Handle unknown types
      console.warn(`Unsupported field type: ${type}`);
      break;
  }
  return el; // Return the generated HTML
};

export default createForm;
