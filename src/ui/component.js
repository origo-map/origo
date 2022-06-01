import Cuid from 'cuid';
import isComponent from './utils/iscomponent';
import Eventer from "./utils/eventer";

class Base {
  constructor(options) {
    this.id = Cuid();
    this.components = [];

    // TODO: replace by inheriting from EventTarget
    this._eventer = new Eventer();
    this.on = this._eventer.on;
    this.un = this._eventer.un;
    this.dispatch = this._eventer.dispatch;

    for (const [k, v] of Object.entries(options)) {
      if (k === "onRender") {
        // the onRender event is a special case; it will be run upon the `render` event from the parent component
        this.on('add', (evt = {}) => {
          if (evt.target && isComponent(evt.target)) {
            const addListener = v.bind(this);
            evt.target.on('render', addListener);
            this.on('clear', () => {
              evt.target.un('render', addListener);
            });
          }
        });
      } else if (k.length >= 5 && k.startsWith("on") && k[2].toUpperCase() === k[2]) {
        const type = k.slice(2).toLowerCase();
        this.on(type, v);
      }
    }
    Object.assign(this, options);
  }

  addComponent(child) {
    if (this.components.includes(child)) {
      return child;
    }
    this.components.push(child);
    child.dispatch('add', { target: this });
    return child;
  }
  addComponents(children) {
    children.forEach((child) => {
      this.addComponent(child);
    });
  }
  removeComponent(component) {
    const index = this.components.indexOf(component);
    if (index > -1) {
      this.components.splice(index, 1);
      component.dispatch('clear', { target: this });
    }
  }
  clearComponents() {
    this.components.forEach((component) => {
      component.dispatch('clear', { target: this });
    });
    this.components = [];
  }

  getComponents() { return this.components; }
  getId() { return this.id; }

  /**
   * This method can be used inside of component `render` functions for tagged template literals.
   *
   * It will call the render methods of interpolated child components, and also ensure that they are added as children
   * to the rendered component. It will also inject the id of this component to the top level tag.
   *
   * @param {string[]} strings
   * @param {(Base|any)[]} values
   * @returns {string}
   */
  html(strings, ...values) {
    const processValue = (v) => {
      if (isComponent(v)) {
        this.addComponent(v);
        return v.render();
      } else {
        // convert to string as would usually be done in a template literal
        return `${v}`;
      }
    };

    const interpolated = strings.reduce(
        (accum, str, idx) => accum + str + (idx < values.length ? processValue(values[idx]) : ''),
        '');

    const firstRight = interpolated.indexOf('>');
    if (interpolated.slice(0, firstRight).includes(' id="')) {
      // top level tag already contains id, don't attempt to inject
      return interpolated;
    }
    // inject id just before end of start tag
    return interpolated.slice(0, firstRight-1) + ` id="${this.id}"` + interpolated.slice(firstRight);
  }
}

export default function Component(options) {
  const component = new Base(options);
  component.dispatch('init');
  return component;
}
