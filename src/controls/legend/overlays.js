import { Component, Collapse, Element as El, Slidenav, Button, dom } from '../../ui';
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
    viewer
  } = options;

  const cls = `${clsSettings} o-layerswitcher-overlays flex row overflow-hidden`.trim();
  const style = dom.createStyle(Object.assign({}, { width: '220px;' }, styleSettings));
  const nonGroupNames = ['background', 'none'];
  const rootGroupNames = ['root', '', null, undefined];
  let overlays;

  const themeGroups = ThemeGroups();
  const rootGroup = GroupList({ viewer });

  const groupCmps = viewer.getGroups().reduce((acc, group) => {
    if (nonGroupNames.includes(group.name)) return acc;
    return acc.concat(Group(group, viewer));
  }, []);

  groupCmps.forEach((groupCmp) => {
    if (groupCmp.type === 'group') {
      themeGroups.addComponent(groupCmp);
    } else if (groupCmp.parent) {
      const parent = groupCmps.find(cmp => cmp.name === groupCmp.parent);
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
    cls: 'right flex width-100'
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

  const initialState = expanded ? 'expanded' : 'collapsed';
  const collapseButton = Button({
    icon: '#o_expand_more_24px',
    iconCls: 'rotate-180 grey',
    cls: 'icon-smaller compact round',
    state: initialState,
    validStates: ['expanded', 'collapsed'],
    click() {
      if (this.getState() === 'expanded') {
        this.setState('collapsed');
      } else {
        this.setState('expanded');
      }
    }
  });

  const collapseHeader = Component({
    onInit() {
      this.addComponent(collapseButton);
    },
    onRender() {
      this.dispatch('render');
      const el = document.getElementById(this.getId());
      el.addEventListener('click', () => {
        const customEvt = new CustomEvent('collapse:toggle', {
          bubbles: true
        });
        collapseButton.dispatch('click');
        el.dispatchEvent(customEvt);
      });
    },
    render() {
      const headerCls = 'flex row grow no-shrink justify-center align-center pointer collapse-header';
      return `<div id="${this.getId()}" class="${headerCls}" style="height: 1.5rem;">
                ${collapseButton.render()}
              </div>`;
    }
  });

  const overlaysCollapse = Collapse({
    bubble: true,
    collapseX: false,
    cls: 'flex column overflow-hidden width-100',
    contentCls: 'flex column',
    contentStyle: { height: '100%', 'overflow-y': 'auto' },
    expanded,
    contentComponent: navContainer,
    headerComponent: collapseHeader
  });

  const hasOverlays = () => overlays.length;

  const readOverlays = () => {
    overlays = viewer.getLayers().filter(layer => layer.get('group') !== 'background' && layer.get('group') !== 'none');
    return overlays.reverse();
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
    const overlay = Overlay({ layer, style: layerStyle, position });
    const groupName = layer.get('group');
    if (rootGroupNames.includes(groupName)) {
      rootGroup.addOverlay(overlay);
    } else if (!(nonGroupNames.includes(groupName))) {
      const groupCmp = groupCmps.find(cmp => cmp.name === groupName);
      if (groupCmp) {
        groupCmp.addOverlay(overlay);
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
      const parent = groupCmps.find(cmp => cmp.name === groupCmp.parent);
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
      const groupCmp = groupCmps.find(cmp => cmp.name === groupName);
      if (groupCmp) {
        groupCmp.removeOverlay(layerName);
      }
    } else {
      rootGroup.removeOverlay(layerName);
    }
  };

  const onRemoveGroup = function onRemoveGroup(evt) {
    const groupName = evt.group.name;
    const groupCmp = groupCmps.find(cmp => cmp.name === groupName);
    if (groupCmp) {
      const index = groupCmps.indexOf(groupCmp);
      groupCmps.splice(index, 1);
      if (groupCmp.parent) {
        const parentCmp = groupCmps.find(cmp => cmp.name === groupCmp.parent);
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
          const layerProperties = LayerProperties({ layer, viewer });
          slidenav.setSecondary(layerProperties);
          slidenav.slideToSecondary();
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
