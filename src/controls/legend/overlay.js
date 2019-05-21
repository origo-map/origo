import { Component, Button, dom } from '../../ui';
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
  let removeButton;
  let ButtonsHtml;
  let layerList;

  let cls = `${clsSettings} flex row align-center padding-left padding-right item`.trim();
  const title = layer.get('title') || 'Titel saknas';
  const name = layer.get('name');
  const secure = layer.get('secure');

  const checkIcon = '#ic_check_circle_24px';
  let uncheckIcon = '#ic_radio_button_unchecked_24px';

  if (secure) {
    uncheckIcon = '#ic_lock_outline_24px';
    cls += '"style="pointer-events:none';
  }

  const opacity = layer.getOpacity();

  let headerIcon = HeaderIcon(style, opacity);
  if (!headerIcon) {
    headerIcon = icon;
    headerIconCls = iconCls;
  }

  const getCheckIcon = (visible) => {
    const isVisible = visible ? checkIcon : uncheckIcon;
    return isVisible;
  };

  const getLayer = () => layer;

  const toggleVisible = function toggleVisible(visible) {
    layer.setVisible(!visible);
    return !visible;
  };

  const layerIcon = Button({
    cls: `${headerIconCls} round compact icon-small light relative no-shrink`,
    click() {
      const eventOverlayProps = new CustomEvent('overlayproperties', {
        bubbles: true,
        detail: {
          layer
        }
      });
      document.getElementById(this.getId()).dispatchEvent(eventOverlayProps);
    },
    style: {
      height: '1.5rem',
      width: '1.5rem'
    },
    icon: headerIcon
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
      const labelCls = 'text-smaller padding-x-small grow pointer no-select text-nowrap overflow-hidden text-overflow-ellipsis';
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
    icon: getCheckIcon(layer.getVisible())
  });

  buttons.push(toggleButton);

  if (layer.get('removable')) {
    removeButton = Button({
      cls: 'round small icon-smaller no-shrink',
      click() {
        layerList.removeOverlay(layer.get('name'));
        viewer.getMap().removeLayer(layer);
      },
      style: {
        'align-self': 'center',
        'padding-left': '.5rem'
      },
      icon: '#ic_remove_circle_outline_24px'
    });
    buttons.push(removeButton);
    ButtonsHtml = `${layerIcon.render()}${label.render()}${removeButton.render()}${toggleButton.render()}`;
  } else {
    ButtonsHtml = `${layerIcon.render()}${label.render()}${toggleButton.render()}`;
  }

  const onRemove = function onRemove() {
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
      if (position === 'top') {
        parentEl.insertBefore(el, parentEl.firstChild);
      } else {
        parentEl.appendChild(el);
      }
      this.addComponents(buttons);
      this.addComponent(label);
      this.dispatch('render');
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
