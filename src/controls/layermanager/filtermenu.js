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
  const titles = ["Bebyggelse", "Politik och statistik","Samhällsplanering och bestämmelse","Teknisk infrastruktur","Trafik och kommunikation","Uppleva och göra"];
  let viewer;

  function createButtons(titles){
    let buttons = [];
    let searchText = 'Bebyggelse'
    titles.forEach(currentTitle => {
      buttons.push(Button({
        cls: "medium rounded width-full light text-align-left text-color-grey text-nowrap text-overflow-ellipsis",
        click() {
          viewer.dispatch('change:text', { searchText });
        },
        text: currentTitle
      }))
    })
    return buttons;
  }

  function renderButtons(buttons){
    let list = '';
    buttons.forEach(button => {
      list += `<li>${button.render()}</li>`;
      console.log(button.render());
    });
    return list;
  }

  let buttons;
  return Component({
    onAdd(e) {
      viewer = e.target;
    },
    onInit() {
      buttons = createButtons(titles);
      this.addComponents(buttons);
    },
    onRender() {
      console.log("ON RENDER ON FILTER");
      this.dispatch('render');
    },
    render() {
      return `<div class="${cls}" style="${style}">
                <h6 class="text-weight-bold text-grey-dark">Teman</h6>
                <ul>
                  ${renderButtons(buttons)}
                </ul>
              </div>`;
    }
  });
}

export default FilterMenu;