import Component from './component';
import createStyle from './dom/createstyle';

export default function Textarea(options = {}) {
  const {
    cls = '',
    placeholderText,
    rows = 3,
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
      <textarea id="${this.getId()}" placeholder="${placeholderText}" rows="${rows}" class="${cls}" style=""${style}>${value}</textarea>
      `;
    }
  });
}
