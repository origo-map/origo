import Component from './component';

export default function Input(options = {}) {
  const {
    buttonCls = '',
    cls = '',
    text
  } = options;

  return Component({
    onRender() {
      const el = document.getElementById(this.getId());
      el.addEventListener('change', this.onChange.bind(this));
    },
    onChange(evt) {
      this.dispatch('change', evt);
    },
    render() {
      return `
    <button class="${buttonCls}"><label for="${this.getId()}" class="${cls}">${text}</label><input id="${this.getId()}" type="file" class="${cls}" style="display:none"></button>
      `;
    }
  });
}
