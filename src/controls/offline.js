/* eslint-disable no-use-before-define */
import { Draw } from 'ol/interaction';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import offlineToolbar from 'offline-new/offline-toolbar';
import { Component, Button, dom, Element } from '../ui';
import shapes from './offline-new/shapes';
import offlineConfirmationModal from './offline-new/offline-confirmation-modal';
import * as drawStyles from '../style/drawstyles';

/**
 * Creates a component for drawing an envelope whose extent
 * will be used to cache tiles for offline use.
 *
 * @returns {Component} The offline drawing component.
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

  // Create an offline button to toggle offline interaction.
  const offlineButton = Button({
    cls: 'o-offline-in padding-small icon-smaller round light box-shadow',
    click() {
      toggleOffline();
    },
    icon: '#ic_screen_share_outline_24px',
    tooltipText: 'Förbered för att gå offline',
    tooltipPlacement: 'east'
  });

  // Initialize an empty array for toolbar buttons.
  const toolbarButtons = [];

  // Create an envelope drawing button to enable interaction.
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

  // Create a clear button to remove drawings and disable interaction.
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

  // Create options object for the toolbar with buttons.
  const toolbarOptions = {
    buttons: toolbarButtons
  };

  // Create the offline toolbar.
  const toolbar = offlineToolbar(toolbarOptions);

  // Function to style drawn features.
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

  // Create a vector source for drawn features.
  const source = new VectorSource();

  // Create a vector layer to display drawn features.
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

  // Function to set the active state of the component.
  function setActive(state) {
    isActive = state;
  }

  /**
   * Adds a draw interaction to the map for drawing an envelope (e.g., box).
   * Handles the 'drawend' event to finalize the drawing, remove the interaction, and trigger further actions.
   *
   * @function
   * @name addInteraction
   *
   * @throws {Error} Throws an error if the 'shapes' module or the 'Draw' interaction is not properly configured.
   */
  function addInteraction() {
    // Specify the type of geometry to be drawn (e.g., 'box').
    const drawType = 'box';

    // Configure draw options including the source and styling function.
    const drawOptions = {
      source,
      style(feature) {
        // Use the specified style function to style the drawn feature.
        return styleFunction(feature);
      }
    };

    // Extend draw options with shape-specific settings.
    Object.assign(drawOptions, shapes(drawType));

    // Create a new draw interaction with the specified options.
    envelope = new Draw(drawOptions);

    // Set up an event listener for the 'drawend' event.
    envelope.on(
      'drawend',
      (evt) => {
        // Finalize the drawing by removing the draw interaction.
        map.removeInteraction(envelope);

        // Reset the state of the envelopeButton to 'initial'.
        envelopeButton.setState('initial');

        // Extract coordinates of the drawn feature and create a confirmation message.
        confirmationContent = `<p>Envelope: ${evt.feature.getGeometry().getCoordinates()}</p>`;

        // Retrieve layers from the viewer and extract layer names.
        const layers = viewer.getLayers();
        /* eslint no-underscore-dangle: [1, { "allow": ["values_"] }] */
        const layerNames = layers.map(layer => `${layer.values_.name}`);

        // Append layer information to the confirmation message.
        confirmationContent = `${confirmationContent}<p>LayerNames: ${layerNames}</p>`;

        // Create an HTML element with the confirmation message.
        const confirmationContentElement = Element({
          cls: 'content',
          innerHTML: confirmationContent
        });

        // Configure options for the offline confirmation modal.
        const modalOptions = {
          title: 'Ladda ned kartlager',
          content: confirmationContentElement,
          target: viewer.getId()
        };

        // Create and display the offline confirmation modal.
        modal = offlineConfirmationModal(modalOptions);
      }
    );

    // Add the draw interaction to the map.
    map.addInteraction(envelope);
  }

  // Function to clear drawn features and disable interaction.
  function clearDrawings() {
    if (envelope) envelope.abortDrawing();
    vector.getSource().clear();
  }

  // Function to disable interaction and update button states.
  function disableInteraction() {
    document.getElementById(envelopeButton.getId()).classList.remove('active');
    document.getElementById(toolbar.getId()).classList.add('o-hidden');
    setActive(false);
    clearDrawings();
  }

  // Function to enable interaction and update button states.
  function enableInteraction() {
    setActive(true);
    document.getElementById(toolbar.getId()).classList.remove('o-hidden');
  }

  // Function to clear drawings and remove the draw interaction.
  function clearAndRemoveInteraction() {
    clearDrawings();
    map.removeInteraction(envelope);
    if (modal) modal.closeModal();
  }

  // Function to clear drawings and restart the draw interaction.
  function clearAndRestartInteraction() {
    clearAndRemoveInteraction();
    addInteraction();
  }

  // Function to toggle the offline state.
  function toggleOffline() {
    const detail = {
      name: 'offline',
      active: !isActive
    };

    viewer.dispatch('toggleClickInteraction', detail);
  }

  // Return the main Component with specific properties and methods.
  return Component({

    /**
     * The name of the offline component.
     * @type {string}
     */
    name: 'offline',

    /**
     * Event handler executed when the component is added to the viewer.
     *
     * @param {Object} evt - The event object.
     * @param {Object} evt.target - The viewer instance.
     *
     * The `onAdd` method performs several tasks upon component addition to the viewer, including viewer
     * and projection initialization, setting button and toolbar targets, initializing the map and adding
     * a vector layer, adding specific components to the current component, and setting up an event listener
     * for the 'toggleClickInteraction' event in the viewer.
     */
    onAdd(evt) {
      // Set the viewer variable to the target of the event (viewer instance).
      viewer = evt.target;

      // Retrieve the current map projection.
      projection = viewer.getProjection().getCode();

      // Initialize the target for the offline button and toolbar if not already set.
      if (!offlineButtonTarget) offlineButtonTarget = viewer.getMain().getMapTools().getId();
      if (!toolbarTarget) toolbarTarget = 'o-tools-bottom';

      // Get the map instance and add the vector layer.
      map = viewer.getMap();
      map.addLayer(vector);

      // Add offlineButton and toolbar components to the current component.
      this.addComponents([offlineButton, toolbar]);

      // Render the current component, updating its appearance in the viewer.
      this.render();

      // Set up an event listener for the 'toggleClickInteraction' event in the viewer.
      viewer.on('toggleClickInteraction', (detail) => {
        // Check if the event is related to the 'offline' component and whether it is active.
        if (detail.name === 'offline' && detail.active) {
          // Enable interaction and set the state of offlineButton to 'active'.
          enableInteraction();
          offlineButton.setState('active');
        } else {
          // Disable interaction and set the state of offlineButton to 'initial'.
          disableInteraction();
          offlineButton.setState('initial');
        }
      });
    },

    /**
     * Called when the component is initialized.
     */
    onInit() {
    },

    /**
     * Hides the offline button.
     */
    hide() {
      document.getElementById(offlineButton.getId()).classList.add('hidden');
    },

    /**
     * Unhides the offline button.
     */
    unhide() {
      document.getElementById(offlineButton.getId()).classList.remove('hidden');
    },

    /**
     * Renders the offline button and toolbar in the viewer.
     */
    render() {
      document.getElementById(offlineButtonTarget).appendChild(dom.html(offlineButton.render()));
      document.getElementById(toolbarTarget).appendChild(dom.html(toolbar.render()));
      this.dispatch('render');
    }
  });
};

export default offline;
