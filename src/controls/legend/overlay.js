import { Component, Button, dom, Collapse } from '../../ui';
import { HeaderIcon, Legend } from '../../utils/legendmaker';
import PopupMenu from '../../ui/popupmenu';
import exportToFile from '../../utils/exporttofile';
import createMoreInfoButton from './moreinfobutton';

const OverlayLayer = function OverlayLayer(options) {
  const {
    headerIconCls = '',
    cls: clsSettings = '',
    icon = '#o_list_24px',
    iconCls = 'grey-lightest',
    layer,
    position = 'top',
    style,
    viewer
  } = options;

  const buttons = [];
  let headerIconClass = headerIconCls;

  const hasStylePicker = viewer.getLayerStylePicker(layer).length > 0;
  const layerIconCls = `round compact icon-small relative no-shrink light ${hasStylePicker ? 'style-picker' : ''}`;
  const cls = `${clsSettings} flex row align-center padding-left padding-right-smaller item wrap`.trim();
  const title = layer.get('title') || 'Titel saknas';
  const name = layer.get('name');
  const secure = layer.get('secure');
  let hasExtendedLegend = false;
  let thisComponent;

  const checkIcon = '#ic_check_circle_24px';
  let uncheckIcon = '#ic_radio_button_unchecked_24px';

  if (secure) {
    uncheckIcon = '#ic_lock_outline_24px';
  }

  const opacity = layer.getOpacity();

  let headerIcon = HeaderIcon(style, opacity);
  if (!headerIcon) {
    headerIcon = icon;
    headerIconClass = iconCls;
    hasExtendedLegend = true;
  }

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

  // Create a legend for the layer and wrap it in a Collapse.
  // Always do this even if there is no extended legend, as user may change symbol later and then its nice to have a placeholder.
  const extendedLegendContent = Component({
    render() {
      const legendContent = Legend({ styleRules: style, layer, viewer });
      if (typeof (legendContent) === 'string') {
        return `<div id="${this.getId()}" class="padding-left">${hasExtendedLegend ? legendContent : ''}</div>`;
      }
      thisComponent.addComponents([legendContent]);
      return `<div id="${this.getId()}" class="padding-left">${hasExtendedLegend ? legendContent.render() : ''}</div>`;
    },
    setContent(content) {
      const contentEl = document.getElementById(this.getId());
      contentEl.innerHTML = content;
    },
    toggle() {
      // Throw an event and let it bubble up to Collapse
      const contentEl = document.getElementById(this.getId());
      const collapseEvent = 'collapse:toggle';
      const customEvt = new CustomEvent(collapseEvent, { bubbles: true });
      contentEl.dispatchEvent(customEvt);
    }
  });
  const extendedLegendCmp = Collapse({ collapseX: false, contentComponent: extendedLegendContent, expanded: layer.get('expanded') });

  const layerIcon = Button({
    cls: `${headerIconClass} ${layerIconCls}`,
    click() {
      if (hasExtendedLegend) {
        extendedLegendContent.toggle();
      }
    },
    style: {
      height: 'calc(1.5rem + 2px)',
      width: 'calc(1.5rem + 2px)'
    },
    ariaLabel: 'Lager ikon',
    icon: headerIcon,
    tabIndex: -1
  });

  buttons.push(layerIcon);

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

  const label = Component({
    onRender() {
      const labelEl = document.getElementById(this.getId());
      labelEl.addEventListener('click', (e) => {
        toggleButton.dispatch('click');
        e.preventDefault();
      });
    },
    render() {
      const labelCls = 'text-smaller padding-x-small grow pointer no-select overflow-hidden basis-50 break-word';
      return `<div id="${this.getId()}" class="${labelCls}">${title}</div>`;
    }
  });

  const moreInfoButton = createMoreInfoButton({ layer, viewer });
  buttons.push(moreInfoButton);
  const ButtonsHtml = `${layerIcon.render()}${label.render()}${toggleButton.render()}${moreInfoButton.render()}`;

  const onRemove = function onRemove() {
    const el = document.getElementById(this.getId());
    el.remove();
  };

  const onLayerStyleChange = function onLayerStyleChange() {
    const newStyle = viewer.getStyle(layer.get('styleName'));
    const layerIconCmp = document.getElementById(layerIcon.getId());
    let newIcon = HeaderIcon(newStyle, opacity);
    if (!newIcon) {
      hasExtendedLegend = true;
      extendedLegendContent.setContent(Legend({ styleRules: newStyle, layer, viewer }).render());
    } else {
      hasExtendedLegend = false;
      extendedLegendContent.setContent('');
    }
    headerIconClass = !newIcon ? iconCls : headerIconCls;
    newIcon = !newIcon ? icon : newIcon;
    layerIconCmp.className = `${headerIconClass} ${layerIconCls}`;
    layerIcon.dispatch('change', { icon: newIcon });
  };

  const onLayerTitleChange = function onLayerTitleChange(newTitle) {
    const labelEl = document.getElementById(label.getId());
    labelEl.innerHTML = newTitle;
  };

  return Component({
    name,
    getLayer,
    onInit() {
      thisComponent = this;
      this.on('clear', onRemove.bind(this));
    },
    onAdd(evt) {
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
      this.addComponent(extendedLegendCmp);
      this.dispatch('render');

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
      layer.on('change:style', () => {
        onLayerStyleChange();
      });
      layer.on('change:title', (e) => {
        onLayerTitleChange(e.target.get('title'));
      });
    },
    render() {
      let extendedLegendHtml = '';
      // Inject the extended legend in the same li element to avoid problems with callers that assumes that each layer is one li, but add a linebreak
      extendedLegendHtml = `<div class="flex-line-break"></div>${extendedLegendCmp.render()}`;
      return `<li id="${this.getId()}" class="${cls}">${ButtonsHtml}${extendedLegendHtml}</li>`;
    }
  });
};

export default OverlayLayer;
