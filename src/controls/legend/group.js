import { Component, Button, Collapse, CollapseHeader, dom } from '../../ui';
import GroupList from './grouplist';
import createMoreInfoButton from './moreinfobutton';
import LayerProperties from './overlayproperties';

/**
 * The Group component can be a group or a subgroup,
 * defined by type group or grouplayer. If the
 * type is grouplayer, it will be treated as a subgroup
 * with tick all and untick check boxes.
 */
const Group = function Group(viewer, options = {}) {
  const {
    icon = '#ic_chevron_right_24px',
    cls = '',
    expanded = false,
    title,
    name,
    parent,
    abstract,
    showAbstractInLegend = false,
    position = 'top',
    type = 'group',
    autoExpand = true,
    exclusive = false,
    toggleAll = true,
    draggable = false,
    zIndexStart = 0.1,
    opacityControl = false,
    removable = false,
    zoomToExtent = false,
    description,
    localization
  } = options;

  const stateCls = {
    none: 'initial',
    all: 'initial',
    mixed: 'disabled'
  };
  const checkIcon = '#ic_check_circle_24px';
  const uncheckIcon = '#ic_radio_button_unchecked_24px';
  const draggableGroups = [];
  let visibleState = 'all';
  let groupEl;
  let selectedItem;

  const listCls = type === 'grouplayer' ? 'divider-start padding-left padding-top-small' : '';
  const groupList = GroupList({ viewer, cls: listCls, abstract, showAbstractInLegend });
  visibleState = groupList.getVisible();

  const thisGroup = viewer.getGroup(name);

  const getEl = () => groupEl;

  const getCheckIcon = (visible) => {
    const isVisible = visible === 'mixed' || visible === 'all' ? checkIcon : uncheckIcon;
    return isVisible;
  };

  const getOverlayList = () => groupList;

  const getVisible = () => visibleState;

  const tickButton = !exclusive && toggleAll ? Button({
    cls: 'icon-smaller round small',
    click() {
      const eventType = visibleState === 'all' ? 'untick:all' : 'tick:all';
      const tickEvent = new CustomEvent(eventType, {
        bubbles: true
      });
      const el = document.getElementById(this.getId());
      el.dispatchEvent(tickEvent);
    },
    icon: '#ic_radio_button_unchecked_24px',
    iconCls: '',
    state: visibleState,
    style: {
      'align-self': 'center',
      cursor: 'pointer'
    }
  }) : false;

  const moreInfoButton = (opacityControl || removable || zoomToExtent || description || (abstract && !showAbstractInLegend)) ? createMoreInfoButton({ viewer, group: thisGroup, localization }) : false;

  const SubGroupHeader = function SubGroupHeader() {
    const expandButton = Button({
      cls: 'icon-small compact round',
      icon,
      iconCls: 'rotate grey',
      style: {
        'align-self': 'flex-start'
      }
    });

    return Component({
      onInit() {
        this.addComponent(expandButton);
        if (tickButton) {
          this.addComponent(tickButton);
        }
        if (moreInfoButton) {
          this.addComponent(moreInfoButton);
        }
      },
      onRender() {
        this.dispatch('render');
        const collapseEvent = 'collapse:toggle';
        const el = document.getElementById(this.getId());
        el.addEventListener('click', () => {
          const customEvt = new CustomEvent(collapseEvent, {
            bubbles: true
          });
          el.dispatchEvent(customEvt);
        });
      },
      render() {
        const padding = moreInfoButton ? '0.275rem' : '1.875rem';
        return `<div class="flex row align-center padding-left text-smaller pointer collapse-header item wrap" style="width: 100%; padding-right: ${padding}">
                <div id="${this.getId()}" class="flex row align-center grow basis-0">
                   ${expandButton.render()}
                    <span class="grow padding-x-small" style="overflow-wrap: anywhere;">${title}</span>
                </div>
                ${tickButton ? tickButton.render() : ''}
                ${moreInfoButton ? moreInfoButton.render() : ''}
              </div>`;
      }
    });
  };

  const GroupHeader = function GroupHeader() {
    const headerComponent = CollapseHeader({
      cls: 'hover padding-x padding-y-small grey-lightest border-bottom text-small sticky bg-white z-index-low item wrap',
      style: `top: 0;${moreInfoButton ? 'padding-right: 0.275rem' : ''}`,
      icon,
      title
    });
    if (moreInfoButton) {
      headerComponent.on('render', function hcRender() {
        const el = document.getElementById(this.getId());
        const html = moreInfoButton.render();
        el.insertAdjacentHTML('beforeend', html);
      });
    }
    return headerComponent;
  };

  const headerComponent = type === 'grouplayer' ? SubGroupHeader() : GroupHeader();

  const collapse = Collapse({
    cls: '',
    expanded,
    headerComponent,
    contentComponent: groupList,
    collapseX: false
  });

  if (moreInfoButton && type !== 'grouplayer') {
    collapse.addComponent(moreInfoButton);
  }

  const addGroup = function addGroup(groupCmp) {
    groupList.addGroup(groupCmp);
    this.dispatch('add:group', groupCmp);
  };

  const appendGroup = function appendGroup(targetCmp) {
    const html = dom.html(this.render());
    const targetEl = targetCmp.getEl();
    if (position === 'top') {
      targetEl.insertBefore(html, targetEl.firstChild);
    } else {
      targetEl.appendChild(html);
    }
    this.onRender();
  };

  const addOverlay = function addOverlay(overlay) {
    groupList.addOverlay(overlay);
    this.dispatch('add:overlay', overlay);
  };

  const removeOverlay = function removeOverlay(layerName) {
    groupList.removeOverlay(layerName);
  };

  const removeGroup = function removeGroup(group) {
    groupList.removeGroup(group);
  };

  const updateGroupIndication = function updateGroupIndication() {
    if (groupList.getVisible() === 'none') {
      groupEl.firstElementChild.classList.add('no-group-indication');
      groupEl.firstElementChild.classList.remove('group-indication');
    } else {
      groupEl.firstElementChild.classList.add('group-indication');
      groupEl.firstElementChild.classList.remove('no-group-indication');
    }
  };

  function orderZIndex(list, groupCmp) {
    const layerArr = [];

    function recList(listEl, grpCmp) {
      const elementIds = [...listEl.children].map(x => x.id).reverse();
      const overlayArray = grpCmp.getOverlayList().getOverlays();
      const groupArray = grpCmp.getOverlayList().getGroups();
      elementIds.forEach(element => {
        const foundLayer = overlayArray.find((overlay) => element === overlay.getId());
        if (foundLayer) {
          layerArr.push(foundLayer);
        } else {
          const foundGroup = groupArray.find((group) => element === group.getId());
          if (foundGroup) {
            const ulList = document.getElementById(foundGroup.getId())?.getElementsByTagName('ul')[0];
            if (ulList) {
              recList(ulList, foundGroup);
            }
          }
        }
      });
    }

    recList(list, groupCmp);

    layerArr.forEach((element, idx) => {
      const layerIndex = idx;
      element.getLayer().setZIndex(zIndexStart + (layerIndex / 100));
    });
  }

  function handleDragStart(evt) {
    selectedItem = evt.target;
    selectedItem.classList.add('move-item');
  }

  function handleDragOver(evt) {
    const event = evt;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleDragEnd(evt, groupCmp) {
    if (selectedItem) {
      selectedItem.classList.remove('move-item');
      orderZIndex(selectedItem.parentElement, groupCmp);
      selectedItem = null;
    }
  }

  function handleDragEnter(evt) {
    if (selectedItem) {
      const event = evt;
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      const list = selectedItem.parentNode;
      const x = evt.clientX;
      const y = evt.clientY;
      let swapItem = document.elementFromPoint(x, y) === null ? selectedItem : document.elementFromPoint(x, y);
      if (list === swapItem.parentNode) {
        swapItem = swapItem !== selectedItem.nextSibling ? swapItem : swapItem.nextSibling;
        list.insertBefore(selectedItem, swapItem);
      }
    }
  }

  function enableDragItem(el, groupCmp) {
    const item = el;
    if (item) {
      item.setAttribute('draggable', true);
      item.ondragstart = handleDragStart;
      item.ondragenter = handleDragEnter;
      item.ondragover = handleDragOver;
      item.ondragend = (evt) => { handleDragEnd(evt, groupCmp); };
    }
  }

  return Component({
    addOverlay,
    getEl,
    getOverlayList,
    getVisible,
    getHeaderCmp() { return headerComponent; },
    name,
    exclusive,
    parent,
    title,
    type,
    draggable,
    addGroup,
    appendGroup,
    removeGroup,
    removeOverlay,
    onAdd(evt) {
      if (evt.target) {
        evt.target.on('render', this.onRender.bind(this));
      }

      // Add directly if target is available in the dom
      if (evt.target.getEl()) {
        this.appendGroup(evt.target);
      }
    },
    onInit() {
      this.addComponent(collapse);
      this.on('add:overlay', (overlay) => {
        visibleState = groupList.getVisible();
        if (tickButton) {
          tickButton.setState(stateCls[visibleState]);
          tickButton.setIcon(getCheckIcon(visibleState));
        }
        if (draggable && typeof overlay.getId === 'function') {
          const el = document.getElementById(overlay.getId());
          enableDragItem(el, this);
        }
      });
      this.on('add:group', (group) => {
        visibleState = groupList.getVisible();
        if (tickButton) {
          tickButton.setState(stateCls[visibleState]);
          tickButton.setIcon(getCheckIcon(visibleState));
        }
        if (draggable && typeof group.getId === 'function') {
          const groupId = group.getId();
          const el = document.getElementById(groupId);
          if (el) {
            enableDragItem(el, this);
          } else {
            draggableGroups.push(groupId);
          }
        }
      });

      // only listen to tick changes for subgroups
      if (type === 'grouplayer') {
        this.on('untick:all', () => {
          const overlays = groupList.getOverlays();
          overlays.forEach((overlay) => {
            const layer = overlay.getLayer();
            layer.setVisible(false);
          });
          const groups = groupList.getGroups();
          groups.forEach((group) => {
            group.dispatch('untick:all');
          });
          if (visibleState !== 'none') {
            this.dispatch('change:visible', { state: 'none' });
            visibleState = 'none';
          }
          if (autoExpand) {
            collapse.collapse();
          }
        });
        this.on('tick:all', () => {
          const overlays = groupList.getOverlays();
          overlays.forEach((overlay) => {
            const layer = overlay.getLayer();
            layer.setVisible(true);
          });
          const groups = groupList.getGroups();
          groups.forEach((group) => {
            if (!group.exclusive) {
              group.dispatch('tick:all');
            }
          });
          if (visibleState !== 'all') {
            this.dispatch('change:visible', { state: 'all' });
            visibleState = 'all';
          }
          if (autoExpand) {
            collapse.expand();
          }
        });
      }
    },
    onRender() {
      draggableGroups.forEach(grp => enableDragItem(document.getElementById(grp), this));
      groupEl = document.getElementById(collapse.getId());
      if (viewer.getControlByName('legend').getuseGroupIndication() && type === 'group') {
        updateGroupIndication();
        this.on('add:overlay', () => {
          updateGroupIndication();
        });
        groupEl.addEventListener('change:visible', (e) => {
          e.preventDefault();
          e.stopPropagation();
          updateGroupIndication();
        });
      }
      if (moreInfoButton) {
        groupEl.addEventListener('overlayproperties', (evt) => {
          const overlaysCmp = viewer.getControlByName('legend').getOverlays();
          const slidenav = overlaysCmp.slidenav;
          if (evt.detail.group) {
            const group = evt.detail.group;
            const thisParent = this;
            const label = group.labelOpacitySlider ? group.labelOpacitySlider : '';
            const layerProperties = LayerProperties({
              group, viewer, thisParent, labelOpacitySlider: label, localization
            });
            slidenav.setSecondary(layerProperties);
            slidenav.slideToSecondary();
            // Include back btn and opacity slider in tab order when opened and remove when closed
            const secondaryEl = document.getElementById(slidenav.getId()).querySelector('.secondary');
            const backBtn = secondaryEl.getElementsByTagName('button')[0];
            const opacityInput = secondaryEl.getElementsByTagName('input')[0];
            backBtn.tabIndex = 0;
            backBtn.focus();
            if (opacityInput) {
              opacityInput.tabIndex = 0;
            }
            backBtn.addEventListener('click', () => {
              backBtn.tabIndex = -99;
              if (opacityInput) {
                opacityInput.tabIndex = -99;
              }
            }, false);
            slidenav.on('slide', () => {
              groupEl.classList.remove('width-100');
            });
          }
        });
      }
      // only listen to tick changes for subgroups
      if (type === 'grouplayer') {
        groupEl.addEventListener('tick:all', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dispatch('tick:all');
        });
        groupEl.addEventListener('untick:all', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.dispatch('untick:all');
        });
        groupEl.addEventListener('change:visible', (e) => {
          e.preventDefault();
          const newVisibleState = groupList.getVisible();
          if (visibleState !== newVisibleState) {
            visibleState = newVisibleState;
            if (tickButton) {
              tickButton.dispatch('change', { icon: getCheckIcon(visibleState) });
              tickButton.setState(stateCls[visibleState]);
            }
          } else {
            e.stopPropagation();
          }
        });
      }
      this.dispatch('render');
    },
    render() {
      this.dispatch('beforerender');
      const tagName = type === 'grouplayer' ? 'li' : 'div';
      return `<${tagName} id="${this.getId()}" class="${cls}">${collapse.render()}</${tagName}>`;
    }
  });
};

export default Group;
