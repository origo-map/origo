import {
  Component, Element as El, Slidenav, dom
} from '../../ui';
import GroupList from './grouplist';
import LayerProperties from './overlayproperties';
import Overlay from './overlay';

/**
 * The Overlays component works as a container for
 * all group components, besides the background group.
 * The component is divivded in two main cointainers,
 * one for theme groups and one root container for layers
 * and grouplayers that don't belong to a theme.
 */
const Overlays = function Overlays(options) {
  const {
    cls: clsSettings = '',
    style: styleSettings = {},
    viewer,
    labelOpacitySlider
  } = options;

  const cls = `${clsSettings} o-layerswitcher-overlays flex row overflow-hidden`.trim();
  const style = dom.createStyle({
    width: '220px', height: '100%', 'min-width': '220px', ...styleSettings
  });
  const nonGroupNames = ['background', 'none'];
  let overlays;

  const header = Component({
    render() {
      const headerCls = 'flex row grow no-shrink justify-center align-center collapse-header';
      return `<div id="${this.getId()}" class="${headerCls}" style="height: 0.5rem;">
              </div>`;
    }
  });

  const rootGroup = GroupList({ viewer }, true);

  const groupContainer = El({
    components: [rootGroup]
  });

  const layerProps = El({
    cls: 'border-bottom overflow-hidden',
    innerHTML: 'Layerproperties'
  });

  const slidenav = Slidenav({
    mainComponent: groupContainer,
    secondaryComponent: layerProps,
    cls: 'right flex width-100',
    style: { width: '100%' },
    legendSlideNav: false,
    viewer
  });

  const navContainer = Component({
    onInit() {
      this.addComponent(slidenav);
    },
    onRender() {
      this.dispatch('render');
    },
    render() {
      return `<div id="${this.getId()}" class="flex row no-shrink">${slidenav.render()}</div>`;
    }
  });

  const hasOverlays = () => overlays.length;

  const readOverlays = () => {
    // Put subgroup items before group items so that same order is kept as the main legend.
    const groups = viewer.getGroups().sort((a, b) => {
      if (a.name === b.parent) return 1;
      if (a.parent === b.name) return -1;
      return 0;
    });
    // Sort layers to keep same order as the main legend.
    const visibleLayers = viewer
      .getLayersByProperty('visible', true)
      .filter(layer => layer.get('group') !== 'background' && layer.get('group') !== 'none')
      .reverse()
      .sort((a, b) => {
        const indexA = groups.findIndex(group => group.name === a.get('group'));
        const indexB = groups.findIndex(group => group.name === b.get('group'));
        return indexA - indexB;
      });
    overlays = visibleLayers;
    return visibleLayers;
  };

  // Hide overlays container when empty
  const onChangeLayer = function onChangeLayer() {
    const oldNrOverlays = overlays.length;
    const nrOverlays = readOverlays().length;
    if (oldNrOverlays !== nrOverlays && nrOverlays < 2 && oldNrOverlays < 2) {
      document.getElementById(this.getId()).classList.toggle('hidden');
    }
  };

  const addLayer = function addLayer(layer, { position } = {}) {
    const styleName = layer.get('styleName') || null;
    const layerStyle = styleName ? viewer.getStyle(styleName) : undefined;
    const overlay = Overlay({
      layer,
      style: layerStyle,
      position,
      viewer
    });
    const groupName = layer.get('group');
    if (!nonGroupNames.includes(groupName)) {
      rootGroup.addOverlay(overlay);
    }
  };

  const updateVisibleOverlays = function updateVisibleOverlays() {
    const existing = rootGroup.getOverlays();
    existing.forEach(overlay => {
      document.getElementById(overlay.getId()).classList.add('hidden');
    });
    readOverlays();
    overlays.forEach(overlay => {
      if (!existing.find(eOverlay => eOverlay.name === overlay.name)) {
        addLayer(overlay, { position: 'bottom' });
      }
    });

    if (hasOverlays()) {
      document.getElementById(header.getId()).classList.remove('hidden');
    } else {
      document.getElementById(header.getId()).classList.add('hidden');
    }
  };

  return Component({
    onChangeLayer,
    slidenav,
    onInit() {
      this.addComponent(navContainer);
      readOverlays();
      this.on('readOverlays', () => {
        updateVisibleOverlays();
      });
    },
    hasOverlays,
    onRender() {
      overlays.forEach((layer) => {
        addLayer(layer, { position: 'bottom' });
      });
      const el = document.getElementById(this.getId());
      el.addEventListener('overlayproperties', (evt) => {
        if (evt.detail.layer) {
          const layer = evt.detail.layer;
          const parent = this;
          const layerProperties = LayerProperties({
            layer, viewer, parent, labelOpacitySlider
          });
          slidenav.setSecondary(layerProperties);
          slidenav.slideToSecondary();
          slidenav.on('slide', () => {
            el.classList.remove('width-100');
          });
        }
        evt.stopPropagation();
      });
      this.dispatch('render');
    },
    render() {
      const emptyCls = hasOverlays() ? '' : 'hidden';
      return `<div id="${this.getId()}" class="flex column o-scrollbar ${cls} ${emptyCls}" style="${style}">
                ${header.render()}
                ${navContainer.render()}
              </div>`;
    }
  });
};

export default Overlays;
