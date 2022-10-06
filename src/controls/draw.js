import { Component } from '../ui';
import drawtoolbar from './draw/drawtoolbar';
import { Stylewindow } from './draw/stylewindow';
import dispatcher from './draw/drawdispatcher';

const Draw = function Draw(options = {}) {
  const {
    buttonText = 'Rita',
    palette
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
            detail: {
              interaction: 'draw'
            }
          }));
          // Draw plugin's event system is based on jQuery
          dispatcher.emitEnableDrawInteraction();
          mapMenu.close();
        },
        icon,
        title: buttonText
      });
      drawtoolbar.init({
        viewer,
        options
      });
      const stylewindow = Stylewindow({ target: viewer.getMain().getId(), palette });
      drawtoolbar.restoreState(viewer.getUrlParams());
      this.addComponent(stylewindow);
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
