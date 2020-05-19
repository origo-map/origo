import { Component, Button, dom } from '../ui';

const Zoom = function Zoom(options = {}) {
  let {
    target
  } = options;

  const delta = 1;
  const duration = 250;
  let viewer;
  let zoomIn;
  let zoomOut;


  const zoomByDelta = function zoomByDelta(deltaValue) {
    const map = viewer.getMap();
    const view = map.getView();
    if (view.getAnimating()) {
      view.cancelAnimations();
    }
    view.animate({
      zoom: view.getZoom() + deltaValue,
      duration
    });
  };

  return Component({
    name: 'zoom',
    onAdd(evt) {
      viewer = evt.target;
      if (!target) target = `${viewer.getMain().getNavigation().getId()}`;
      this.on('render', this.onRender);
      this.addComponents([zoomIn, zoomOut]);
      this.render();
    },
    onInit() {
      zoomIn = Button({
        cls: 'o-zoom-in padding-small icon-smaller light round box-shadow',
        click() {
          zoomByDelta(delta);
        },
        icon: '#ic_add_24px',
        tooltipText: 'Zooma in i kartan',
        tooltipPlacement: 'east'
      });
      zoomOut = Button({
        cls: 'o-zoom-out padding-small icon-smaller light round box-shadow',
        click() {
          zoomByDelta(-delta);
        },
        icon: '#ic_remove_24px',
        tooltipText: 'Zooma ut i kartan',
        tooltipPlacement: 'east'
      });
    },
    render() {
      const htmlString = `<div class="o-zoom flex column">
                            ${zoomIn.render()}
                            <div class="padding-smaller"></div>
                            ${zoomOut.render()}
                         </div>`;
      const el = dom.html(htmlString);
      document.getElementById(target).appendChild(el);
      this.dispatch('render');
    }
  });
};

export default Zoom;
