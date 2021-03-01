import { Component, InputRange } from '../../ui';

export default function CustomSizeControl(options = {}) {
  let {
    height,
    width,
    state
  } = options;

  let rangeHeightComponent;
  let rangeWidthComponent;
  let customSizeEl;

  return Component({
    onInit() {
      rangeHeightComponent = InputRange({
        cls: '',
        initialValue: height,
        maxValue: 420,
        minValue: 50,
        style: { width: '100%' },
        unit: 'mm',
        label: 'Höjd'
      });
      rangeWidthComponent = InputRange({
        cls: '',
        initialValue: width,
        maxValue: 420,
        minValue: 50,
        style: { width: '100%' },
        unit: 'mm',
        label: 'Bredd'
      });
      this.addComponents([rangeHeightComponent, rangeWidthComponent]);
      rangeHeightComponent.on('change', this.onChangeHeight.bind(this));
      rangeWidthComponent.on('change', this.onChangeWidth.bind(this));
      this.on('change:visible', this.onChangeVisible.bind(this));
    },
    onChangeHeight(evt) {
      height = evt.value;
      this.dispatch('change:size', { size: 'custom', height: evt.value });
    },
    onChangeWidth(evt) {
      width = evt.value;
      this.dispatch('change:size', { size: 'custom', width: evt.value });
    },
    onChangeVisible(evt) {
      state = evt.visible ? 'active' : 'initial';
      if (evt.visible) {
        customSizeEl.classList.remove('hidden');
        return;
      }
      customSizeEl.classList.add('hidden');
    },
    onRender() {
      this.dispatch('render');
      customSizeEl = document.getElementById(this.getId());
    },
    isActive() {
      return state === 'active';
    },
    render() {
      return `
      <div id="${this.getId()}" class="${this.isActive() ? '' : 'hidden'}">
        ${rangeWidthComponent.render()}
        ${rangeHeightComponent.render()}
      </div>
      `;
    }
  });
}
