import { Component, Dropdown, dom } from '../ui';
import mapUtils from '../maputils';

const Scalepicker = function Scalepicker(options = {}) {
  const {
    buttonPrefix = '',
    listItemPrefix = ''
  } = options;
  let map;
  let viewer;
  let projection;
  let resolutions;
  let dropdown;

  function getScales() {
    return resolutions.map(resolution => `${listItemPrefix}${mapUtils.resolutionToFormattedScale(resolution, projection)}`);
  }

  function setMapScale(scale) {
    const scaleDenominator = parseInt(scale.replace(/\s+/g, '').split(':').pop(), 10);
    const resolution = mapUtils.scaleToResolution(scaleDenominator, projection);

    map.getView().animate({ resolution });
  }

  function onZoomChange() {
    dropdown.setButtonText(`${buttonPrefix}${mapUtils.resolutionToFormattedScale(map.getView().getResolution(), projection)}`);
  }

  return Component({
    name: 'scalepicker',
    onAdd(evt) {
      viewer = evt.target;
      map = viewer.getMap();

      projection = map.getView().getProjection();
      resolutions = viewer.getResolutions();

      this.addComponent(dropdown);
      this.render();

      dropdown.setButtonText(`${buttonPrefix}${mapUtils.resolutionToFormattedScale(map.getView().getResolution(), projection)}`);
      dropdown.setItems(getScales());

      map.getView().on('change:resolution', onZoomChange);
    },
    onInit() {
      dropdown = Dropdown({
        direction: 'up',
        cls: 'o-scalepicker text-white flex',
        contentCls: 'bg-grey-darker text-smallest rounded',
        buttonCls: 'bg-black text-white',
        buttonIconCls: 'white'
      });
    },
    render() {
      const el = dom.html(dropdown.render());
      document.getElementById(viewer.getFooter().getId()).firstElementChild.appendChild(el);
      this.dispatch('render');

      document.getElementById(dropdown.getId()).addEventListener('dropdown:select', (evt) => {
        setMapScale(evt.target.textContent);
      });
    }
  });
};

export default Scalepicker;
