export default function createForm(obj) {
  const id = obj.elId.slice(1);
  let cls = obj.cls || '';
  cls += id;
  cls += obj.isVisible ? '' : ' o-hidden';
  const label = obj.title;
  const val = obj.isVisible ? obj.val : '';
  const type = obj.type;
  const maxLength = obj.maxLength ? ` maxlength="${obj.maxLength}" ` : '';
  const dropdownOptions = obj.options || [];
  const checked = val === true ? ' checked' : '';
  let firstOption;
  let el;

  switch (type) {
    case 'text':
      el = `<div><label>${label}</label><br><input type="text" id="${id}" value="${val}"${maxLength}></div>`;
      break;

    case 'textarea':
      el = `<div><label>${label}</label><br><textarea id="${id}"${maxLength}rows="3">${val}</textarea></div>`;
      break;

    case 'checkbox':
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

    default:
      break;
  }
  return el;
}
