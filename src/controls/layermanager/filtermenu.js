//import'Origo';
import { Component, Element as El, Button, dom } from '../../ui';

const FilterMenu = function FilterMenu(options = {}) {
  let {
    target
  } = options;
  const {
    style: styleOptions = {},
    cls: clsOptions = ''
  } = options;
  const defaultStyle = {
    'flex-basis': '220px'
  };
  const styleSettings = Object.assign({}, defaultStyle, styleOptions);
  const style = dom.createStyle(styleSettings);
  const cls = `${clsOptions} padding-x no-grow no-shrink filter-menu`.trim();

  return Component({
    render() {
      return `<div class="${cls}" style="${style}">
                <h6 class="text-weight-bold text-grey-dark">Teman</h6>
                <ul>
                  <li><button class="medium rounded width-full light text-align-left text-color-grey text-nowrap text-overflow-ellipsis">Bebyggelse</button></li>
                  <li><button class="medium rounded width-full light text-align-left text-color-grey text-nowrap text-overflow-ellipsis">Politik och statistik</button></li>
                  <li><button class="medium rounded width-full light text-align-left text-color-grey text-nowrap text-overflow-ellipsis">Samhällsplanering och bestämmelser</button></li>
                  <li><button class="medium rounded width-full light text-align-left text-color-grey text-nowrap text-overflow-ellipsis">Teknisk infrastruktur</button></li>
                  <li><button class="medium rounded width-full light text-align-left text-color-grey text-nowrap text-overflow-ellipsis">Trafik och kommunikation</button></li>
                  <li><button class="medium rounded width-full light text-align-left text-color-grey text-nowrap text-overflow-ellipsis">Uppleva och göra</button></li>
                </ul>
              </div>`;
    }
  });
}

export default FilterMenu;