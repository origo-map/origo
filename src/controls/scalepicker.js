import { Component, Dropdown, dom } from '../ui';
import mapUtils from '../maputils';

const Scalepicker = function Scalepicker() {
  let map;
  let viewer;
  let projection;
  let resolutions;
  let dropdown;

  const roundScale = (scale) => {
    let scaleValue = scale;
    const differens = scaleValue % 10; // is the number not even?
    if (differens !== 0) {
      scaleValue += (10 - differens);
    }
    return scaleValue;
  };

  function getCurrentMapScale() {
    return roundScale(mapUtils.resolutionToScale(map.getView().getResolution(), projection));
  }

  function getScales() {
    return resolutions.map(resolution => `1:${roundScale(mapUtils.resolutionToScale(resolution, projection))}`);
  }

  function setMapScale(scale) {
    const scaleDenominator = parseInt(scale.split(':').pop(), 10);
    const resolution = mapUtils.scaleToResolution(scaleDenominator, projection);

    map.getView().setResolution(resolution);
  }

  function onZoomChange() {
    dropdown.setButtonText(`1:${getCurrentMapScale()}`);
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

      dropdown.setButtonText(`1:${getCurrentMapScale()}`);
      dropdown.setItems(getScales());

      map.getView().on('change:resolution', onZoomChange);
    },
    onInit() {
      // dropdown = Dropdown({
      //   direction: 'up',
      //   cls: 'o-scalepicker text-white',
      //   containerCls: 'bg-grey-darker',
      //   buttonContainerCls: 'height-125',
      //   buttonCls: 'rounded bg-black text-smallest text-white',
      //   buttonIconCls: 'white'
      // });

      dropdown = Dropdown({
        direction: 'up',
        cls: 'o-scalepicker text-white text-smallest flex',
        containerCls: 'bg-grey-darker margin-bottom-smallest',
        buttonContainerCls: 'height-125',
        buttonCls: 'rounded bg-black text-smallest text-white',
        buttonIconCls: 'white'
      });
    },
    render() {
      const el = dom.html(dropdown.render());
      document.getElementById(viewer.getFooter().getId()).firstElementChild.appendChild(el);

      // const parent = document.getElementById(viewer.getFooter().getId()).firstElementChild;
      // parent.insertBefore(el, parent.firstChild)
      // document.getElementById(viewer.getFooter().getId()).firstElementChild;

      // document.getElementById(viewer.getMain().getBottomTools().getId()).appendChild(el);
      // document.getElementById(viewer.getMain().getId()).appendChild(el);
      this.dispatch('render');

      document.getElementById(dropdown.getId()).addEventListener('dropdown:select', (evt) => {
        setMapScale(evt.target.textContent);
      });
    }
  });
};

export default Scalepicker;
