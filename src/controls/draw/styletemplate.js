export default function styleTemplate(palette, swStyle) {
  const colorArray = palette;
  let fillHtml = '<div id="o-draw-style-fill" class="padding border-bottom"><div class="text-large text-align-center">Fyllning</div><div id="o-draw-style-fillColor"><ul>';
  if (!colorArray.includes(swStyle.fillColor)) {
    colorArray.push(swStyle.fillColor);
  }
  if (!colorArray.includes(swStyle.strokeColor)) {
    colorArray.push(swStyle.strokeColor);
  }
  for (let i = 0; i < colorArray.length; i += 1) {
    const checked = colorArray[i] === swStyle.fillColor ? ' checked=true' : '';
    fillHtml += `<li>
    <input type="radio" id="fillColorRadio${i}" name="fillColorRadio" value="${colorArray[i]}"${checked} />
    <label for="fillColorRadio${i}"><span style="background:${colorArray[i]}"></span></label>
    </li>`;
  }

  fillHtml += `</ul></div><div class="padding-smaller o-tooltip active">
  <input id="o-draw-style-fillOpacitySlider" type="range" min="0.05" max="1" value="${swStyle.fillOpacity}" step="0.05">
  <div class="text-align-center">
    <span class="text-smaller float-left">5%</span>
    <span class="text-smaller">Opacitet</span>
    <span class="text-smaller float-right">100%</span>
  </div>
  </div></div>`;

  let strokeHtml = '<div id="o-draw-style-stroke" class="padding border-bottom"><div class="text-large text-align-center">Kantlinje</div><div id="o-draw-style-strokeColor"><ul>';
  for (let i = 0; i < colorArray.length; i += 1) {
    const checked = colorArray[i] === swStyle.strokeColor ? ' checked=true' : '';
    strokeHtml += `<li>
    <input type="radio" id="strokeColorRadio${i}" name="strokeColorRadio" value="${colorArray[i]}"${checked} />
    <label for="strokeColorRadio${i}"><span style="background:${colorArray[i]}"></span></label>
    </li>`;
  }

  strokeHtml += `</ul></div><div class="padding-smaller o-tooltip active">
  <input id="o-draw-style-strokeOpacitySlider" type="range" min="0.05" max="1" value="${swStyle.strokeOpacity}" step="0.05">
  <div class="text-align-center">
    <span class="text-smaller float-left">5%</span>
    <span class="text-smaller">Opacitet</span>
    <span class="text-smaller float-right">100%</span>
  </div>
  </div>
  <div class="padding-smaller o-tooltip active">
  <input id="o-draw-style-strokeWidthSlider" type="range" min="1" max="10" value="${swStyle.strokeWidth}" step="1">
  <div class="text-align-center">
    <span class="text-smaller float-left">1px</span>
    <span class="text-smaller">Linjebredd</span>
    <span class="text-smaller float-right">10px</span>
  </div>
  </div>
  <div class="padding-smaller o-tooltip active">
    <select id="o-draw-style-strokeType" class="small no-margin width-full">
      <option value="line"${swStyle.strokeType === 'line' ? ' selected' : ''}>Heldragen linje</option>
      <option value="dash"${swStyle.strokeType === 'dash' ? ' selected' : ''}>Streckad linje</option>
      <option value="point"${swStyle.strokeType === 'point' ? ' selected' : ''}>Punktad linje</option>
      <option value="dash-point"${swStyle.strokeType === 'dash-point' ? ' selected' : ''}>Streck-punkt-linje</option>
    </select>
  </div></div>`;

  const pointHtml = `<div id="o-draw-style-point" class="padding border-bottom"><div class="text-large text-align-center">Punkt</div><div class="padding-smaller o-tooltip active">
    <input id="o-draw-style-pointSizeSlider" type="range" min="1" max="50" value="${swStyle.pointSize}" step="1">
    <div class="text-align-center">
      <span class="text-smaller float-left">1px</span>
      <span class="text-smaller">Punktstorlek</span>
      <span class="text-smaller float-right">50px</span>
    </div>
  </div>
  <div class="padding-smaller o-tooltip active">
    <select id="o-draw-style-pointType" class="small no-margin width-full">
      <option value="circle"${swStyle.pointType === 'circle' ? ' selected' : ''}>Cirkel</option>
      <option value="x"${swStyle.pointType === 'x' ? ' selected' : ''}>Kryss</option>
      <option value="cross"${swStyle.pointType === 'cross' ? ' selected' : ''}>Kors</option>
      <option value="star"${swStyle.pointType === 'star' ? ' selected' : ''}>Stjärna</option>
      <option value="triangle"${swStyle.pointType === 'triangle' ? ' selected' : ''}>Triangel</option>
      <option value="square"${swStyle.pointType === 'square' ? ' selected' : ''}>Kvadrat</option>
    </select>
  </div></div>`;

  const textHtml = `<div id="o-draw-style-text" class="padding border-bottom"><div class="text-large text-align-center">Text</div><div class="padding-smaller o-tooltip active">
    <input id="o-draw-style-textSizeSlider" type="range" min="8" max="128" value="${swStyle.textSize}" step="1">
    <div class="text-align-center">
      <span class="text-smaller float-left">8px</span>
      <span class="text-smaller">Textstorlek</span>
      <span class="text-smaller float-right">128px</span>
    </div>
  </div>
  <div class="padding-smaller o-tooltip active">
    <input id="o-draw-style-textString" class="small no-margin width-full" type="text" value="${swStyle.textString}">
  </div></div>`;

  return textHtml + pointHtml + fillHtml + strokeHtml;
}
