import { Component, Button, dom, Element as El } from '../../ui';
import { HeaderIcon } from '../../utils/legendmaker';

const OverlayLayer = function OverlayLayer(options) {
  let {
    headerIconCls = ''
  } = options;
  const {
    cls: clsSettings = '',
    icon = '#o_list_24px',
    iconCls = 'grey-lightest',
    layer,
    position = 'top',
    style,
    viewer
  } = options;

  const buttons = [];
  const popupMenuItems = [];
  let layerList;
  let popupMenuActive = false;

  const cls = `${clsSettings} flex row align-center padding-left padding-right item`.trim();
  const title = layer.get('title') || 'Titel saknas';
  const name = layer.get('name');
  const secure = layer.get('secure');
  const popupMenuId = 'overlayPopupMenu';

  const checkIcon = '#ic_check_circle_24px';
  let uncheckIcon = '#ic_radio_button_unchecked_24px';

  if (secure) {
    uncheckIcon = '#ic_lock_outline_24px';
  }

  const opacity = layer.getOpacity();

  let headerIcon = HeaderIcon(style, opacity);
  if (!headerIcon) {
    headerIcon = icon;
    headerIconCls = iconCls;
  }

  const eventOverlayProps = new CustomEvent('overlayproperties', {
    bubbles: true,
    detail: {
      layer
    }
  });

  const getCheckIcon = (visible) => {
    const isVisible = visible ? checkIcon : uncheckIcon;
    return isVisible;
  };

  const getLayer = () => layer;

  const toggleVisible = function toggleVisible(visible) {
    const layerGroup = layer.get('group');
    const groupExclusive = (viewer.getGroup(layerGroup) && viewer.getGroup(layerGroup).exclusive);
    if (!visible && groupExclusive) {
      const layers = viewer.getLayersByProperty('group', layerGroup);
      layers.forEach(l => l.setVisible(false));
    }
    layer.setVisible(!visible);
    return !visible;
  };

  const layerIcon = Button({
    cls: `${headerIconCls} round compact icon-small light relative no-shrink`,
    click() {
      if (!secure) {
        toggleVisible(layer.getVisible());
      }
    },
    style: {
      height: '1.5rem',
      width: '1.5rem'
    },
    ariaLabel: 'Lager ikon',
    icon: headerIcon,
    tabIndex: -1
  });

  buttons.push(layerIcon);

  const label = Component({
    onRender() {
      const labelEl = document.getElementById(this.getId());
      labelEl.addEventListener('click', (e) => {
        layerIcon.dispatch('click');
        e.preventDefault();
      });
    },
    render() {
      const labelCls = 'text-smaller padding-x-small grow pointer no-select overflow-hidden';
      return `<div id="${this.getId()}" class="${labelCls}">${title}</div>`;
    }
  });

  const toggleButton = Button({
    cls: 'round small icon-smaller no-shrink',
    click() {
      if (!secure) {
        toggleVisible(layer.getVisible());
      }
    },
    style: {
      'align-self': 'center',
      'padding-left': '.5rem'
    },
    icon: getCheckIcon(layer.getVisible()),
    ariaLabel: 'Växla lagersynlighet',
    tabIndex: -1
  });

  buttons.push(toggleButton);

  const layerInfoMenuItem = Component({
    onRender() {
      const labelEl = document.getElementById(this.getId());
      labelEl.addEventListener('click', (e) => {
        document.getElementById(this.getId()).dispatchEvent(eventOverlayProps);
        document.getElementById(popupMenuId).dispatchEvent(new Event('toggleoverlaypopup'));
        e.preventDefault();
      });
    },
    render() {
      const labelCls = 'text-smaller padding-x-small grow pointer no-select overflow-hidden';
      return `<li id="${this.getId()}" class="${labelCls}">Visa lagerinformation</li>`;
    }
  });
  popupMenuItems.push(layerInfoMenuItem);

  if (layer.get('removable')) {
    const removeLayerMenuItem = Component({
      onRender() {
        const labelEl = document.getElementById(this.getId());
        labelEl.addEventListener('click', (e) => {
          layerList.removeOverlay(layer.get('name'));
          viewer.getMap().removeLayer(layer);
          document.getElementById(popupMenuId).dispatchEvent(new Event('toggleoverlaypopup'));
          e.preventDefault();
        });
      },
      render() {
        const labelCls = 'text-smaller padding-x-small grow pointer no-select overflow-hidden';
        return `<li id="${this.getId()}" class="${labelCls}">Ta bort lager</li>`;
      }
    });
    popupMenuItems.push(removeLayerMenuItem);
  }

  const popupMenuList = Component({
    onAdd() {
      this.addComponents(popupMenuItems);
    },
    render() {
      let html = `<ul id="${this.getId()}" class="hidden">`;
      popupMenuItems.forEach((item) => {
        html += `${item.render()}`;
      });
      html += '</ul>';
      return html;
    }
  });

  const togglePopupMenu = function togglePopupMenu(eventFromThisComponent) {
    const el = document.getElementById(popupMenuList.getId());
    if (!eventFromThisComponent || popupMenuActive) {
      el.classList.add('hidden');
      popupMenuActive = false;
    } else {
      el.classList.remove('hidden');
      popupMenuActive = true;
    }
  };

  const moreInfoButton = Button({
    cls: 'round small icon-smallest no-shrink',
    click() {
      const eventShowOverlayPopup = new CustomEvent('showoverlaypopup', {
        bubbles: true,
        detail: {
          id: popupMenuList.getId()
        }
      });
      if (popupMenuItems.length > 1) {
        document.getElementById(this.getId()).dispatchEvent(eventShowOverlayPopup);
      } else {
        document.getElementById(this.getId()).dispatchEvent(eventOverlayProps);
      }
    },
    style: {
      'align-self': 'center'
    },
    icon: '#fa-ellipsis-v',
    ariaLabel: 'Visa lagerinfo',
    tabIndex: -1
  });

  buttons.push(moreInfoButton);
  const ButtonsHtml = `${layerIcon.render()}${label.render()}${toggleButton.render()}${moreInfoButton.render()}`;

  const removeOverlayMenuItem = function removeListeners() {
    const popupMenuListEl = document.getElementById(popupMenuList.getId());
    popupMenuListEl.remove();
  };

  const onRemove = function onRemove() {
    removeOverlayMenuItem();
    const el = document.getElementById(this.getId());
    el.remove();
  };

  return Component({
    name,
    getLayer,
    onInit() {
      this.on('clear', onRemove.bind(this));
    },
    onAdd(evt) {
      layerList = evt.target;
      const parentEl = document.getElementById(evt.target.getId());
      const htmlString = this.render();
      const el = dom.html(htmlString);
      const map = viewer.getMap();
      if (position === 'top') {
        parentEl.insertBefore(el, parentEl.firstChild);
      } else {
        parentEl.appendChild(el);
      }
      this.addComponents(buttons);
      this.addComponent(label);
      this.addComponent(popupMenuList);
      const popupMenuEl = document.getElementById(popupMenuId);
      popupMenuEl.appendChild(dom.html(popupMenuList.render()));
      popupMenuList.dispatch('render');
      this.dispatch('render');

      const popupMenuListEl = document.getElementById(popupMenuList.getId());
      popupMenuListEl.addEventListener('toggleoverlaypopup', (e) => {
        const eventFromThisComponent = e.detail && e.detail.id === popupMenuList.getId();
        togglePopupMenu(eventFromThisComponent);
      });

      popupMenuListEl.addEventListener('unfocusoverlaypopup', (e) => {
        if (!document.getElementById(moreInfoButton.getId()).contains(e.detail.target)) {
          togglePopupMenu();
        }
      });

      if (layer.getMaxResolution() !== Infinity || layer.getMinResolution() !== 0) {
        const elId = this.getId();
        map.on('moveend', () => {
          if (map.getView().getResolution() > layer.getMinResolution() && map.getView().getResolution() < layer.getMaxResolution()) {
            document.getElementById(elId).classList.remove('semifaded');
          } else {
            document.getElementById(elId).classList.add('semifaded');
          }
        });
      }
      layer.on('change:visible', (e) => {
        toggleButton.dispatch('change', { icon: getCheckIcon(!e.oldValue) });
        const visibleEvent = new CustomEvent('change:visible', {
          bubbles: true
        });
        document.getElementById(this.getId()).dispatchEvent(visibleEvent);
      });
    },
    render() {
      return `<li id="${this.getId()}" class="${cls}">${ButtonsHtml}</li>`;
    }
  });
};

export default OverlayLayer;
