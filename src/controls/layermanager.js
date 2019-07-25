//import'Origo';
import FilterMenu from './layermanager/filtermenu';
import LayerListStore from './layermanager/layerliststore';
import Main from './layermanager/main';
import layerRequester from './layermanager/layerrequester';
import { Component, Element as El, Button, dom } from '../ui';

const Layermanager = function Layermanager(options = {}) {
  let {
    target
  } = options;
  const {
    cls: clsSettings = 'control width-52',
    sourceFields,
    url,
    sourceUrl
  } = options;
 
  const cls = `${clsSettings} flex fade-in box center-center padding-y-small padding-left layer-manager overflow-hidden`.trim();

  let filterMenu;
  let main;
  let viewer;
  let isActive = false

  const clearCls = 'absolute round small icon-smaller grey-lightest';
  const icon = '#ic_clear_24px';
  const closeButton = Button({
    cls: clearCls,
    icon,
    style: {
      right: '1rem',
      top: '1rem'
    }
  });

  const setActive = function setActive() {
    if(!isActive){
      isActive = true
      this.render();
    }
  };

  const onClickClose = function onClickClose() {
    document.getElementById(this.getId()).remove();
    isActive = false
    this.dispatch('close');
  };

  return Component({
    onAdd(e) {
      console.log("layermanager onAdd");
      viewer = e.target;
      viewer.on('active:layermanager', setActive.bind(this));
      main = Main({ 
        viewer,
        sourceFields,
        sourceUrl,
        url
      });
      filterMenu = FilterMenu();
      this.addComponent(closeButton);
      this.addComponent(main);
      this.addComponent(filterMenu);
      closeButton.on('click', onClickClose.bind(this));
    },
    onInit() {
      this.on('render', this.onRender);
    },
    onRender() {
      LayerListStore.clear();
      layerRequester({ url });
    },
    render() {
      const template = `
        <div id="${this.getId()}" class="${cls}" style="height: 700px;">      
          <div class="relative padding-y flex overflow-hidden width-100" ">
            <div class="flex row width-100 overflow-hidden">
              ${filterMenu.render()}
              ${main.render()}
            </div>
          </div>
          ${closeButton.render()}  
        </div>
      `;
    
      const elLayerManger = dom.html(template);
      document.getElementById(viewer.getMain().getId()).appendChild(elLayerManger);
      this.dispatch('render');
    }
  });
}

//if (window.Origo) {
//  Origo.controls.Layermanager = Layermanager;
//}

export default Layermanager;