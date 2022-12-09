import Cuid from 'cuid';
import Eventer from './utils/eventer';
import isComponent from './utils/iscomponent';

const Base = function Base() {
  const id = Cuid();
  let components = [];

  return {
    addComponent(child) {
      const evt = { target: this };
      if (components.includes(child)) {
        return child;
      }
      components.push(child);
      child.dispatch('add', evt);
      return child;
    },
    addComponents(children) {
      children.forEach((child) => {
        this.addComponent(child);
      });
    },
    clearComponents() {
      components.forEach((component) => {
        component.dispatch('clear', { target: this });
      });
      components = [];
    },
    getComponents: () => components,
    getId: () => id,
    removeComponent(component) {
      const index = components.indexOf(component);
      if (index > -1) {
        components.splice(index, 1);
        component.dispatch('clear', { target: this });
      }
    }
  };
};

const Component = function Component(options) {
  const addAddListener = function addAddListener(component) {
    const onAdd = function onAdd(evt = {}) {
      if (evt.target) {
        if (isComponent(evt.target)) {
          const addListener = component.onRender.bind(component);
          evt.target.on('render', addListener);
          component.on('clear', () => {
            evt.target.un('render', addListener);
          });
        }
      }
    };
    component.on('add', onAdd);
  };

  const createComponent = function createComponent(component) {
    if (component.onInit) {
      component.on('init', component.onInit);
    }
    if (component.onAdd) {
      component.on('add', component.onAdd);
    } else if (component.onRender) {
      addAddListener(component);
    }
    component.dispatch('init');
    return Object.create(component);
  };
  return createComponent(Object.assign({}, Eventer(), Base(), options));
};

export default Component;
