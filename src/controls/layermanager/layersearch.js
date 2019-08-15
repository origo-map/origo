//import 'Origo';
import { Component, Element as El, Button, dom } from '../../ui';
import cuid from '../../ui/utils/cuid';

const LayerSearch = function LayerSearch(options = {}) {
  const {
    cls = '',
    placeholder = 'Sök lager i katalogen',
    style: styleOptions = {
      height: '2.125rem',
      width: 'calc(100% - 4rem)'
    }
  } = options;

  const keyCodes = {
    9: 'tab',
    16: 'shift',
    17: 'ctrl',
    27: 'esc',
    37: 'left',
    39: 'right',
    13: 'enter',
    38: 'up',
    40: 'down'
  };

  const style = dom.createStyle(styleOptions);
  let searchText = '';
  let searchEl;
  const searchId = cuid();
  let clearButton;
  let searchButton;
  let typingTimer;

  return Component({
    onInit() {
      clearButton = Button({
        cls: 'compact icon-smaller no-shrink hidden',
        icon: '#ic_close_24px',
        style: {
          'align-self': 'flex-end'
        },
        state: 'hidden',
        validStates: ['initial', 'hidden'],
        click: () => {
          searchEl.value = '';
          this.toggleSearchState('');
        }
      });
      searchButton = Button({
        cls: 'compact icon-smaller no-shrink',
        icon: '#ic_search_24px'
      });
      this.addComponent(clearButton);
    },
    onRender() {
      searchEl = document.getElementById(searchId);
      searchEl.addEventListener('keyup', this.onSearch.bind(this));
      searchEl.focus();
      this.dispatch('render');
    },
    render() {
      searchText = ''
      clearButton.setState('hidden')
      return `<div id="${this.getId()}" class="flex row align-center no-grow no-shrink bg-grey-lightest padding-small margin-bottom rounded ${cls}" style="${style}">
                ${searchButton.render()}
                <input id="${searchId}" class="flex grow padding-left-small search small grey" placeholder="${placeholder}">
                ${clearButton.render()}
              </div>`
    },
    onSearch(e) {
      const key = e.keyCode;
      if (key == 27) return; //allows layermanager.checkESC to execute when ESC is pressed.
      e.stopPropagation();
      if (!(key in keyCodes)) {
        const currentSearchValue = searchEl.value || ''
        const currentSearchText = currentSearchValue.toLowerCase();
        this.toggleSearchState(currentSearchText);
      }
    },
    toggleSearchState(newSearchText) {
      if (newSearchText !== searchText) {
        if (!(newSearchText.length)) {
          clearButton.setState('hidden');
        } else if (newSearchText.length && !(searchText.length)) {
          clearButton.setState('initial');
        }
        searchText = newSearchText;
        clearTimeout(typingTimer)
        setTimeout(() => {
          this.dispatch('change:text', { searchText })
        }, 200)
      }
    }
  });
}

export default LayerSearch;