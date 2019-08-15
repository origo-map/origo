//import 'Origo'
import LayerAdder from './layeradder';
import { Component, Element as El, Button, dom } from '../../ui';
import { Collapse, CollapseHeader } from '../../ui';

const layerItem = function layerItem(options = {}) {
  const {
    style: styleOptions = {},
    data = {},
    cls: clsOptions = '',
    sourceUrl,
    viewer,
    sourceFields,
    layersDefaultProps
  } = options;

  const {
    title,
    layerId,
    description,
    type,
    src
  } = sourceFields;
  const cls = `${clsOptions} item`.trim();
  const style = dom.createStyle(styleOptions);
  let layerAdder;
  
  const headerComponent = CollapseHeader({
    title: `${data[title.name]}`,
    cls: "text-black text-grey-dark text-normal text-weight-bold",
    style: {"flex-grow": "unset"}
  });
  const contentComponent = El({
    tagName: 'p',
    innerHTML: `${data[description.name]}`,
    cls: "text-grey text-smaller text-height-smaller text-fade"
  })
  const collapse = Collapse({
    cls: '',
    headerComponent,
    contentComponent,
    collapseX: false,
    contentStyle: { "min-height": "35px" }
  });

  return Component({
    getData: () => data,
    onInit() {
      layerAdder = LayerAdder({ 
        viewer,
        layerId: data[layerId.name],
        title: data[title.name],
        type: data[type.name],
        src: data[src.name],
        sourceUrl,
        abstract: data[description.name],
        layersDefaultProps
      });
      this.addComponent(layerAdder);
    },
    onRender() {
      this.dispatch('render');
    },
    render() {
      let textElements = `<div class="text-black text-grey-dark text-normal text-weight-bold">${data[title.name]}</div>
                          <p class="relative text-grey text-smaller text-height-smaller text-fade overflow-hidden">${data[description.name]}</p>`
      if (data[description.name].length > 166){
        this.addComponent(collapse);
        textElements = `${collapse.render()}`;
      }
      return `<li id="${this.getId()}" class="${cls}" style="${style}">
              <div class="flex row">
                  <div class="grow">
                    ${textElements}
                    </div>
                  <div class="flex no-grow no-shrink align-center padding-x-small">
                    ${layerAdder.render()}
                  </div>
                </div>
             </li>`
    }
  });
}

export default layerItem;