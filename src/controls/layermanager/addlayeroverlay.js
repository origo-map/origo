import { Component, Button, dom } from '../../ui';
import { HeaderIcon } from '../../utils/legendmaker';
import layerRequester from './layerrequester';

//Specialized/Adjusted overlay.js for "add layer"-button
//tricking origo it is a normal overlay
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
    viewer,
    url
  } = options;

  const buttons = [];
  let removeButton;
  let ButtonsHtml;
  let layerList;

  const cls = `${clsSettings} flex row align-center padding-left padding-right item`.trim();
  const title = "Lägg till lager..";

  //Overlays are expected to have these functions
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

  //Button in legends
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

  //Button in search
  const addButtonSearch = Button({
    cls: 'round compact primary icon-small margin-x-smaller',
    style: {
      'align-self': 'center',
      'float': 'right'
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
      let searchAddButton = `
      <li>
        <div class="suggestion" style="background: #bee8ff;cursor: initial;">
          <span style="font-weight: 600;">
            Lägg till lager för att expandera sök..
          </span>
          ${addButtonSearch.render()}
        </div>
      </li>`
      //when search suggestions open, add the "add-layer"-button to bottom of it
      //Also set click event to show layermanager GUI and request current searchstring
      viewer.on('search:open', () =>{
        document.getElementById('hjl').nextSibling.appendChild(dom.html(searchAddButton))
        document.getElementById(addButtonSearch.getId()).addEventListener('click', (e) => {
          viewer.dispatch('active:layermanager')
          let id = viewer.getControlByName("layermanager").getId()
          let layermanager = document.getElementById(id)
          let search = layermanager.getElementsByTagName('input')[0]
          search.value = document.getElementById('hjl').value
          layerRequester({ searchText : search.value, url });
        })
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
