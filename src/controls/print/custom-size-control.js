import { Component, cuid, InputRange } from '../../ui';

export default function CustomSizeControl(options = {}) {
  let {
    height,
    width,
    state
  } = options;

  let rangeHeightComponent;
  let rangeWidthComponent;

  const heightId = cuid();
  const widthId = cuid();
  let heightEl;
  let widthEl;
  let customSizeEl;

  return Component({
    onInit() {
      rangeHeightComponent = InputRange({
        cls: 'grey',
        initialValue: height,
        maxValue: 420,
        minValue: 50,
        style: { width: '100%' }
      });
      rangeWidthComponent = InputRange({
        cls: 'grey',
        initialValue: width,
        maxValue: 420,
        minValue: 50,
        style: { width: '100%' }
      });
      this.addComponents([rangeHeightComponent, rangeWidthComponent]);
      rangeHeightComponent.on('change', this.onChangeHeight.bind(this));
      rangeWidthComponent.on('change', this.onChangeWidth.bind(this));
      this.on('change:visible', this.onChangeVisible.bind(this));
    },
    onChangeHeight(evt) {
      height = evt.value;
      heightEl.innerHTML = height;
      this.dispatch('change:size', { size: 'custom', height: evt.value });
    },
    onChangeWidth(evt) {
      width = evt.value;
      widthEl.innerHTML = width;
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
      heightEl = document.getElementById(heightId);
      widthEl = document.getElementById(widthId);
      customSizeEl = document.getElementById(this.getId());
    },
    isActive() {
      return state === 'active';
    },
    render() {
      return `
      <div id="${this.getId()}" class="${this.isActive() ? '' : 'hidden'}">
        <div class="grow text-smaller">Bredd: <span id="${widthId}">${width}</span> mm</div>
        ${rangeWidthComponent.render()}
        <div class="grow text-smaller">Höjd: <span id="${heightId}">${height}</span> mm</div>
        ${rangeHeightComponent.render()}
      </div>
      `;
    }
  });
}
