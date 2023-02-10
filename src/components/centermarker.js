import { Component, Icon, dom } from '../ui';

export default function CenterMarker() {
  let viewer;
  let markerEl;

  function createMarker() {
    const markerIcon = Icon({
      icon: '#o_centerposition_24px',
      cls: 'o-position-marker hidden'
    });
    const markerElement = dom.html(markerIcon.render());
    document.getElementById(`${viewer.getId()}`).appendChild(markerElement);
    markerEl = document.getElementById(markerIcon.getId());
  }

  return Component({
    name: 'centermarker',
    onAdd(evt) {
      viewer = evt.target;
      createMarker();
    },
    hide: function hide() {
      markerEl.classList.add('hidden');
    },
    show: function hide() {
      markerEl.classList.remove('hidden');
    }
  });
}
