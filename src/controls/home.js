import { Component, Button, dom } from '../ui';

const Home = function Home(options = {}) {
  let {
    extent,
    target
  } = options;
  const {
    zoomOnStart = false
  } = options;

  let viewer;
  let homeButton;

  const zoomToHome = function zoomToHome() {
    viewer.getMap().getView().fit(extent, { duration: 1000 });
  };

  return Component({
    name: 'home',
    onAdd(evt) {
      viewer = evt.target;
      const map = viewer.getMap();
      if (!target) target = `${viewer.getMain().getNavigation().getId()}`;
      if (!extent) extent = map.getView().calculateExtent(map.getSize());
      this.on('render', this.onRender);
      this.addComponents([homeButton]);
      this.render();
      if (zoomOnStart) {
        zoomToHome();
      }
    },
    onInit() {
      homeButton = Button({
        cls: 'o-home-in padding-small icon-smaller round light box-shadow',
        click() {
          zoomToHome();
        },
        icon: '#ic_home_24px'
      });
    },
    render() {
      const htmlString = homeButton.render();
      const el = dom.html(htmlString);
      document.getElementById(target).appendChild(el);
      this.dispatch('render');
    }
  });
};

export default Home;
