/* Download callback is used to handle the changes in layer rendering that
 * was introduced in ol 6. In ol 6 opacity is set in the parent of each layer canvas
 * which prevents reading correct opacity in the canvas when convertering to an image format.
 */

// set opacity for all canvas elements that have a parent with opacity
const setCanvasOpacity = function setCanvasOpacity({ el, inheritFromParent = true }) {
  const canvasEls = [...el.querySelectorAll('canvas')];
  canvasEls.forEach((canvasEl) => {
    const opacity = canvasEl.parentNode.style.opacity;
    if (!opacity) {
      return;
    }
    const ctx = canvasEl.getContext('2d');
    if (!inheritFromParent) {
      ctx.globalAlpha = 1;
      return;
    }
    ctx.globalAlpha = opacity;
  });
};

export const beforeRender = function beforeRender(map) {
  return (el) => {
    setCanvasOpacity({ el });
    map.renderSync();
  };
};

export const afterRender = function afterRender(map) {
  return (el) => {
    setCanvasOpacity({ el, inheritFromParent: false });
    map.render();
  };
};
