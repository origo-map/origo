import { Dropdown, Component } from '../../ui';
import mapUtils from '../../maputils';

export default function SetScaleControl(options = {}, map) {
  const {
    scales = [],
    initialScale
  } = options;

  let projection;
  let resolutions;
  let selectScale;

  function getScales() {
    return resolutions.map(resolution => mapUtils.resolutionToFormattedScale(resolution, projection));
  }

  return Component({
    onInit() {
      selectScale = Dropdown({
        direction: 'up',
        cls: 'o-scalepicker text-black flex',
        contentCls: 'bg-grey-lighter text-smallest rounded',
        buttonCls: 'bg-white border text-black',
        buttonIconCls: 'black',
        text: 'Välj skala'
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
      if (Array.isArray(scales) && scales.length) {
        selectScale.setItems(scales);
      } else {
        selectScale.setItems(getScales());
      }
      document.getElementById(selectScale.getId()).addEventListener('dropdown:select', (evt) => {
        this.onChangeScale(evt.target.textContent);
      });
      if (initialScale) {
        this.onChangeScale(initialScale);
      } else {
        const viewResolution = map.getView().getResolution();
        const closest = resolutions.reduce((prev, curr) => (Math.abs(curr - viewResolution) < Math.abs(prev - viewResolution) ? curr : prev));
        this.onChangeScale(mapUtils.resolutionToFormattedScale(closest, projection));
      }
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
