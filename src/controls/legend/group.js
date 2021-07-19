import { Component, Button, Collapse, CollapseHeader, dom } from '../../ui';
import GroupList from './grouplist';

/**
 * The Group component can be a group or a subgroup,
 * defined by type group or grouplayer. If the
 * type is grouplayer, it will be treated as a subgroup
 * with tick all and untick check boxes.
 */
const Group = function Group(options = {}, viewer) {
  const {
    icon = '#ic_chevron_right_24px',
    cls = '',
    expanded = false,
    title,
    name,
    parent,
    abstract,
    position = 'top',
    type = 'group',
    autoExpand = true,
    exclusive = false,
    toggleAll = true
  } = options;

  const stateCls = {
    none: 'initial',
    all: 'initial',
    mixed: 'disabled'
  };
  const checkIcon = '#ic_check_circle_24px';
  const uncheckIcon = '#ic_radio_button_unchecked_24px';
  let visibleState = 'all';
  let groupEl;

  const listCls = type === 'grouplayer' ? 'divider-start padding-left padding-top-small' : '';
  const groupList = GroupList({ viewer, cls: listCls, abstract });
  visibleState = groupList.getVisible();

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
    icon: '#ic_check_circle_24px',
    iconCls: '',
    state: visibleState,
    style: {
      'align-self': 'flex-end',
      cursor: 'pointer'
    }
  }) : false;

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
        return `<div class="flex row align-center padding-left padding-right text-smaller pointer collapse-header" style="width: 100%;">
                <div id="${this.getId()}" class="flex row align-center grow">
                   ${expandButton.render()}
                    <span class="grow padding-x-small">${title}</span>
                </div>
                ${tickButton ? tickButton.render() : ''}
              </div>`;
      }
    });
  };

  const GroupHeader = function GroupHeader() {
    const headerComponent = CollapseHeader({
      cls: 'hover padding-x padding-y-small grey-lightest border-bottom text-small',
      icon,
      title
    });
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

  const addGroup = function addGroup(groupCmp) {
    groupList.addGroup(groupCmp);
    this.dispatch('add:group');
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
    this.dispatch('add:overlay');
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

  return Component({
    addOverlay,
    getEl,
    getOverlayList,
    getVisible,
    name,
    exclusive,
    parent,
    title,
    type,
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
      this.on('add:overlay', () => {
        visibleState = groupList.getVisible();
        if (tickButton) {
          tickButton.setState(stateCls[visibleState]);
          tickButton.setIcon(getCheckIcon(visibleState));
        }
      });
      this.on('add:group', () => {
        visibleState = groupList.getVisible();
        if (tickButton) {
          tickButton.setState(stateCls[visibleState]);
          tickButton.setIcon(getCheckIcon(visibleState));
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
