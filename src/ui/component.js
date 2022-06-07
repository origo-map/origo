import Cuid from 'cuid';
import isComponent from './utils/iscomponent';
import Eventer from "./utils/eventer";

/**
 * @typedef {Object.<string, *>} ComponentOptions
 * @property {() => (void | string)} render Called to render the component to the DOM
 * @property {() => void} [onInit]          Called after the component has been fully created
 * @property {() => void} [onRender]        Called after the component has been rendered to the DOM
 * @property {(event: { target: Base }) => void} [onAdd]    Called after the component has been added to its parent (which is passed as the event target)
 * @property {(event: { target: Base }) => void} [onClear]  Called after the component has been removed from its parent (which is passed as the event target)
 */

class Base {
  /**
   * There are essentially two ways to implement components, you can either return an HTML string from render
   * and use it from the parent component, or you can directly manipulate the DOM in the render function and
   * not return anything.
   *
   * If you manipulate DOM directly in render you also need to call this.dispatch('render') at the end of it.
   *
   * You should put code to attach event handlers and other things that need the DOM to be populated into onRender,
   * which will be called when the DOM is ready.
   *
   * All properties starting with "on" will be automatically registered as event handlers, for example would "onFoo"
   * be attached to the event "foo".
   *
   * @param {ComponentOptions} options
   */
  constructor(options) {
    this.id = Cuid();
    this.components = [];

    // TODO: replace by inheriting from EventTarget
    this._eventer = new Eventer();
    this.on = this._eventer.on;
    this.un = this._eventer.un;
    this.dispatch = this._eventer.dispatch;

    this._wasOnRenderCalled = false;
    this._onRender = undefined;

    for (const [k, v] of Object.entries(options)) {
      // the onRender event is a special case; it will be run upon the `render` event from the parent component, see below
      if (k === 'onRender') {
        this._onRender = v;
      } else if (k.length >= 5 && k.startsWith('on') && k[2].toUpperCase() === k[2]) {
        const type = k.slice(2).toLowerCase();
        this.on(type, v);
      }
    }

    const opts = { ...options };
    delete opts.onRender;
    Object.assign(this, opts);
    this.render = options.render; // makes it available for autocompletion

    this.on('render', this.onRender);
  }

  onRender() {
    if (this._wasOnRenderCalled) {
      /*
       * onRender should only be called once per component, to set up event handlers etc.
       *
       * There are some parts (mainly the print component) that does not adhere to this right now,
       * so by default this warning is commented out. If you are facing issues like double events
       * firing you may want to uncomment the following line, so that you get warnings if the reason
       * is that onRender has been called more than once.
       */
      // console.warn('onRender was called multiple times on', this.id);
    }
    this._wasOnRenderCalled = true;

    if (this._onRender) {
      /*
       * onRender is where we can do setup that requires the component having been "rendered" to the DOM already,
       * this means that we here can get elements using getElementById and friends, attach event handlers, etc.
       */
      this._onRender();
    }

    for (const child of this.components) {
      child.onRender();
    }
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
    const components = [...this.components];
    this.components = [];
    components.forEach((component) => {
      component.dispatch('clear', { target: this });
    });
  }

  /**
   * @returns {Base[]}
   */
  getComponents() { return this.components; }

  getId() { return this.id; }

  getEl() { return document.getElementById(this.id); }

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
      }

      // convert to string as would usually be done in a template literal
      return `${v}`;
    };

    const interpolated = strings.reduce((accum, str, idx) => accum + str + (idx < values.length ? processValue(values[idx]) : ''), '');

    const firstRight = interpolated.indexOf('>');
    if (interpolated.slice(0, firstRight).includes(' id="')) {
      // top level tag already contains id, don't attempt to inject
      return interpolated;
    }
    // inject id just before end of start tag
    return `${interpolated.slice(0, firstRight - 1)} id="${this.id}" ${interpolated.slice(firstRight)}`;
  }
}

/**
 * @see Base for more information
 *
 * @param {ComponentOptions} options
 * @returns {Base}
 */
export default function Component(options) {
  const component = new Base(options);
  component.dispatch('init');
  return component;
}
