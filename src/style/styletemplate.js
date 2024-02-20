export default function styleTemplate(palette, swStyle) {
  const colorArray = palette;
  let fillHtml = '<div id="o-draw-style-fill" class="padding border-bottom"><div class="text-large text-align-center">Fyllning</div><div id="o-draw-style-fillColor"><ul>';
  let backgroundFillHtml = '<div id="o-draw-style-backgroundFill" class="padding border-bottom"><div class="text-large text-align-center">Bakgrundsfyllning</div><div id="o-draw-style-backgroundFillColor"><ul>';
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
    backgroundFillHtml += `<li>
    <input type="radio" id="backgroundFillColorRadio${i}" name="backgroundFillColorRadio" value="${colorArray[i]}"${checked} />
    <label for="backgroundFillColorRadio${i}"><span style="background:${colorArray[i]}"></span></label>
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

  backgroundFillHtml += `</ul></div><div class="padding-smaller o-tooltip active">
  <input id="o-draw-style-backgroundFillOpacitySlider" type="range" min="0" max="1" value="${swStyle.backgroundFillOpacity}" step="0.05">
  <div class="text-align-center">
    <span class="text-smaller float-left">0%</span>
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

  let backgroundStrokeHtml = '<div id="o-draw-style-backgroundStroke" class="padding border-bottom"><div class="text-large text-align-center">Bakgrundsram</div><div id="o-draw-style-backgroundStrokeColor"><ul>';
  for (let i = 0; i < colorArray.length; i += 1) {
    const checked = colorArray[i] === swStyle.backgroundStrokeColor ? ' checked=true' : '';
    backgroundStrokeHtml += `<li>
    <input type="radio" id="backgroundStrokeColorRadio${i}" name="backgroundStrokeColorRadio" value="${colorArray[i]}"${checked} />
    <label for="backgroundStrokeColorRadio${i}"><span style="background:${colorArray[i]}"></span></label>
    </li>`;
  }

  backgroundStrokeHtml += `</ul></div><div class="padding-smaller o-tooltip active">
  <input id="o-draw-style-backgroundStrokeOpacitySlider" type="range" min="0" max="1" value="${swStyle.backgroundStrokeOpacity}" step="0.05">
  <div class="text-align-center">
    <span class="text-smaller float-left">0%</span>
    <span class="text-smaller">Opacitet</span>
    <span class="text-smaller float-right">100%</span>
  </div>
  </div>
  <div class="padding-smaller o-tooltip active">
  <input id="o-draw-style-backgroundStrokeWidthSlider" type="range" min="1" max="10" value="${swStyle.backgroundStrokeWidth}" step="1">
  <div class="text-align-center">
    <span class="text-smaller float-left">1px</span>
    <span class="text-smaller">Linjebredd</span>
    <span class="text-smaller float-right">10px</span>
  </div>
  </div>
  <div class="padding-smaller o-tooltip active">
    <select id="o-draw-style-backgroundStrokeType" class="small no-margin width-full">
      <option value="line"${swStyle.backgroundStrokeType === 'line' ? ' selected' : ''}>Heldragen linje</option>
      <option value="dash"${swStyle.backgroundStrokeType === 'dash' ? ' selected' : ''}>Streckad linje</option>
      <option value="point"${swStyle.backgroundStrokeType === 'point' ? ' selected' : ''}>Punktad linje</option>
      <option value="dash-point"${swStyle.backgroundStrokeType === 'dash-point' ? ' selected' : ''}>Streck-punkt-linje</option>
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
      <option value="marker"${swStyle.pointType === 'marker' ? ' selected' : ''}>Markör</option>
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

  const measureHtml = `<div id="o-draw-style-measure" class="padding border-bottom"><div class="text-large text-align-center">Mått</div><div class="padding-smaller o-tooltip active">
  <div>
    <input type="checkbox" id="o-draw-style-showMeasure" name="showMeasure"${swStyle.showMeasure ? ' checked' : ''} />
    <label for="o-draw-style-showMeasure" class="text-weight-normal">Visa längd/area</label>
  </div>
  <div>
    <input type="checkbox" id="o-draw-style-showMeasureSegments" name="showMeasureSegments"${swStyle.showMeasureSegments ? ' checked' : ''} />
    <label for="o-draw-style-showMeasureSegments" class="text-weight-normal">Visa delsträckor</label>
  </div>
</div></div>`;

  const rotateHtml = `<div id="o-draw-style-rotation" class="padding border-bottom"><div class="text-large text-align-center">Rotation</div><div class="padding-smaller o-tooltip active">
<input id="o-draw-style-rotationSlider" type="range" min="0" max="720" value="${swStyle.objRotation}" step="1">
<div class="text-align-center">
  <span class="text-smaller float-left">0&deg;</span>
  <span class="text-smaller">Graders rotation</span>
  <span class="text-smaller float-right">360&deg;</span>
</div>
</div>`;

  const paddingHtml = `<div id="o-draw-style-padding" class="padding border-bottom"><div class="text-large text-align-center">Marginaler</div><div class="padding-smaller o-tooltip active">
<input id="o-draw-style-paddingSlider" type="range" min="0" max="30" value="${swStyle.paddingText}" step="1">
<div class="text-align-center">
  <span class="text-smaller float-left">0px</span>
  <span class="text-smaller">Marginal till text</span>
  <span class="text-smaller float-right">30px</span>
</div>
</div>`;

  return textHtml + pointHtml + fillHtml + strokeHtml + measureHtml + rotateHtml + backgroundFillHtml + backgroundStrokeHtml + paddingHtml;
}
