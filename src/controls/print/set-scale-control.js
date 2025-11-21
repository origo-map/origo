import { Dropdown, Component, Input } from '../../ui';
import mapUtils from '../../maputils';

export default function SetScaleControl(map, options = {}) {
  const {
    scales = [],
    initialScale,
    localization,
    userDefinedScale
  } = options;

  let selectScale;
  let inputScale;
  let lockButtonText = false;

  if (userDefinedScale) {
    scales.push({ label: localization.getStringByKeys({ targetParentKey: 'print', targetKey: 'userDefinedScale' }), value: 'userDefinedScale' });
  }

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
      if (userDefinedScale) {
        inputScale = Input({
          cls: 'o-search-layer-field placeholder-text-smaller smaller',
          style: { height: '1.5rem', margin: 0, width: '100%' },
          placeholderText: '1:1234',
          type: 'number',
          value: '1:'
        });
        this.addComponents([inputScale]);
        inputScale.hidden = true;
        inputScale.on('change', (evt) => {
          const value = mapUtils.formattedScaleToScaleDenominator(evt.value);
          if (Number.isNaN(value) || value <= 0) {
            return;
          }
          this.dispatch('change:scale', { scale: value / 1000 });
        });
      }
    },
    onChangeScale(evt) {
      if (evt.value === 'userDefinedScale') {
        document.getElementById(inputScale.getId()).hidden = false;
        selectScale.setButtonText(localization.getStringByKeys({ targetParentKey: 'print', targetKey: 'userDefinedScale' }));
        lockButtonText = true;
      } else {
        lockButtonText = false;
        this.dispatch('change:scale', { scale: evt.value / 1000 });
        document.getElementById(inputScale.getId()).hidden = true;
      }
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
      </div>
      <div class="padding-0 o-tooltip active">
        ${inputScale.render()}
      </div>`;
    },
    setButtonText(buttonText) {
      if (!lockButtonText) {
        selectScale.setButtonText(buttonText);
      }
    }
  });
}
