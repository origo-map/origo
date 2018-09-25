import cu from 'ceeu';
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

  return cu.Component({
    onAdd(evt) {
      viewer = evt.target;
      fullscreenButton = cu.Button({
        cls: 'o-home-in padding-small icon-smaller rounded light box-shadow',
        click() {
          goFullScreen();
        },
        icon: '#ic_fullscreen_24px'
      });
      if (!target) target = `${viewer.getMain().getNavigation().getId()}`;
      this.on('render', this.onRender);
      this.addComponents([fullscreenButton]);
      this.render();
    },
    onInit() {
    },
    render() {
      const htmlString = fullscreenButton.render();
      const el = cu.dom.html(htmlString);
      if (isEmbedded(viewer.getTarget())) {
        document.getElementById(target).appendChild(el);
      }
      document.getElementById(target).appendChild(el);
      this.dispatch('render');
    }
  });
};

export default Fullscreen;
