import { Component, Button, dom } from '../../ui';
import PopupMenu from '../../ui/popupmenu';
import exportToFile from '../../utils/exporttofile';

export default function createMoreInfoButton(params) {
  const {
    layer,
    group = {},
    viewer
  } = params;
  const popupMenuItems = [];
  let moreInfoButton;
  let popupMenu;
  const showPopup = group.zoomToExtent && group.extent; // In case of zoomToExtent we always want to show popupmenu

  const eventOverlayProps = new CustomEvent('overlayproperties', {
    bubbles: true,
    detail: {
      layer,
      group
    }
  });

  if (layer || group.opacityControl || group.description || (group.abstract && !group.showAbstractInLegend)) {
    const layerInfoMenuItem = Component({
      onRender() {
        const labelEl = document.getElementById(this.getId());
        labelEl.addEventListener('click', (e) => {
          popupMenu.setVisibility(false);
          document.getElementById(moreInfoButton.getId()).dispatchEvent(eventOverlayProps);
          e.preventDefault();
          e.stopPropagation();
          popupMenu.setVisibility(false);
        });
      },
      render() {
        const labelCls = 'text-smaller padding-x-small grow pointer no-select overflow-hidden';
        return `<li id="${this.getId()}" class="${labelCls}">Visa ${layer ? 'lagerinformation' : 'gruppinformation'}</li>`;
      }
    });
    popupMenuItems.push(layerInfoMenuItem);
  }

  if ((layer && layer.get('zoomToExtent')) || (group.zoomToExtent && group.extent)) {
    const zoomToExtentMenuItem = Component({
      onRender() {
        const labelEl = document.getElementById(this.getId());
        labelEl.addEventListener('click', (e) => {
          if (layer) {
            const extent = typeof layer.getSource !== 'undefined' && typeof layer.getSource().getExtent !== 'undefined' ? layer.getSource().getExtent() : layer.getExtent();
            if (layer.getVisible()) {
              viewer.getMap().getView().fit(extent, {
                padding: [50, 50, 50, 50],
                duration: 1000
              });
              e.preventDefault();
            }
          } else if (group.zoomToExtent) {
            const extent = group.extent;
            viewer.getMap().getView().fit(extent, {
              padding: [50, 50, 50, 50],
              duration: 1000
            });
            e.preventDefault();
          }
          e.stopPropagation();
          popupMenu.setVisibility(false);
        });
      },
      render() {
        const labelCls = 'text-smaller padding-x-small grow pointer no-select overflow-hidden';
        return `<li id="${this.getId()}" class="${labelCls}">Zooma till</li>`;
      }
    });
    popupMenuItems.push(zoomToExtentMenuItem);
  }

  if (layer && layer.get('exportable')) {
    const exportFormat = layer.get('exportFormat') || layer.get('exportformat');
    let exportFormatArray = [];
    if (exportFormat && typeof exportFormat === 'string') {
      exportFormatArray.push(exportFormat);
    } else if (exportFormat && Array.isArray(exportFormat)) {
      exportFormatArray = exportFormat;
    }
    const formats = exportFormatArray.map(format => format.toLowerCase()).filter(format => format === 'geojson' || format === 'gpx' || format === 'kml');
    if (formats.length === 0) { formats.push('geojson'); }
    formats.forEach((format) => {
      const exportLayerMenuItem = Component({
        onRender() {
          const labelEl = document.getElementById(this.getId());
          labelEl.addEventListener('click', (e) => {
            const features = layer.getSource().getFeatures();
            exportToFile(features, format, {
              featureProjection: viewer.getProjection().getCode(),
              filename: layer.get('title') || 'export'
            });
            e.preventDefault();
            e.stopPropagation();
            popupMenu.setVisibility(false);
          });
        },
        render() {
          let exportLabel;
          if (exportFormatArray.length > 1) {
            exportLabel = `Spara lager (.${format})`;
          } else { exportLabel = 'Spara lager'; }
          const labelCls = 'text-smaller padding-x-small grow pointer no-select overflow-hidden';
          return `<li id="${this.getId()}" class="${labelCls}">${exportLabel}</li>`;
        }
      });
      popupMenuItems.push(exportLayerMenuItem);
    });
  }

  if (layer && layer.get('removable')) {
    const removeLayerMenuItem = Component({
      onRender() {
        const labelEl = document.getElementById(this.getId());
        labelEl.addEventListener('click', (e) => {
          const doRemove = (layer.get('promptlessRemoval') === true) || window.confirm('Vill du radera lagret?');
          if (doRemove) {
            viewer.getMap().removeLayer(layer);
            e.preventDefault();
            e.stopPropagation();
          }
          popupMenu.setVisibility(false);
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
    onInit() {
      this.addComponents(popupMenuItems);
    },
    render() {
      let html = `<ul id="${this.getId()}">`;
      popupMenuItems.forEach((item) => {
        html += `${item.render()}`;
      });
      html += '</ul>';
      return html;
    }
  });

  const createPopupMenu = function createPopupMenu() {
    const moreInfoButtonEl = document.getElementById(moreInfoButton.getId());
    const onUnfocus = (e) => {
      if (!moreInfoButtonEl.contains(e.target)) {
        popupMenu.setVisibility(false);
      }
    };
    popupMenu = PopupMenu({ onUnfocus, cls: 'overlay-popup' });
    const newDiv = document.createElement('div');
    newDiv.classList.add('justify-end', 'flex', 'relative', 'basis-100');
    moreInfoButtonEl.insertAdjacentElement('afterend', newDiv);
    newDiv.appendChild(dom.html(popupMenu.render()));
    popupMenu.setContent(popupMenuList.render());
    popupMenuList.dispatch('render');
    popupMenu.setVisibility(true);
  };

  const togglePopupMenu = function togglePopupMenu() {
    if (!popupMenu) {
      createPopupMenu();
    } else {
      popupMenu.toggleVisibility();
    }
  };

  if (popupMenuItems.length > 0) {
    moreInfoButton = Button({
      cls: 'round small icon-smaller no-shrink',
      click() {
        if (popupMenuItems.length > 1 || showPopup) {
          togglePopupMenu();
        } else {
          document.getElementById(this.getId()).dispatchEvent(eventOverlayProps);
        }
      },
      style: {
        'align-self': 'center'
      },
      icon: '#ic_more_vert_24px',
      ariaLabel: 'Visa lagerinfo',
      tabIndex: -1
    });
    moreInfoButton.on('render', function onRenderButton() {
      document.getElementById(this.getId()).onclick = function handleEvent(e) { e.stopPropagation(); };
    });
    return moreInfoButton;
  }
  return false;
}
