import { Draw } from 'ol/interaction';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Component, Button, dom, Element } from '../ui';
import shapes from './offline-new/shapes';
import offlineToolbar from './offline-new/offline-toolbar';
import offlineConfirmationModal from './offline-new/offline-confirmation-modal';
import * as drawStyles from '../style/drawstyles';

const offline = function offline() {
  let offlineButtonTarget;
  let toolbarTarget;
  let viewer;
  let isActive = false;
  let envelope;
  let map;
  let projection;
  let confirmationContent = '';
  let modal;

  const measureStyle = drawStyles.measureStyle;

  const offlineButton = Button({
    cls: 'o-offline-in padding-small icon-smaller round light box-shadow',
    click() {
      toggleOffline();
    },
    icon: '#ic_screen_share_outline_24px',
    tooltipText: 'Förbered för att gå offline',
    tooltipPlacement: 'east'
  });

  const toolbarButtons = [];

  const envelopeButton = Button({
    cls: 'padding-small icon-smaller round light box-shadow relative',
    click() {
      clearAndRestartInteraction();
      envelopeButton.setState('active');
    },
    icon: '#ic_crop_square_24px',
    tooltipText: 'Rita ett område som ska sparas ned',
    tooltipPlacement: 'south',
    tooltipStyle: 'bottom:-5px;'
  });

  toolbarButtons.push(envelopeButton);

  const clearButton = Button({
    cls: 'padding-small icon-smaller round light box-shadow relative',
    click() {
      clearAndRemoveInteraction();
      envelopeButton.setState('initial');
    },
    icon: '#ic_delete_24px',
    tooltipText: 'Rensa cache',
    tooltipPlacement: 'south',
    tooltipStyle: 'bottom:-5px;'
  });

  toolbarButtons.push(clearButton);

  const toolbarOptions = {
    buttons: toolbarButtons
  }

  const toolbar = offlineToolbar(toolbarOptions);

  const source = new VectorSource();
  
  const vector = new VectorLayer({
    group: 'none',
    name: 'offline',
    title: 'Offline',
    source,
    zIndex: 8,
    styleName: 'origoStylefunction',
    style(feature) {
      return styleFunction(feature);
    }
  });

  function styleFunction(feature) {
    const styleScale = feature.get('styleScale') || 1;
    const labelStyle = drawStyles.getLabelStyle(styleScale);
    const styles = [measureStyle(styleScale)];
    const geometry = feature.getGeometry();
    const geomType = geometry.getType();
    if (geomType === 'Polygon'){
      const point = geometry.getInteriorPoint();
      const useHectare = true;
      const label = drawStyles.formatArea(geometry, useHectare, projection);
      labelStyle.setGeometry(point);
      labelStyle.getText().setText(label);
      styles.push(labelStyle);
    }
    return styles;
  }

  function setActive(state) {
    isActive = state;
  }

  function addInteraction() {
    const drawType = 'box';
    const drawOptions = {
      source: source,
      style(feature) {
        return styleFunction(feature);
      }
    }
    Object.assign(drawOptions, shapes(drawType));

    envelope = new Draw(drawOptions);
    envelope.on('drawend',
      (evt) => {
        map.removeInteraction(envelope);
        envelopeButton.setState('initial');
        
        confirmationContent = '<p>Envelope: ' + evt.feature.getGeometry().getCoordinates() + '</p>';
        const layers = viewer.getLayers();
        confirmationContent = confirmationContent + '<p>LayerNames: ' + layers.map(layer => ' ' + layer.values_.name) + '</p>';
        const confirmationContentElement = Element({
          cls: 'content',
          innerHTML: confirmationContent
        });

        const modalOptions = {
          title: 'Ladda ned kartlager',
          content: confirmationContentElement,
          target: viewer.getId()
        };

        modal = offlineConfirmationModal(modalOptions);
      });

    map.addInteraction(envelope);
  }

  function disableInteraction() {
    document.getElementById(envelopeButton.getId()).classList.remove('active');
    document.getElementById(toolbar.getId()).classList.add('o-hidden');
    setActive(false);
    clearDrawings();
  }

  function enableInteraction() {
    setActive(true);
    document.getElementById(toolbar.getId()).classList.remove('o-hidden');
  }

  function clearAndRestartInteraction() {
    clearAndRemoveInteraction();
    addInteraction();
  }

  function clearAndRemoveInteraction() {
    clearDrawings();
    map.removeInteraction(envelope);
    if (modal) modal.closeModal();
  }

  function clearDrawings() {
    if (envelope) envelope.abortDrawing();
    vector.getSource().clear();
  }

  function toggleOffline() {
    const detail = {
      name: 'offline',
      active: !isActive
    };

    viewer.dispatch('toggleClickInteraction', detail);
  }

  return Component({
    name: 'offline',
    onAdd(evt) {
      viewer = evt.target;
      projection = viewer.getProjection().getCode();
      if (!offlineButtonTarget) offlineButtonTarget = viewer.getMain().getMapTools().getId();
      if (!toolbarTarget) toolbarTarget = 'o-tools-bottom';
      map = viewer.getMap();
      map.addLayer(vector);
      this.addComponents([offlineButton, toolbar]);
      this.render();
      viewer.on('toggleClickInteraction', (detail) => {
        if (detail.name === 'offline' && detail.active) {
          enableInteraction();
          offlineButton.setState('active');
        } else {
          disableInteraction();
          offlineButton.setState('initial');
        }
      });
    },
    onInit() {
    },
    hide() {
      document.getElementById(offlineButton.getId()).classList.add('hidden');
    },
    unhide() {
      document.getElementById(offlineButton.getId()).classList.remove('hidden');
    },
    render() {
      document.getElementById(offlineButtonTarget).appendChild(dom.html(offlineButton.render()));
      document.getElementById(toolbarTarget).appendChild(dom.html(toolbar.render()));
      this.dispatch('render');
    }
  });
};

export default offline;
