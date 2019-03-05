import { Component } from '../../ui';

// Container component for theme groups
const ThemeGroups = function ThemeGroups() {
  let el;

  const getEl = () => el;

  return Component({
    getEl,
    onRender() {
      el = document.getElementById(this.getId());
      this.dispatch('render');
    },
    render() {
      const content = this.getComponents().reduce((acc, cmp) => acc + cmp.render(), '');
      return `<div id="${this.getId()}">${content}</div>`;
    }
  });
};

export default ThemeGroups;
