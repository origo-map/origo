import { Component } from '../../ui';

const LayerList = function LayerList(options, isRootGroup = false) {
  const {
    cls: clsSettings = '',
    abstract
  } = options;

  let cls = `${clsSettings} list divider-end`.trim();
  if (isRootGroup) {
    cls = `${clsSettings} list divider-end-rootgroup`.trim();
  }
  const overlaysStore = {};
  const groupStore = {};
  let el;
  let target;

  const getEl = () => el;

  const addOverlay = function addOverlay(overlay) {
    const name = overlay.name;
    overlaysStore[name] = overlay;
    this.addComponent(overlay);
  };

  const getOverlays = () => Object.keys(overlaysStore).reduce((acc, overlayName) => (
    acc.concat(overlaysStore[overlayName])
  ), []);

  const getGroups = () => Object.keys(groupStore).reduce((acc, groupName) => (
    acc.concat(groupStore[groupName])
  ), []);

  const compareVisible = (firstState, secondState) => {
    if (firstState === 'none' && secondState === 'none') {
      return 'none';
    } else if (firstState === 'all' && secondState === 'all') {
      return 'all';
    }
    return 'mixed';
  };

  // retrieve current visibility by comparing all layers and groups in list
  const getVisible = function getVisible() {
    const overlays = getOverlays();
    const visibleLayers = overlays.reduce((prev, overlay) => {
      const visible = overlay.getLayer().getVisible() ? 'all' : 'none';
      let current = prev;
      if (!prev) current = visible;
      return compareVisible(visible, current);
    }, null);
    const groups = getGroups();
    const visibleGroups = groups.reduce((prev, group) => {
      const visible = group.getVisible();
      let current = prev;
      if (!prev) current = visible;
      return compareVisible(visible, current);
    }, null);
    if (visibleLayers && visibleGroups) {
      return compareVisible(visibleLayers, visibleGroups);
    } else if (visibleLayers) {
      return visibleLayers;
    } else if (visibleGroups) {
      return visibleGroups;
    }
    return 'none';
  };

  const removeOverlay = function removeOverlay(overlayName) {
    const overlay = overlaysStore[overlayName];
    if (overlay) {
      delete overlaysStore[overlayName];
      this.removeComponent(overlay);
      target.dispatch('change');
    }
  };

  const addGroup = function addGroup(group) {
    const name = group.name;
    groupStore[name] = group;
    this.addComponent(group);
    this.dispatch('add:group', { group });
  };

  const removeGroup = function removeGroup(group) {
    const groupName = group.name;
    if (groupName in groupStore) {
      delete groupStore[groupName];
      this.removeComponent(group);
      const groupEl = document.getElementById(group.getId());
      if (groupEl) groupEl.remove();
      target.dispatch('change');
    }
  };

  return Component({
    addGroup,
    addOverlay,
    getGroups,
    getOverlays,
    getVisible,
    getEl,
    removeGroup,
    removeOverlay,
    onInit() {
      if (abstract) {
        const groupAbstract = Component({
          render() {
            return `<li><div id="${this.getId()}">
            <div class="padding-small padding-x text-small">${abstract}</div>
            </div></li>`;
          }
        });
        this.addComponent(groupAbstract);
      }
      this.on('add', (evt) => {
        if (evt.target) {
          target = evt.target;
        }
      });
    },
    onRender() {
      el = document.getElementById(this.getId());
      this.dispatch('render');
    },
    render() {
      const content = this.getComponents().reduce((acc, item) => acc + item.render(), '');
      return `<ul id="${this.getId()}" class="${cls}">${content}</ul>`;
    }
  });
};

export default LayerList;
