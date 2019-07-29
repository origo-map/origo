import { Component, Button, dom } from '../../ui';
import { HeaderIcon } from '../../utils/legendmaker';
import Group from './group';

const AddLayerOverlay = function AddLayerOverlay(options) {
  let {
    headerIconCls = ''
  } = options;
  const {
    cls: clsSettings = '',
    icon = 'img/png/void.png',
    iconCls = '',
    layer,
    position = 'top',
    style,
    viewer
  } = options;

  const buttons = [];
  let removeButton;
  let ButtonsHtml;
  let layerList;

  const cls = `${clsSettings} flex row align-center padding-left padding-right item`.trim();
  const title = "Lägg till lager..";//layer.get('title') || 'Titel saknas';

  const getVisible = () => null
  const getLayer = () => { return {getVisible}};


  const layerIcon = Button({
    cls: `${headerIconCls} round compact icon-small light relative no-shrink`,
    style: {
      height: '1.5rem',
      width: '1.5rem'
    },
    icon: icon
  });

  buttons.push(layerIcon);

  const label = Component({
    render() {
      const labelCls = 'text-smaller padding-x-small grow no-select text-nowrap overflow-hidden text-overflow-ellipsis';
      return `<div id="${this.getId()}" class="${labelCls}">${title}</div>`;
    }
  });

  const addButton = Button({
    cls: 'round compact primary icon-small margin-x-smaller',
    click() {
      viewer.dispatch('active:layermanager');
    },
    style: {
      'align-self': 'center'
    },
    icon: '#o_add_24px',
    iconStyle: {
      fill: '#fff'
    }
  });

  buttons.push(addButton);

  ButtonsHtml = `${layerIcon.render()}${label.render()}${addButton.render()}`;

  return Component({
    getLayer,
    onInit() {
    },
    onAdd(evt) {
      layerList = evt.target;
      const parentEl = document.getElementById(evt.target.getId());
      const htmlString = this.render();
      const el = dom.html(htmlString);
      if (position === 'top') {
        parentEl.insertBefore(el, parentEl.firstChild);
      } else {
        parentEl.appendChild(el);
      }
      viewer.on('search:open', () =>{
        document.getElementById('hjl').nextSibling.appendChild(document.createElement("button"))
      })
      this.addComponents(buttons);
      this.addComponent(label);
      this.dispatch('render');
    },
    render() {
      return `<li id="${this.getId()}" class="${cls}">${ButtonsHtml}</li>`;
    }
  });
};

export default AddLayerOverlay;
