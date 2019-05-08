import utils from '../utils';
import { Component } from '../ui';

const addLoading = function addLoading() {
  if (this.loading === 0) {
    this.show();
  }
  this.loading += 1;
  this.update();
};

const addLoaded = function addLoaded() {
  setTimeout(() => {
    this.loaded += 1;
    this.update();
  }, 100);
};

const update = function update() {
  const atZero = 100;
  const percent = ((this.loaded / this.loading) * 100).toFixed(1);
  let width = `${percent}%`;
  if (parseFloat(percent) === 0) {
    width = `${atZero}%`;
  }
  this.element.style.width = width;
  if (this.loading === this.loaded) {
    this.loading = 0;
    this.loaded = 0;
    const thiss = this;
    setTimeout(() => {
      thiss.hide();
    }, 500);
  }
};

const hide = function hide() {
  if (this.loading === this.loaded) {
    this.element.style.visibility = 'hidden';
    this.element.style.width = '100%';
    this.element.style.opacity = 0;
    this.element.style.transition = 'visibility 0s 1s, opacity 1s linear';
  }
};

const show = function show() {
  this.element.style.visibility = 'visible';
  this.element.style.opacity = 1;
};

const Progressbar = function Progressbar() {
  const progressBar = {
    loading: 0,
    loaded: 0,
    addLoading,
    addLoaded,
    update,
    show,
    hide
  };

  function make(target) {
    const element = utils.createElement('div', '', {
      class: 'o-progress',
      id: target.getId()
    });
    const otb = document.querySelector('#o-tools-bottom');
    const div = document.createElement('div');
    div.innerHTML = element;
    const newElement = div.firstChild;
    otb.insertAdjacentElement('beforebegin', newElement);
    progressBar.element = newElement;
  }

  function bindUIActions(target) {
    const map = target.getMap();
    const ls = map.getLayers();
    ls.forEach((l) => {
      if (typeof l.getSource === 'function') {
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
      }
    });
  }
  return Component({
    name: 'progressbar',
    onAdd(evt) {
      const { target } = evt;
      make(target);
      this.render();
      bindUIActions(target);
    },
    render() {
      this.dispatch('render');
    }
  });
};

export default Progressbar;
