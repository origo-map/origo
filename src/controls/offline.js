import { Draw } from 'ol/interaction';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import offlineToolbar from 'offline-new/offline-toolbar';
import { Component, Button, dom, Element } from '../ui';
import shapes from './offline-new/shapes';
import offlineConfirmationModal from './offline-new/offline-confirmation-modal';
import * as drawStyles from '../style/drawstyles';

/**
 * Creates component for drawing an envelope which extent
 * will be used to cache tiles for offline use.
 * @returns Component
 */
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

  /**
   * Button to activate toolbar.
   */
  const offlineButton = Button({
    cls: 'o-offline-in padding-small icon-smaller round light box-shadow',
    click() {
      toggleOffline();
    },
    icon: '#ic_screen_share_outline_24px',
    tooltipText: 'Förbered för att gå offline',
    tooltipPlacement: 'east'
  });

  /**
   * Create buttons for toolbar.
   */
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
  };

  /**
   * Create toolbar.
   */
  const toolbar = offlineToolbar(toolbarOptions);

  /**
   * Define style for envelope drawing.
   * @param {*} feature
   * @returns
   */
  function styleFunction(feature) {
    const styleScale = feature.get('styleScale') || 1;
    const labelStyle = drawStyles.getLabelStyle(styleScale);
    const styles = [measureStyle(styleScale)];
    const geometry = feature.getGeometry();
    const geomType = geometry.getType();
    if (geomType === 'Polygon') {
      const point = geometry.getInteriorPoint();
      const useHectare = true;
      const label = drawStyles.formatArea(geometry, useHectare, projection);
      labelStyle.setGeometry(point);
      labelStyle.getText().setText(label);
      styles.push(labelStyle);
    }
    return styles;
  }

  /**
   * Create vector source and vector layer
   * to be able to draw envelope.
   */
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

  function setActive(state) {
    isActive = state;
  }

  /**
   * Add map interaction for drawing.
   */
  function addInteraction() {
    const drawType = 'box';
    const drawOptions = {
      source,
      style(feature) {
        return styleFunction(feature);
      }
    };
    Object.assign(drawOptions, shapes(drawType));

    /**
     * Add draw functionality for envelope.
     */
    envelope = new Draw(drawOptions);

    /**
     * Add eventhandler to fire on drawend.
     */
    envelope.on(
      'drawend',
      (evt) => {
        map.removeInteraction(envelope);
        envelopeButton.setState('initial');

        /**
         * Create content for confirmation modal.
         */
        confirmationContent = `<p>Envelope: ${evt.feature.getGeometry().getCoordinates()}</p>`;
        const layers = viewer.getLayers();
        /* eslint no-underscore-dangle: [1, { "allow": ["values_"] }] */
        const layerNames = layers.map(layer => `${layer.values_.name}`);
        confirmationContent = `${confirmationContent}<p>LayerNames: ${layerNames}</p>`;
        const confirmationContentElement = Element({
          cls: 'content',
          innerHTML: confirmationContent
        });

        const modalOptions = {
          title: 'Ladda ned kartlager',
          content: confirmationContentElement,
          target: viewer.getId()
        };

        /**
         * Create confirmation modal.
         */
        modal = offlineConfirmationModal(modalOptions);
      }
    );

    /**
     * Add the map interaction.
     */
    map.addInteraction(envelope);
  }

  /**
   * Clears drawing.
   */
  function clearDrawings() {
    if (envelope) envelope.abortDrawing();
    vector.getSource().clear();
  }

  /**
   * Hide toolbar, clear drawing and inactivate offline mode.
   */
  function disableInteraction() {
    document.getElementById(envelopeButton.getId()).classList.remove('active');
    document.getElementById(toolbar.getId()).classList.add('o-hidden');
    setActive(false);
    clearDrawings();
  }

  /**
   * Enable interaction.
   */
  function enableInteraction() {
    setActive(true);
    document.getElementById(toolbar.getId()).classList.remove('o-hidden');
  }

  /**
   * Clear drawings, remove interaction and
   * close confirmation modal if present.
   */
  function clearAndRemoveInteraction() {
    clearDrawings();
    map.removeInteraction(envelope);
    if (modal) modal.closeModal();
  }

  /**
   * Restart interaction.
   */
  function clearAndRestartInteraction() {
    clearAndRemoveInteraction();
    addInteraction();
  }

  /**
   * Dispatch toggleClickInteraction for
   * offline component.
   */
  function toggleOffline() {
    const detail = {
      name: 'offline',
      active: !isActive
    };

    viewer.dispatch('toggleClickInteraction', detail);
  }

  /**
   * Return offline component
   * with toolbar and buttons.
   */
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
