import { Dropdown, Component } from '../../ui';
import mapUtils from '../../maputils';

export default function SetScaleControl(map, options = {}) {
  const {
    scales = [],
    initialScale,
    localization
  } = options;

  let selectScale;

  const localize = function localize(key) {
    return localization.getStringByKeys({ targetParentKey: 'print', targetKey: key });
  };

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
      this.dispatch('change:scale', { scale: evt.value / 1000 }); // 10000 blir till scale: 10 ..och nånting här sätter buttonText för selectScale
    },
    onRender() {
      this.dispatch('render');
      selectScale.setItems(scales);
      document.getElementById(selectScale.getId()).addEventListener('dropdown:select', (evt) => {
        this.onChangeScale(evt.detail);
      });
      if (initialScale) {
        const scaleDenominator = mapUtils.formattedScaleToScaleDenominator(initialScale);
        this.onChangeScale({
          label: mapUtils.formatScale(scaleDenominator, localization),
          value: scaleDenominator
        });
      } else {
        const viewResolution = map.getView().getResolution();
        const projection = map.getView().getProjection();
        const mapScale = mapUtils.resolutionToScale(viewResolution, projection);
        const closest = scales.reduce((prev, curr) => ((Math.abs(curr.value - mapScale)) < (Math.abs(prev.value - mapScale)) ? curr : prev));
        this.onChangeScale({
          label: mapUtils.formatScale(closest.value, localization),
          value: closest.value
        });
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
