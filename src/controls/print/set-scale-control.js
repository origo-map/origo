import { Dropdown, Component } from '../../ui';
import mapUtils from '../../maputils';
import numberFormatter from '../../utils/numberformatter';

export default function SetScaleControl(options = {}, map) {
  const {
    scales = []
  } = options;

  let projection;
  let resolutions;

  let selectScale;

  const roundScale = (scale) => {
    let scaleValue = scale;
    const differens = scaleValue % 10;
    if (differens !== 0) {
      scaleValue += (10 - differens);
    }
    return scaleValue;
  };

  function getScales() {
    return resolutions.map(resolution => `1:${numberFormatter(roundScale(mapUtils.resolutionToScale(resolution, projection)))}`);
  }

  return Component({
    onInit() {
      selectScale = Dropdown({
        direction: 'up',
        cls: 'o-scalepicker text-black flex',
        contentCls: 'bg-grey-lighter text-smallest rounded',
        buttonCls: 'bg-white border text-black',
        buttonIconCls: 'black'
      });
      this.addComponents([selectScale]);
      projection = map.getView().getProjection();
      resolutions = map.getView().getResolutions();
    },
    onChangeScale(evt) {
      const scaleDenominator = parseInt(evt.replace(/\s+/g, '').split(':').pop(), 10);
      this.dispatch('change:scale', { scale: scaleDenominator / 1000 });
      selectScale.setButtonText(evt);
    },
    onRender() {
      this.dispatch('render');
      selectScale.setButtonText('Välj skala');
      if (Array.isArray(scales) && scales.length) {
        selectScale.setItems(scales);
      } else {
        selectScale.setItems(getScales());
      }
      document.getElementById(selectScale.getId()).addEventListener('dropdown:select', (evt) => {
        this.onChangeScale(evt.target.textContent);
      });
    },
    render() {
      return `
      <div class="padding-top-large"></div>
      <h6>Välj utskriftsskala</h6>
      <div class="padding-smaller o-tooltip active">
        ${selectScale.render()}
      </div>`;
    }
  });
}
