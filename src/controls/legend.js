import {
  Component, Button, Element as El, ToggleGroup, dom
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
    useGroupIndication = true
  } = options;

  let viewer;
  let target;
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
