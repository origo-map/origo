import { Dropdown, Component } from '../../ui';
import mapUtils from '../../maputils';

export default function SetScaleControl(map, options = {}) {
  const {
    scales = [],
    initialScale,
    localize
  } = options;

  let selectScale;

  /**
   * Parses a formatted scale string and returns the denominator as a number
   * @param {any} scale
   */
  function parseScale(scale) {
    return parseInt(scale.replace(/\s+/g, '').split(':').pop(), 10);
  }

  return Component({
    onInit() {
      selectScale = Dropdown({
        direction: 'up',
        cls: 'o-scalepicker text-black flex',
        contentCls: 'bg-grey-lighter text-smallest rounded',
        buttonCls: 'bg-white border text-black',
        buttonIconCls: 'black',
        text: localize('selectScale')
      });
      this.addComponents([selectScale]);
    },
    onChangeScale(evt) {
      const scaleDenominator = parseScale(evt);
      this.dispatch('change:scale', { scale: scaleDenominator / 1000 });
      selectScale.setButtonText(evt);
    },
    onRender() {
      this.dispatch('render');
      selectScale.setItems(scales);
      document.getElementById(selectScale.getId()).addEventListener('dropdown:select', (evt) => {
        this.onChangeScale(evt.target.textContent);
      });
      if (initialScale) {
        this.onChangeScale(initialScale);
      } else {
        const viewResolution = map.getView().getResolution();
        const projection = map.getView().getProjection();
        const mapScale = mapUtils.resolutionToScale(viewResolution, projection);
        const closest = scales.reduce((prev, curr) => (Math.abs(parseScale(curr) - mapScale) < Math.abs(parseScale(prev) - mapScale) ? curr : prev));
        this.onChangeScale(closest);
      }
    },
    render() {
      return `
      <div class="padding-top-large"></div>
      <h6>${localize('selectPrintScale')}</h6>
      <div class="padding-smaller o-tooltip active">
        ${selectScale.render()}
      </div>`;
    },
    setButtonText(buttonText) {
      selectScale.setButtonText(buttonText);
    }
  });
}
