import { defaults, DragPan, MouseWheelZoom  } from 'ol/interaction';
import {noModifierKeys, platformModifierKeyOnly, touchOnly } from 'ol/events/condition';
import isEmbedded from './utils/isembedded';

const MapInteractions = function MapInteractions(options = {}) {
  if(isEmbedded('#' + options.target)) {
    let timeout;
    var mapEl = document.getElementById(options.target);
      var divID = options.target + "-embedded-overlay";
      var divEl = document.createElement("div"); 
      var pEl = document.createElement("p");    
      divEl.setAttribute("id", divID);      
      divEl.setAttribute("class", "o-embedded-overlay");      
      divEl.appendChild(pEl);
      
mapEl.addEventListener('touchmove', e => {
if(e.touches.length > 1 || e.ctrlKey){
divEl.style.transitionDuration = "0.8s";
divEl.style.opacity ="0";
} else {
divEl.style.transitionDuration = "0.3s";
divEl.style.opacity ="1";
pEl.innerHTML="Använd två fingrar för att flytta kartan";
}
 });
 
mapEl.addEventListener('touchend', e => {
divEl.style.transitionDuration = "0.8s";
divEl.style.opacity ="0";
 });
 
mapEl.addEventListener("wheel", function(e) {
if(!e.ctrlKey){
divEl.style.opacity ="1";
divEl.style.transitionDuration = "0.3s";
pEl.innerHTML="Använd ctrl + scroll för att zooma i kartan";
clearTimeout(timeout);
timeout = setTimeout(function(){ 
divEl.style.opacity ="0";
divEl.style.transitionDuration = "0.8s";
 }, 1000);
}
})

      mapEl.appendChild(divEl);
      
    return defaults({dragPan: false, mouseWheelZoom: false}).extend([
    new DragPan({
      condition: function(event) {
        return this.getPointerCount() === 2 || (!touchOnly(event) && noModifierKeys(event));
      }
    }),     
    new MouseWheelZoom({
      condition: function(event) {
        return platformModifierKeyOnly(event);
      }
    })
  ]);
  } else {
    return defaults();
};
}
export default MapInteractions;