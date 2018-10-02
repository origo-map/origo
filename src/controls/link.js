/*import $ from 'jquery';
import utils from '../utils';

let url;
let title;
let $linkButton;

function render() {

  $('#o-menutools').append(el);
  $linkButton = $('#o-link-button');
}

function bindUIActions() {
  $linkButton.on('click', () => {
    window.open(url);
  });
}

function init(optOptions) {
  const options = optOptions || {};
  url = options.url;
  title = options.title;

  render();
  bindUIActions();
}

export default { init };
*/

import cu from 'ceeu';

const Link = function Link(options = {}) {
  let {
    target
  } = options;

  let viewer;
  let homeButton;
  let extent;

  let url;
  let title;
  let linkButton;
  let linkButton2;

  //let $linkButton;

  /*const zoomToHome = function zoomToHome() {
    viewer.getMap().getView().fit(extent, { duration: 1000 });
  };*/

  return cu.Component({
    onAdd(evt) {
      viewer = evt.target;
      const map = viewer.getMap();
      if (!target) target = `${viewer.getMain().getNavigation().getId()}`;
      if (!extent) extent = map.getView().calculateExtent(map.getSize());
      this.on('render', this.onRender);
      this.addComponents([linkButton]);
      this.render();
    },
    onInit() {
      url = options.url;
      title = options.title;
      linkButton = cu.Button({
        id: 'o-link-button',
        cls: 'o-button-icoooon',
        click() {
          window.open(url);
        },
        text: title,
        icon: '#ic_launch_24px',
        iconCls: 'o-icon-fa-external-link'
      });

/*
<div id="o-share-button" class="o-menu-button">
<div class="o-button-icon">
<svg class="o-icon-fa-share-square-o">
<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#fa-share-square-o"></use>
</svg>
</div>
Dela karta
</div>
*/
let rendered = linkButton.render();
      linkButton2 = cu.Element({
        cls: 'o-link-button',
        innerHTML: `<li><div id="o-link-button" class="o-menu-button">
        ${rendered}
        </div>
        </li>`,
        click() {
          window.open(url);
        }
      });
    /*
      homeButton = cu.Button({
        cls: 'o-home-in padding-small icon-smaller rounded light box-shadow',
        click() {
          zoomToHome();
        },
        icon: '#ic_home_24px'
      });*/
    },
    render() {
      const htmlString = linkButton.render();
      const el = cu.dom.html(htmlString);
      //document.getElementById('o-menutools').appendChild(el);
        const htmlString2 = linkButton2.render();
        const el2 = cu.dom.html(htmlString2);
        document.getElementById('o-menutools').appendChild(el2);
      this.dispatch('render');
    }
  });
};

export default Link;
