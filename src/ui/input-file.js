import Component from './component';

export default function Input(options = {}) {
  const {
    labelCls = '',
    inputCls = '',
    label = '',
    change
  } = options;

  return Component({
    onInit() {
      if (change) {
        this.on('change', change.bind(this));
        this.on('clear', () => {
          this.un('change', change.bind(this));
        });
      }
    },
    onRender() {
      const el = document.getElementById(this.getId());
      el.addEventListener('change', this.onChange.bind(this));
    },
    onChange(evt) {
      this.dispatch('change', evt);
    },
    render() {
      return `
    <label for="${this.getId()}" class="${labelCls}">${label}</label><input id="${this.getId()}" type="file" class="${inputCls}">
      `;
    }
  });
}
