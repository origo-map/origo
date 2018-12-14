import { createElement } from './dom/dom';
import Component from './component';

export default function Element(options = {}) {
  let {
    target
  } = options;
  const {
    cls = '',
    components = [],
    innerHTML = '',
    style = {},
    tagName = 'div'
  } = options;
  const renderSettings = {
    cls,
    style
  };
  let el;

  const setTarget = (targetEl) => {
    target = targetEl;
  };

  const renderComponents = comps => comps.reduce((acc, comp) => acc + comp.render(), '');

  return Component({
    getTarget: () => target,
    onInit() {
      renderSettings.id = this.getId();
      this.addComponents(components);
    },
    onRender() {
      this.dispatch('render');
    },
    render() {
      el = createElement(tagName, innerHTML, renderSettings);
      if (this.getComponents().length) {
        el.innerHTML = renderComponents(this.getComponents());
      }
      if (target) {
        target.appendChild(el);
        this.dispatch('render');
      } else {
        return el.outerHTML;
      }
      return el;
    },
    setTarget
  });
}
