import { Component } from "../ui"
import drawtoolbar from './draw/drawtoolbar';
import dispatcher from './draw/drawdispatcher';

const Draw = function Draw(options = {}) {
  const {
    buttonText = 'Rita'
  } = options;

  const icon = '#fa-pencil';

  let viewer;
  let mapMenu;
  let menuItem;

  return Component({
    name: 'draw',
    getState() {
      return drawtoolbar.getState();
    },
    onAdd(evt) {
      viewer = evt.target;
      mapMenu = viewer.getControlByName('mapmenu');
      menuItem = mapMenu.MenuItem({
        click() {
          // For Origo to be able to react properly based on new event system
          document.dispatchEvent(new CustomEvent('toggleInteraction', {
            bubbles: true,
            detail: 'draw'
          }));
          // Draw plugin's event system is based on jQuery
          dispatcher.emitEnableDrawInteraction();
          mapMenu.close();
        },
        icon,
        title: buttonText
      });
      drawtoolbar.init({
        viewer
      });
      drawtoolbar.restoreState(viewer.getUrlParams());
      this.addComponent(menuItem);
      this.render();
    },
    render() {
      mapMenu.appendMenuItem(menuItem);
      this.dispatch('render');
    }
  });
};

export default Draw;
