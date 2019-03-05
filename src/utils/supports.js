export default function supports() {
  const canvas = document.createElement('canvas').getContext;
  const requestAnimationFrame = window.requestAnimationFrame;
  if (!!canvas && !!requestAnimationFrame) {
    return true;
  }
  return false;
}
