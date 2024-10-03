export default function printTemplate({
  id,
  customSizeControl,
  descriptionControl,
  marginControl,
  orientationControl,
  sizeControl,
  titleControl,
  createdControl,
  northArrowControl,
  rotationControl,
  setScaleControl,
  resolutionControl,
  showScaleControl,
  printLegendControl,
  localize
}) {
  return `
  <div id="${id}" class="flex column no-print padding-x overflow-auto max-height-100">
    ${titleControl.render()}
    <div class="padding-top"></div>
    ${descriptionControl.render()}
    <div class="padding-top"></div>
    <h6>${localize('paperSize')}</h6>
    ${sizeControl.render()}
    <div class="padding-top"></div>
    ${customSizeControl.render()}
    <div class="padding-top"></div>
    <h6>${localize('orientation')}</h6>
    ${orientationControl.render()}
    ${resolutionControl ? `<div class="padding-top"></div><h6>${localize('resolution')}</h6>${resolutionControl.render()}` : ''}
    <div class="padding-top"></div>
      ${setScaleControl.render()}
    <div class="padding-top-large"></div>
    <div class="flex padding-right-small">
      <div class="grow text-normal">${localize('useMargins')}</div>
      ${marginControl.render()}
    </div>
    <div class="padding-top-large"></div>
    <div class="flex padding-right-small">
      <div class="grow text-normal">${localize('showCreatedDate')}</div>
      ${createdControl.render()}
    </div>
    <div class="padding-top-large"></div>
    <div class="flex padding-right-small">
      <div class="grow text-normal">${localize('showScale')}</div>
      ${showScaleControl.render()}
    </div>
    <div class="padding-top-large"></div>
    <div class="flex padding-right-small">
      <div class="grow text-normal">${localize('showNorthArrow')}</div>
      ${northArrowControl.render()}
    </div>
    <div class="padding-top-large"></div>
    <div class="flex padding-right-small">
      <div class="grow text-normal">${localize('showLegend')}</div>
      ${printLegendControl.render()}
    </div>
    <div class="padding-bottom-large">
      ${rotationControl ? rotationControl.render() : ''}
    </div>
  </div>`;
}
