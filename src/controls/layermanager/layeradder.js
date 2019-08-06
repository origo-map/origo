//import 'Origo';
import { Component, Element as El, Button, dom } from '../../ui';
import readAsync from './readasync';

const LayerAdder = function LayerAdder(options = {}) {
  const {
    layerId,
    cls: clsSettings = 'round compact boxshadow-subtle text-inverse icon-small',
    addIcon = '#ic_add_24px',
    removeIcon = '#ic_remove_24px',
    sourceUrl,
    type = 'layer',
    title,
    src,
    viewer,
    layersDefaultProps
  } = options;

  const layer = viewer.getLayer(layerId);
  const group = viewer.getGroup(layerId);
  const initialState = layer || group ? 'remove' : 'initial';
  const initialIcon = initialState === 'initial' ? addIcon : removeIcon;
  const initialBgCls = initialState === 'initial' ? 'primary' : 'danger';
  const cls = `${clsSettings} layeradder ${initialBgCls}`.trim();
  const isValid = src == "no src" ? "hidden" : "visible" //decides hide or show button, depends if src exist for layer

  const fetchLayer = async function fetchLayer() {
    const body = JSON.stringify([{
      id: layerId,
      type
    }]);
    try {
      const result = await fetch(sourceUrl, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        },
        method: 'POST',
        mode: 'cors',
        body
      }).then(response => response.json());
      return result;
    }
    catch (err) {
      console.log(err);
    }
  };

  const addSources = function addSources(sources) {
    Object.keys(sources).forEach((sourceName) => {
      viewer.addSource(sourceName, sources[sourceName]);
    });
  };

  const addStyles = function addStyles(styles) {
    Object.keys(styles).forEach((styleName) => {
      viewer.addStyle(styleName, styles[styleName]);
    });
  };  

  const initial = function initial() {
    this.setIcon(addIcon);
    const el = document.getElementById(this.getId());
    el.classList.remove('danger');
    el.classList.add('primary');    
  };

  const remove = function remove() {
    this.setIcon(removeIcon);
    const el = document.getElementById(this.getId());
    el.classList.remove('primary');
    el.classList.add('danger');
  };

  const click = async function click() {
    if (this.getState() === 'remove') {
      const layer = viewer.getLayer(layerId);
      if (layer) {
        viewer.getMap().removeLayer(layer);
        this.setState('initial');
        return 'intial';
      }
      const group = viewer.getGroup(layerId);
      if (group) {
        viewer.removeGroup(layerId);
        this.setState('initial');
        return 'initial';
      }
    } else if (this.getState() === 'initial') {
      this.setState('loading');
      //add layers with same format as in config-json
        let srcUrl = src
        if (src[src.length-1] == '?') srcUrl = src.substring(0,src.length-1) //some extra '?' from request breaks the url
        let layer = {
          name: layerId,
          title: title,
          removable: true,
          source: srcUrl
        }
        layer = Object.assign(layer, layersDefaultProps)

        let srcObject = {}
        srcObject[`${srcUrl}`] = {url : srcUrl}
        addSources(srcObject);
        viewer.addLayer(layer);
        this.setState('remove');
    }
  };

  return Button({
    style: `visibility: ${isValid}`, //hide button if you cant add it
    click,
    cls,
    icon: initialIcon,
    iconStyle: {
      fill: '#fff'
    },
    validStates: ['initial', 'remove'],
    methods: {
      initial,
      remove
    },
    state: initialState
  });
}

export default LayerAdder;