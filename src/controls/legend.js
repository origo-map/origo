import cu from 'ceeu';
import imageSource from './legend/imagesource';
import Overlays from './legend/overlays';

const LayerSwitcher = function LayerSwitcher(options = {}) {
  const {
    cls: clsSettings = '',
    style: styleSettings = {},
    expanded = true,
    contentCls,
    contentStyle,
    addControl = false,
    name = 'legend'
  } = options;

  let viewer;
  let target;
  let mainContainerCmp;
  let mainContainerEl;
  const backgroundLayerButtons = [];
  let toggleGroup;
  let layerSwitcherEl;
  let layerButton;
  let layerButtonEl;
  let isExpanded;
  const cls = `${clsSettings} control bottom-right box overflow-hidden flex row o-layer-switcher`.trim();
  const style = cu.dom.createStyle(Object.assign({}, { width: 'auto' }, styleSettings));

  const addBackgroundButton = function addBackgroundButton(layer) {
    const styleName = layer.get('styleName') || 'default';
    const icon = imageSource(viewer.getStyle(styleName));
    backgroundLayerButtons.push(cu.Button({
      icon,
      cls: 'round smallest border icon-small',
      state: layer.get('visible') ? 'active' : undefined,
      methods: {
        active: () => layer.setVisible(true),
        initial: () => layer.setVisible(false)
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

  const divider = cu.Element({
    cls: 'divider margin-x-small',
    style: {
      'border-width': '2px',
      'margin-bottom': '5px',
      'margin-top': '5px'
    }
  });

  const addButton = cu.Button({
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

  const toggleVisibility = function toggleVisibility() {
    if (isExpanded) {
      layerSwitcherEl.classList.add('fade-out');
      layerSwitcherEl.classList.remove('fade-in');
      layerButtonEl.classList.add('fade-in'); 
      layerButtonEl.classList.remove('fade-out');          
    } else {
      layerSwitcherEl.classList.remove('fade-out');
      layerSwitcherEl.classList.add('fade-in');
      layerButtonEl.classList.remove('fade-out');
      layerButtonEl.classList.add('fade-in');              
    }
    layerButtonEl.classList.toggle('faded');
    layerSwitcherEl.classList.toggle('faded');        
    isExpanded = !isExpanded;
  };

  return cu.Component({
    name,
    onInit() {
      this.on('render', this.onRender);
    },
    onAdd(evt) {
      viewer = evt.target;
      const backgroundLayers = viewer.getLayersByProperty('group', 'background').reverse();
      addBackgroundButtons(backgroundLayers);
      toggleGroup = cu.ToggleGroup({
        components: backgroundLayerButtons,
        cls: 'spacing-horizontal-small'
      });

      this.render();
      this.dispatch('render');
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
    },
    render() {
      const size = viewer.getSize();
      isExpanded = !size && expanded;
      target = document.getElementById(viewer.getMain().getId());
      const maxHeight = calcMaxHeight(getTargetHeight());
      const overlaysCmp = Overlays({ viewer, cls: contentCls, style: contentStyle });
      const baselayerCmps = addControl ? [toggleGroup, divider, addButton] : [toggleGroup];
      const baselayersCmp = cu.Element({
        cls: 'flex padding-small no-shrink',
        style: {
          'background-color': '#fff',
          height: '50px'
        },
        components: baselayerCmps
      });
      mainContainerCmp = cu.Element({
        cls: 'flex column overflow-hidden relative',
        components: [overlaysCmp, baselayersCmp],
        style: {
          'max-height': `${maxHeight}px`
        }
      });

      const layerSwitcherCls = isExpanded ? '' : ' faded';
      const layerSwitcherCmp = cu.Element({
        style,
        cls: `${cls}${layerSwitcherCls}`,
        components: [mainContainerCmp],
        target
      });
      layerSwitcherCmp.render();
      layerSwitcherEl = document.getElementById(layerSwitcherCmp.getId()); 

      const layerButtonCls = isExpanded ? ' faded' : '';
      layerButton = cu.Button({
        icon: '#ic_layers_24px',
        cls: `control icon-small medium round absolute bottom-right${layerButtonCls}`,
        click() {
          if (!isExpanded) {
            overlaysCmp.dispatch('expand');
            toggleVisibility();
          }
        }
      });
      this.addComponent(layerButton);
      const el = cu.dom.html(layerButton.render());
      target.appendChild(el);
    }
  });
};

export default LayerSwitcher;
