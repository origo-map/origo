import helpers from '../utils/templatehelpers';

export default obj => (`<div id="o-map" class="${obj.mapClass}">
  <div id="o-tools-left" class="o-container-absolute o-tools-left">
    <div id="o-toolbar-navigation" class="o-toolbar-vertical o-toolbar-navigation"></div>
    <div id="o-toolbar-maptools" class="o-toolbar-vertical o-toolbar-maptools"></div>
    <div id="o-toolbar-misc" class="o-toolbar-vertical o-toolbar-misc"></div>
  </div>
  <div id="o-tools-bottom" class="o-tools-bottom"></div>
  <div id="o-footer" class="o-footer">
    <div id="o-console" class="o-footer-left">&nbsp;</div>
    <div class="o-footer-middle">
      <div class="o-footer-middle-content">
        ${helpers.if(obj.img, `<img src="${obj.img}">`)}
        ${helpers.if(obj.url, `<a href="${obj.url}">${obj.urlText}</a>`)}
        ${helpers.if(obj.text, `<p>${obj.text}</p>`)}
      </div>
    </div>
    <div class="o-footer-right">
    </div>
</div>`);
