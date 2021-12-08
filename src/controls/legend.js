import Awesomplete from 'awesomplete';
import {
  Component, Button, Element as El, ToggleGroup, dom, Input
} from '../ui';
import imageSource from './legend/imagesource';
import Overlays from './legend/overlays';
import LayerProperties from './legend/overlayproperties';

const Legend = function Legend(options = {}) {
  const {
    cls: clsSettings = '',
    style: styleSettings = {},
    autoHide = 'never',
    expanded = true,
    contentCls,
    contentStyle,
    turnOffLayersControl = false,
    name = 'legend',
    labelOpacitySlider = '',
    useGroupIndication = true,
    searchLayersControl = false,
    searchLayersMinLength = 2,
    searchLayersLimit = 10,
    searchLayersParameters = ['name', 'title']
  } = options;
  const keyCodes = {
    9: 'tab',
    27: 'esc',
    37: 'left',
    39: 'right',
    13: 'enter',
    38: 'up',
    40: 'down'
  };

  let viewer;
  let target;
  let awesomplete;
  let mainContainerCmp;
  let overlaysCmp;
  let mainContainerEl;
  const backgroundLayerButtons = [];
  let toggleGroup;
  let layerSwitcherEl;
  let closeButton;
  let layerButton;
  let layerButtonEl;
  let isExpanded;
  let toolsCmp;
  const cls = `${clsSettings} control bottom-right box overflow-hidden flex row o-legend`.trim();
  const style = dom.createStyle(Object.assign({}, { width: 'auto' }, styleSettings));

  const setTabIndex = function setTabIndex() {
    let idx = -1;
    if (isExpanded) {
      idx = 0;
    }
    for (let i = 0; i < document.getElementById(mainContainerCmp.getId()).getElementsByTagName('button').length; i += 1) {
      // Skip if it's slidenav button and not expanded otherwise set tab index
      if (document.getElementById(mainContainerCmp.getId()).getElementsByTagName('button')[i].tabIndex !== -99) {
        if (document.getElementById(mainContainerCmp.getId()).getElementsByTagName('button')[i].closest('.collapse') !== null) {
          if (document.getElementById(mainContainerCmp.getId()).getElementsByTagName('button')[i].closest('.collapse').className.indexOf('expanded') !== -1) {
            document.getElementById(mainContainerCmp.getId()).getElementsByTagName('button')[i].tabIndex = idx;
          }
        }
      }
    }
  };

  const addBackgroundButton = function addBackgroundButton(layer) {
    const styleName = layer.get('styleName') || 'default';
    const icon = viewer.getStyle(styleName) ? imageSource(viewer.getStyle(styleName)) : 'img/png/farg.png';
    backgroundLayerButtons.push(Button({
      icon,
      cls: 'round smallest border icon-small',
      title: layer.get('title'),
      state: layer.get('visible') ? 'active' : undefined,
      methods: {
        active: () => layer.setVisible(true),
        initial: () => layer.setVisible(false)
      },
      click() {
        if (overlaysCmp.slidenav.getState() === 'initial') {
          const slided = document.getElementById(overlaysCmp.slidenav.getId()).classList.contains('slide-secondary');
          if (this.getState() === 'active' && !slided) {
            const layerProperties = LayerProperties({ layer, viewer, parent: this });
            overlaysCmp.slidenav.setSecondary(layerProperties);
            overlaysCmp.slidenav.slideToSecondary();
          } else if (slided) {
            overlaysCmp.slidenav.slideToMain();
          }
        }
      }
    }));
  };

  const addBackgroundButtons = function addBackgroundButtons(layers) {
    layers.forEach((layer) => {
      addBackgroundButton(layer);
    });
  };

  const getTargetHeight = () => target.offsetHeight;

  const calcMaxHeight = function calcMaxHeight(size) {
    const topMargin = 64;
    const bottomMargin = 32;
    const maxHeight = size - topMargin - bottomMargin;
    return maxHeight;
  };

  const updateMaxHeight = function updateMaxHeight() {
    mainContainerEl.style.maxHeight = `${calcMaxHeight(getTargetHeight())}px`;
  };

  const turnOffAllLayers = function turnOffAllLayers() {
    const layers = viewer.getLayersByProperty('visible', true);
    layers.forEach((el) => {
      if (!(['none', 'background'].includes(el.get('group')))) {
        el.setVisible(false);
      }
    });
  };

  const divider = El({
    cls: 'divider margin-x-small',
    style: {
      'border-width': '2px',
      'margin-bottom': '5px',
      'margin-top': '5px'
    }
  });

  const turnOffLayersButton = Button({
    cls: 'round compact icon-small margin-x-smaller',
    title: 'Släck alla lager',
    click() {
      viewer.dispatch('active:turnofflayers');
    },
    style: {
      'align-self': 'center',
      'padding-right': '6px'
    },
    icon: '#ic_visibility_off_24px',
    iconStyle: {
      fill: '#7a7a7a'
    }
  });

  const layerSearchInput = Input({
    cls: 'o-search-layer-field placeholder-text-smaller smaller',
    style: { height: '1.5rem', margin: 0, width: '100%' },
    placeholderText: 'Sök lager',
    value: ''
  });

  const toggleVisibility = function toggleVisibility() {
    if (isExpanded) {
      layerSwitcherEl.classList.add('fade-out');
      layerSwitcherEl.classList.remove('fade-in');
      layerButtonEl.classList.add('fade-in');
      layerButtonEl.classList.remove('fade-out');
      closeButton.setState('hidden');
    } else {
      layerSwitcherEl.classList.remove('fade-out');
      layerSwitcherEl.classList.add('fade-in');
      layerButtonEl.classList.remove('fade-out');
      layerButtonEl.classList.add('fade-in');
      closeButton.setState('initial');
    }
    layerButtonEl.classList.toggle('faded');
    layerSwitcherEl.classList.toggle('faded');
    isExpanded = !isExpanded;
    setTabIndex();
  };

  const onMapClick = function onMapClick() {
    if (autoHide === 'always' && isExpanded) {
      toggleVisibility();
    } else if (autoHide === 'mobile' && isExpanded) {
      const size = viewer.getSize();
      if (size === 'm' || size === 's' || size === 'xs') {
        toggleVisibility();
      }
    }
  };

  /** There are several different ways to handle selected search result.
 */

  function selectHandler(evt) {
    const label = evt.text.label;
    if (name) {
      // Todo
      const layer = viewer.getLayer(label);
      layer.setVisible(true);
      document.getElementsByClassName('o-search-layer-field')[0].value = '';
    } else {
      console.error('Search options are missing');
    }
  }

  function clearSearchResults() {
    awesomplete.list = [];
  }

  function onClearSearch() {
    document.getElementById(`${closeButton.getId()}`).addEventListener('click', () => {
      clearSearchResults();
      document.getElementById(`${layerSearchInput.getId()}`).classList.remove('o-search-true');
      document.getElementById(`${layerSearchInput.getId()}`).classList.add('o-search-false');
      document.getElementsByClassName('o-search-layer-field')[0].value = '';
    });
  }

  function bindUIActions() {
    if (searchLayersControl) {
      document.getElementById(`${layerSearchInput.getId()}`).addEventListener('awesomplete-selectcomplete', selectHandler);

      document.getElementsByClassName('o-search-layer-field')[0].addEventListener('input', () => {
        if (document.getElementsByClassName('o-search-layer-field')[0].value && document.getElementById(`${layerSearchInput.getId()}`).classList.contains('o-search-false')) {
          document.getElementById(`${layerSearchInput.getId()}`).classList.remove('o-search-false');
          document.getElementById(`${layerSearchInput.getId()}`).classList.add('o-search-true');
          onClearSearch();
        } else if (!(document.getElementsByClassName('o-search-layer-field')[0].value) && document.getElementById(`${layerSearchInput.getId()}`).classList.contains('o-search-true')) {
          document.getElementById(`${layerSearchInput.getId()}`).classList.remove('o-search-true');
          document.getElementById(`${layerSearchInput.getId()}`).classList.add('o-search-false');
        }
      });
    }
  }

  function renderList(suggestion, input) {
    let opts = {};
    let html = input === '' ? suggestion.value : suggestion.value.replace(RegExp(Awesomplete.$.regExpEscape(input), 'gi'), '<mark>$&</mark>');
    html = `<div class="suggestion">${html}</div>`;
    opts = {
      innerHTML: html,
      'aria-selected': 'false'
    };

    return Awesomplete.$.create('li', opts);
  }

  /*
  The label property in Awesomplete is used to store the feature id. This way the properties
  of each feature in the search response will be available in event handling.
  The complete properties are stored in a tempory db called searchDb. This is a workaround
  for a limit in Awesomplete that can only store data in the fields label and text.
  The data-category attribute is used to make a layer division in the sugguestion list.
  */

  function initAutocomplete() {
    const input = document.getElementsByClassName('o-search-layer-field')[0];

    function shorten(text, searchword) {
      let returnValue = text;
      if (text.length > 20) {
        returnValue = `...${text.substring(text.indexOf(searchword) - 3, text.indexOf(searchword) + searchword.length + 3).trim()}...`;
      }
      return returnValue;
    }

    function makeRequest(obj) {
      const layersArr = viewer.getLayers();
      const hitArr = [];
      layersArr.forEach((layer) => {
        if (layer.get('group') !== 'none') {
          let found = false;
          const label = layer.get('name');
          let value = label;
          if (label.toLowerCase().search(obj.value.toLowerCase()) !== -1 && searchLayersParameters.includes('name')) {
            found = true;
          }
          if (typeof layer.get('title') !== 'undefined' && searchLayersParameters.includes('title')) {
            value = layer.get('title');
            if (value.toLowerCase().search(obj.value.toLowerCase()) !== -1) {
              found = true;
            }
          }
          if (typeof layer.get('abstract') !== 'undefined' && searchLayersParameters.includes('abstract') && !found) {
            value = layer.get('abstract');
            if (value.toLowerCase().search(obj.value.toLowerCase()) !== -1) {
              found = true;
            }
            if (typeof layer.get('title') === 'undefined') {
              value = `Titel saknas (${shorten(value, obj.value)})`;
            } else {
              value = `${layer.get('title')} (${shorten(value, obj.value)})`;
            }
          }
          if (found) {
            const dataItem = {};
            dataItem.label = label;
            dataItem.value = value;
            hitArr.push(dataItem);
          }
        }
      });
      awesomplete.list = hitArr;
      awesomplete.evaluate();
    }

    if (typeof input !== 'undefined') {
      awesomplete = new Awesomplete('.o-search-layer-field', {
        minChars: searchLayersMinLength,
        autoFirst: false,
        sort: false,
        maxItems: searchLayersLimit,
        item: renderList,
        filter(suggestion, userInput) {
          const { value: suggestionValue } = suggestion;
          return suggestionValue.toLowerCase().includes(userInput.toLowerCase()) ? suggestionValue : false;
        }
      });

      input.parentNode.classList.add('black');
      input.addEventListener('keyup', (e) => {
        const keyCode = e.keyCode;
        if (input.value.length >= searchLayersMinLength) {
          if (keyCode in keyCodes) {
            // empty
          } else {
            makeRequest(input);
          }
        }
      });
    }
  }

  return Component({
    name,
    getuseGroupIndication() { return useGroupIndication; },
    addButtonToTools(button) {
      const toolsEl = document.getElementById(toolsCmp.getId());
      toolsEl.classList.remove('hidden');
      if (toolsCmp.getComponents().length > 0) {
        toolsEl.style.justifyContent = 'space-between';
        toolsEl.insertBefore(dom.html(divider.render()), toolsEl.firstChild);
        toolsEl.insertBefore(dom.html(button.render()), toolsEl.firstChild);
      } else {
        toolsEl.appendChild(dom.html(button.render()));
      }
      toolsCmp.addComponent(button);
      button.onRender();
    },
    onInit() {
      this.on('render', this.onRender);
    },
    onAdd(evt) {
      viewer = evt.target;
      if (turnOffLayersControl) {
        viewer.on('active:turnofflayers', turnOffAllLayers);
      }
      const backgroundLayers = viewer.getLayersByProperty('group', 'background').reverse();
      addBackgroundButtons(backgroundLayers);
      toggleGroup = ToggleGroup({
        components: backgroundLayerButtons,
        cls: 'spacing-horizontal-small'
      });

      this.render();
      this.dispatch('render');
      viewer.getMap().on('click', onMapClick);
    },
    onRender() {
      mainContainerEl = document.getElementById(mainContainerCmp.getId());
      layerButtonEl = document.getElementById(layerButton.getId());
      layerSwitcherEl.addEventListener('collapse:toggle', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleVisibility();
      });
      window.addEventListener('resize', updateMaxHeight);
      if (turnOffLayersControl) this.addButtonToTools(turnOffLayersButton);
      if (searchLayersControl) this.addButtonToTools(layerSearchInput);
      initAutocomplete();
      bindUIActions();
      setTabIndex();
    },
    render() {
      const size = viewer.getSize();
      isExpanded = !size && expanded;
      target = document.getElementById(viewer.getMain().getId());
      const maxHeight = calcMaxHeight(getTargetHeight());
      overlaysCmp = Overlays({
        viewer, cls: contentCls, style: contentStyle, labelOpacitySlider
      });
      const baselayerCmps = [toggleGroup];

      toolsCmp = El({
        cls: 'flex padding-small no-shrink hidden',
        tooltipText: 'Lagerbytare',
        style: {
          'background-color': '#fff',
          'justify-content': 'flex-end',
          height: '40px'
        }
      });

      const baselayersCmp = El({
        cls: 'flex padding-small no-shrink',
        style: {
          'background-color': '#fff',
          height: '50px',
          'padding-right': '30px',
          'border-top': '1px solid #dbdbdb'
        },
        components: baselayerCmps
      });

      const mainContainerComponents = [overlaysCmp, toolsCmp, baselayersCmp];

      mainContainerCmp = El({
        cls: 'flex column overflow-hidden relative',
        components: mainContainerComponents,
        style: {
          'max-height': `${maxHeight}px`
        }
      });

      const layerSwitcherCls = isExpanded ? '' : ' faded';
      const layerSwitcherCmp = El({
        style,
        cls: `${cls}${layerSwitcherCls}`,
        components: [mainContainerCmp],
        target
      });
      layerSwitcherCmp.render();
      layerSwitcherEl = document.getElementById(layerSwitcherCmp.getId());

      const layerButtonCls = isExpanded ? ' faded' : '';
      layerButton = Button({
        icon: '#ic_layers_24px',
        tooltipText: 'Lager',
        tooltipPlacement: 'west',
        cls: `control icon-small medium round absolute light bottom-right${layerButtonCls}`,
        click() {
          if (!isExpanded) {
            overlaysCmp.dispatch('expand');
            toggleVisibility();
          }
        }
      });
      const closeButtonState = isExpanded ? 'initial' : 'hidden';
      closeButton = Button({
        cls: 'icon-smaller small round absolute margin-bottom margin-right grey-lightest bottom-right z-index-top',
        icon: '#ic_close_24px',
        state: closeButtonState,
        validStates: ['initial', 'hidden'],
        ariaLabel: 'Stäng',
        click() {
          toggleVisibility();
        }
      });
      this.addComponent(layerButton);
      this.addComponent(closeButton);
      let el = dom.html(layerButton.render());
      target.appendChild(el);
      el = dom.html(closeButton.render());
      target.appendChild(el);
    }
  });
};

export default Legend;
