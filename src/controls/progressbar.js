import v from '../viewer';
import u from '../utils';

let firstChild;
let progressBar;

function addLoading() {
  if (this.loading === 0) {
    this.show();
  }
  this.loading += 1;
  this.update();
}

function addLoaded() {
  setTimeout(() => {
    this.loaded += 1;
    this.update();
  }, 100);
}

function update() {
  const atZero = 100;
  const percent = ((this.loaded / this.loading) * 100).toFixed(1);
  let width = `${percent}%`;
  if (parseFloat(percent) === 0) {
    width = `${atZero}%`;
  }
  this.el.style.width = width;
  if (this.loading === this.loaded) {
    this.loading = 0;
    this.loaded = 0;
    const thiss = this;
    setTimeout(() => {
      thiss.hide();
    }, 500);
  }
}

function show() {
  this.el.style.visibility = 'visible';
  this.el.style.background = 'red';
  this.el.style.opacity = 1;
}

function hide() {
  if (this.loading === this.loaded) {
    this.el.style.visibility = 'hidden';
    this.el.style.width = '100%';
    this.el.style.background = 'red';
    this.el.style.opacity = 0;
    this.el.style.transition = 'visibility 0s 1s, opacity 1s linear';
  }
}

function render(target) {
  const el = u.createElement('div', '', { id: target });
  const otb = document.querySelector('#o-tools-bottom');
  const div = document.createElement('div');
  div.innerHTML = el;
  firstChild = div.firstChild;
  otb.insertAdjacentElement('afterbegin', firstChild);
}

function bindUIActions() {
  const m = v.getMap();
  const ls = m.getLayers();
  ls.forEach((l) => {
    const so = l.getSource();
    so.on('change', () => {
      progressBar.addLoading();
      if (so.getState() === 'ready') {
        progressBar.addLoaded();
      }
    });
    so.on('tileloadstart', () => {
      progressBar.addLoading();
    });
    so.on('tileloadend', () => {
      progressBar.addLoaded();
    });
    so.on('tileloaderror', () => {
      progressBar.addLoaded();
    });
  });
}

function init(optOptions) {
  const options = optOptions || {};
  const target = options.target || 'o-progress';
  render(target);
  progressBar = {
    el: firstChild,
    loading: 0,
    loaded: 0,
    addLoaded,
    addLoading,
    update,
    show,
    hide
  };
  bindUIActions();
}
export default { init };
