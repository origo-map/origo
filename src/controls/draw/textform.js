const createElement = function createElement(el, val, attributes) {
  const prefix = `<${el}`;
  const suffix = `</${el}>`;
  const attributeNames = attributes ? Object.getOwnPropertyNames(attributes) : [];
  const attributeList = attributeNames.map((name) => {
    let res = '';
    if (name === 'cls') {
      res = ` ${'class'.concat('=', '"', attributes[name], '"')}`;
    } else {
      res = ` ${name.concat('=', '"', attributes[name], '"')}`;
    }
    return res;
  });
  const element = prefix.concat(attributeList.join(' '), '>', val, suffix);
  return element;
};

const createForm = function createForm(options) {
  const input = createElement('input', '', {
    id: 'o-draw-input-text',
    type: 'text',
    value: options.value || '',
    placeholder: options.placeHolder
  });
  const saveButton = createElement('input', '', {
    id: 'o-draw-save-text',
    type: 'button',
    value: 'Ok'
  });
  const saveWrapper = createElement('div', saveButton, {
    cls: 'o-form-save'
  });
  const content = `${input}<br><br>${saveWrapper}`;
  const form = createElement('form', content);
  return form;
};

export default {
  createForm
};
