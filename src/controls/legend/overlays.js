import {
  Component, Collapse, Element as El, Slidenav, dom
} from '../../ui';
import ThemeGroups from './themegroups';
import Group from './group';
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
    expanded = true,
    style: styleSettings = {},
    viewer,
    labelOpacitySlider
  } = options;

  const cls = `${clsSettings} o-layerswitcher-overlays flex row overflow-hidden`.trim();
  const style = dom.createStyle({
    width: '220px', height: '100%', 'min-width': '220px', ...styleSettings
  });
  const nonGroupNames = ['background', 'none'];
  const rootGroupNames = ['root', '', null, undefined];
  let overlays;

  const themeGroups = ThemeGroups();
  const rootGroup = GroupList({ viewer }, true);

  const groupCmps = viewer.getGroups().reduce((acc, group) => {
    if (nonGroupNames.includes(group.name)) return acc;
    return acc.concat(Group(group, viewer));
  }, []);

  groupCmps.forEach((groupCmp) => {
    if (groupCmp.type === 'group') {
      themeGroups.addComponent(groupCmp);
    } else if (groupCmp.parent) {
      const parent = groupCmps.find((cmp) => cmp.name === groupCmp.parent);
      parent.addGroup(groupCmp, viewer);
    } else {
      rootGroup.addGroup(groupCmp);
    }
  });

  const groupContainer = El({
    components: [themeGroups, rootGroup]
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
    legendSlideNav: true
  });

  const navContainer = Component({
    onInit() {
      this.addComponent(slidenav);
    },
    onRender() {
      this.dispatch('render');
    },
    render() {
      return `<div id="${this.getId()}"><div class="flex row no-shrink">${slidenav.render()}</div></div>`;
    }
  });

  const collapseHeader = Component({
    render() {
      const headerCls = 'flex row grow no-shrink justify-center align-center collapse-header';
      return `<div id="${this.getId()}" class="${headerCls}" style="height: 0.5rem;">
              </div>`;
    }
  });

  const overlaysCollapse = Collapse({
    legendCollapse: true,
    bubble: true,
    collapseX: false,
    cls: 'flex column overflow-hidden width-100',
    contentCls: 'flex column o-scrollbar',
    contentStyle: { height: '100%', 'overflow-y': 'auto', width: '100%'},
    style: { width: '100%' },
    expanded,
    contentComponent: navContainer,
    headerComponent: collapseHeader
  });

  const hasOverlays = () => overlays.length;

  const readOverlays = () => {
    overlays = viewer.getLayers().filter((layer) => layer.get('group') !== 'background' && layer.get('group') !== 'none');
    return overlays.reverse();
  };

  const emptyGroupCheck = function emptyGroupCheck(groupName) {
    let isEmpty = true;
    const group = viewer.getGroups().find((item) => item.name === groupName);
    if (group) {
      if (viewer.getLayersByProperty('group', groupName).length > 0) {
        return false;
      }
    }
    const subgroups = viewer.getGroups().filter((item) => {
      if (item.parent) {
        return item.parent === groupName;
      }
      return false;
    });
    if (subgroups.length) {
      isEmpty = subgroups.some((subgroup) => {
        const { name } = subgroup;
        const subgroupEmpty = emptyGroupCheck(name);
        return !subgroupEmpty;
      });
    }
    return isEmpty;
  };

  // Hide overlays container when empty
  const onChangeLayer = function onChangeLayer() {
    const oldNrOverlays = overlays.length;
    const nrOverlays = readOverlays().length;
    if (oldNrOverlays !== nrOverlays && nrOverlays < 2 && oldNrOverlays < 2) {
      document.getElementById(this.getId()).classList.toggle('hidden');
    }
  };

  const addLayer = function addLayer(layer, {
    position
  } = {}) {
    const styleName = layer.get('styleName') || null;
    const layerStyle = styleName ? viewer.getStyle(styleName) : undefined;
    const overlay = Overlay({
      layer, style: layerStyle, position, viewer
    });
    const groupName = layer.get('group');
    if (rootGroupNames.includes(groupName)) {
      rootGroup.addOverlay(overlay);
    } else if (!(nonGroupNames.includes(groupName))) {
      const groupCmp = groupCmps.find((cmp) => cmp.name === groupName);
      if (groupCmp) {
        groupCmp.addOverlay(overlay);
        document.getElementById(groupCmp.getId()).classList.remove('hidden');
      }
    }
  };

  const onAddLayer = function onAddLayer(evt) {
    this.onChangeLayer();
    const layer = evt.element;
    addLayer(layer);
  };

  const addGroup = function addGroup(groupOptions) {
    const groupCmp = Group(groupOptions, viewer);
    groupCmps.push(groupCmp);
    if (groupCmp.type === 'grouplayer') {
      const parent = groupCmps.find((cmp) => cmp.name === groupCmp.parent);
      if (parent) {
        parent.addGroup(groupCmp, viewer);
      } else {
        rootGroup.addGroup(groupCmp, viewer);
      }
    } else {
      themeGroups.addComponent(groupCmp);
    }
  };

  const onAddGroup = function onAddGroup(evt) {
    const group = evt.group;
    addGroup(group);
  };

  const onRemoveLayer = function onRemoveLayer(evt) {
    this.onChangeLayer();
    const layer = evt.element;
    const layerName = layer.get('name');
    const groupName = layer.get('group');
    if (groupName) {
      const groupCmp = groupCmps.find((cmp) => cmp.name === groupName);
      if (groupCmp) {
        groupCmp.removeOverlay(layerName);
        if (emptyGroupCheck(groupName)) {
          document.getElementById(groupCmp.getId()).classList.add('hidden');
        }
      }
    } else {
      rootGroup.removeOverlay(layerName);
    }
  };

  const onRemoveGroup = function onRemoveGroup(evt) {
    const groupName = evt.group.name;
    const groupCmp = groupCmps.find((cmp) => cmp.name === groupName);
    if (groupCmp) {
      const index = groupCmps.indexOf(groupCmp);
      groupCmps.splice(index, 1);
      if (groupCmp.parent) {
        const parentCmp = groupCmps.find((cmp) => cmp.name === groupCmp.parent);
        if (groupCmp.parent === 'root') {
          rootGroup.removeGroup(groupCmp);
        } else if (parentCmp) {
          parentCmp.removeGroup(groupCmp);
        }
      } else {
        rootGroup.removeGroup(groupCmp);
      }
    }
  };


  return Component({
    onAddGroup,
    onChangeLayer,
    slidenav,
    onInit() {
      this.addComponent(overlaysCollapse);
      readOverlays();
      viewer.getMap().getLayers().on('add', onAddLayer.bind(this));
      viewer.getMap().getLayers().on('remove', onRemoveLayer.bind(this));
      viewer.on('add:group', onAddGroup.bind(this));
      viewer.on('remove:group', onRemoveGroup.bind(this));
      this.on('expand', () => {
        overlaysCollapse.expand();
      });
    },
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
      return `<div id="${this.getId()}" class="${cls} ${emptyCls}" style="${style}">
                ${overlaysCollapse.render()}
              </div>`;
    }
  });
};

export default Overlays;
