import { Component, Button, dom } from '../ui';
import permalink from '../permalink/permalink';
import isEmbedded from '../utils/isembedded';

const Fullscreen = function Fullscreen(options = {}) {
  let {
    target
  } = options;

  let viewer;
  let fullscreenButton;

  const goFullScreen = function goFullScreen() {
    const url = permalink.getPermalink(viewer);
    window.open(url);
  };

  return Component({
    name: 'fullscreen',
    onAdd(evt) {
      viewer = evt.target;
      fullscreenButton = Button({
        cls: 'o-home-in padding-small icon-smaller round light box-shadow',
        click() {
          goFullScreen();
        },
        icon: '#ic_fullscreen_24px',
        tooltipText: 'Visa stor karta',
        tooltipPlacement: 'east'
      });
      if (!target) target = `${viewer.getMain().getNavigation().getId()}`;
      if (isEmbedded(viewer.getTarget())) {
        this.on('render', this.onRender);
        this.addComponents([fullscreenButton]);
        this.render();
      }
    },
    onInit() {
    },
    render() {
      const htmlString = fullscreenButton.render();
      const el = dom.html(htmlString);
      document.getElementById(target).appendChild(el);
      this.dispatch('render');
    }
  });
};

export default Fullscreen;
