import cu from 'ceeu';

const Home = function Home(options = {}) {
  let {
    target
  } = options;

  let viewer;
  let homeButton;
  let extent;

  const zoomToHome = function zoomToHome() {
    viewer.getMap().getView().fit(extent, { duration: 1000 });
  };

  return cu.Component({
    onAdd(evt) {
      viewer = evt.target;
      const map = viewer.getMap();
      if (!target) target = `${viewer.getMain().getNavigation().getId()}`;
      if (!extent) extent = map.getView().calculateExtent(map.getSize());
      this.on('render', this.onRender);
      this.addComponents([homeButton]);
      this.render();
    },
    onInit() {
      homeButton = cu.Button({
        cls: 'o-home-in padding-small icon-smaller rounded light box-shadow',
        click() {
          zoomToHome();
        },
        icon: '#ic_home_24px'
      });
    },
    render() {
      const htmlString = homeButton.render();
      const el = cu.dom.html(htmlString);
      document.getElementById(target).appendChild(el);
      this.dispatch('render');
    }
  });
};

export default Home;