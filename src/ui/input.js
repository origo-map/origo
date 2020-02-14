import Component from './component';
import createStyle from './dom/createstyle';

export default function Input(options = {}) {
  const {
    cls = '',
    placeholderText,
    style: styleSettings = {}
  } = options;
  let {
    value = ''
  } = options;
  const style = createStyle(styleSettings);

  return Component({
    getValue() { return value; },
    onRender() {
      const el = document.getElementById(this.getId());
      el.addEventListener('keyup', this.onChange.bind(this));
    },
    onChange(evt) {
      value = evt.target.value;
      this.dispatch('change', { value });
    },
    render() {
      return `
      <input id="${this.getId()}" type="text" placeholder="${placeholderText}" class="${cls}" value="${value}" style="${style}">
      `;
    }
  });
}
