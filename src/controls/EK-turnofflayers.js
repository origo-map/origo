import { Component } from '../ui';

let Turnofflayers = function Turnofflayers(options = {}) {
  let viewer;
  let alwaysShow;
 
  let filterByAlwaysShow = (el) => {
    let hide = false;
    for(let layer of alwaysShow){
      if (layer.get('name') == el.get('name') || el.get('group') == 'background') {
        hide = true;
        break;
      }
    }
    return hide;
  }

  const closeAllLayer = function closeAllLayer(){
    let layers = viewer.getLayersByProperty('visible', true);
    layers.forEach(el => {
      el.setVisible(filterByAlwaysShow(el));   
    });
  };

  return Component({
    onAdd(e) {
      viewer = e.target;
      alwaysShow = viewer.getLayersByProperty('visible', true);
      viewer.on("active:turnofflayers",closeAllLayer);
      this.render();
    },
    render() {
      this.dispatch('render');     
    }
  })
}

export default Turnofflayers;

