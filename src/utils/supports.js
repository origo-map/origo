import renderError from './rendererror';

export default function supports(type, el) {
  const canvas = document.createElement('canvas').getContext;
  const requestAnimationFrame = window.requestAnimationFrame;
  if (!!canvas && !!requestAnimationFrame) {
    return true;
  }
  renderError('browser', el);
  return false;
}
