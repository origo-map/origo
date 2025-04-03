/// * eslint-disable no-use-before-define */
import { Draw } from 'ol/interaction';
import { createBox } from 'ol/interaction/Draw';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Stroke } from 'ol/style';
import { Component, Button, dom, Element, Modal } from '../ui';
import ImageTileOfflineSource from '../layer/imagetileofflinesource';
import VectorOfflineSource from '../layer/vectorofflinesource';

/**
 * Creates the Offline toolbar component
 *
 * @returns {Component} The offline drawing component.
 */
export default function Offline(opts = {}) {
  const {
    localization
  } = opts;
  let offlineButtonTarget;
  let toolbarTarget;
  let viewer;
  let isActive = false;
  let envelope;
  let map;
  let modal;
  /** Store info about layers that are currently being downloaded */
  let layersInProgress = [];
  let envelopeButton;
  let goOfflineButton;
  let syncButton;
  let existingOfflineExtentsLayer;

  /**
   * Convenience function to localize strings
   * @param {any} key
   * @returns
   */
  function localize(key) {
    return localization.getStringByKeys({ targetParentKey: 'offline', targetKey: key });
  }

  /**
   * Helper to determine if a layer has an offline capable source.
   * @param {any} layer
   * @returns {Boolean} true if it is an offline layer. False otherwise.
   */
  function isOfflineLayer(layer) {
    return layer.getSource && (layer.getSource() instanceof VectorOfflineSource || layer.getSource() instanceof ImageTileOfflineSource);
  }
  /**
   * Returns all layers that have offline capability. Should always be called before each operation as user may add layers dynamically
   * @returns array of layers
   */
  function getOfflineLayers() {
    return viewer.getLayers().filter(layer => isOfflineLayer(layer));
  }

  /**
   * Helper to create an Origo modal with some defaults
   * @param {any} options
   * @returns
   */
  function createModal(options) {
    const { title, content, onClose } = options;
    const localModal = Modal({
      title,
      contentCmp: content,
      cls: 'o-offline-modal',
      target: viewer.getId(),
      style: ''
    });

    localModal.on('closed', onClose);
    return localModal;
  }

  /**
   * Draws the already downloaded extents as squares in the map
   */
  function drawExistingOfflineSelections() {
    // Show existing offline layers
    const offlineLayers = getOfflineLayers();
    const responses = [];
    offlineLayers.forEach(currLayer => {
      responses.push(currLayer.getSource().getExtents());
    });
    existingOfflineExtentsLayer.getSource().clear();
    Promise.all(responses).then((features) => {
      // Only add unique extents as all layers will have the same extents as we can't (yet) select which layers to preload
      // and each layer stores their own extents
      features.flat().forEach(currFeat => {
        // Do a simple string comparison, the extent structure is a simple array and the extent is pretty much the same as the geometry.
        if (!existingOfflineExtentsLayer.getSource().getFeatures().some(f => f.getGeometry().getExtent().toString() === currFeat.getGeometry().getExtent().toString())) {
          existingOfflineExtentsLayer.getSource().addFeature(currFeat);
        }
      });

      existingOfflineExtentsLayer.setVisible(true);
    });
  }

  /**
   * Calculates an estimate of how much data will be fetched
   * @param {any} layers Array of Layer
   * @param {any} extent Extent to calculate for
   * @returns
   */
  function getOfflineCalculations(layers, extent) {
    const results = layers.map(currLayer => {
      const currSource = currLayer.getSource();
      // Assume at least one progress callback for vector layers
      let numberOfTiles = 1;
      let estimateBytes = 0;
      // Tile layers have an estimate function to calculate number of tiles to load
      if (currSource.calculateEstimateForExtent) {
        ({ numberOfTiles, estimateBytes } = currSource.calculateEstimateForExtent(extent));
      }
      // Preformat estimated download size as string
      let size;
      if (estimateBytes >= 1e9) {
        size = `${(estimateBytes / 1e9).toFixed(2)} GB`;
      } else if (estimateBytes >= 1e6) {
        size = `${(estimateBytes / 1e6).toFixed(2)} MB`;
      } else {
        size = `${(estimateBytes / 1e3).toFixed(2)} KB`;
      }
      return {
        name: currLayer.get('name'),
        size,
        tiles: numberOfTiles,
        isVector: currLayer.get('layerType') === 'vector',
        tilesDownloaded: 0
      };
    });

    return results;
  }
  /**
   * Clears drawings and remove the draw interaction.
   */
  function clearAndRemoveInteraction() {
    if (envelope) envelope.abortDrawing();
    map.removeInteraction(envelope);
  }

  /**
   * Helper for creation an Origo button with some defaults
   * @param {any} options
   * @returns
   */
  function createButton(options) {
    return Button({
      cls: options.cls,
      click: options.click,
      text: options.text,
      icon: options.icon,
      state: options.state || 'initial',
      tooltipText: options.tooltipText,
      tooltipPlacement: options.tooltipPlacement,
      tooltipStyle: options.tooltipStyle
    });
  }
  /**
   * Removes the visible downloaded extents
   */
  function clearOfflineSelections() {
    existingOfflineExtentsLayer.getSource().clear();
    existingOfflineExtentsLayer.setVisible(false);
  }

  /**
   * Creates the "do you want to download dialog"
   * @param {any} feature
   * @returns
   */
  async function createSaveModalContent(feature) {
    const offlineLayers = getOfflineLayers();
    const extent = feature.getGeometry().getExtent();

    // Get an estimate of how much that should be downloaded so the user can decide
    const offlineSize = getOfflineCalculations(offlineLayers, extent);

    const modalCloseButton = createButton({
      cls: 'o-offline-modal-btn-close icon-smaller',
      text: localize('dlg_save_abort'),
      icon: '#ic_close_24px',
      click() {
        modal.closeModal();
        modal.dispatch('closed');
        clearAndRemoveInteraction();
        clearOfflineSelections();
      }
    });

    // Add the Save button, which when clicked starts the download. The progress dialog is not opened automatically, that
    // is done by the user.
    const modalSaveButton = createButton({
      cls: 'o-offline modal btn-save icon-smaller',
      text: localize('dlg_save_save'),
      icon: '#ic_save_24px',
      click() {
        // Save info about the layers that are about to be downloaded so we can display progress
        layersInProgress = offlineSize;
        const responses = layersInProgress.map(offlineLayer => {
          const numberOfTilesToDownload = offlineLayer.tiles;
          let tilesDownloaded = 0;
          const myOfflineLayer = offlineLayer;
          // Define the callback that updates progress for tile layers. Relies on outer scope tilesDownloaded for separation of counters.
          const progressCallback = () => {
            tilesDownloaded += 1;
            // Add this to ongoing info so status modal does not have wait until next progress callback
            myOfflineLayer.tilesDownloaded = tilesDownloaded;
            // Find the correct element to update. I would prefer if this was done by keepeing a reference ti the element, but the Element object
            // does not tell us which tag it created.
            const percentElement = document.querySelector(`.${offlineLayer.name}-progress-percent`);
            // Check if the modal is open before we try and update the progress
            if (percentElement) {
              percentElement.innerHTML = `${Math.round((tilesDownloaded / numberOfTilesToDownload) * 100)}%`;
            }
          };
          return viewer.getLayer(offlineLayer.name).getSource().preload(extent, progressCallback);
        });

        modal.closeModal();
        modal.dispatch('closed');
        clearOfflineSelections();
        viewer.getLogger().createToast({
          status: 'info',
          title: localize('toast_starting_title'),
          message: localize('toast_starting_body')
        });

        // Resolves when all layers are done
        Promise.all(responses).then(() => {
          // Clear info about ongoing download (as there aren't any)
          layersInProgress = [];
          viewer.getLogger().createToast({
            status: 'success',
            title: localize('toast_finished_title'),
            message: localize('toast_finished_body')
          });
        });
      }
    });

    const actionButtons = Element({
      style: 'display: flex; flex-gap: 2px; justify-content: end;',
      components: [modalCloseButton, modalSaveButton]
    });

    const lagerElements = offlineSize.map(lager => Element({
      tagName: 'span', innerHTML: `${localize('global_layer')}: ${lager.name}: ${lager.isVector ? `(${localize('global_vector')})` : `${lager.size}(${lager.tiles} ${localize('global_tiles')})`}`
    }));

    return Element({
      style: 'display: flex; flex-direction: column; gap: 4px;',
      components: [
        Element({ tagName: 'span', innerHTML: `${localize('dlg_save_body')}` }),
        Element({
          style: 'display: flex; flex-direction: column; gap: 4px;',
          components: [
            Element({ style: 'padding-top: 8px; padding-bottom: 8px; display: flex; flex-direction: column; gap: 4px;', components: lagerElements }),
            Element({ tagName: 'hr' }),
            actionButtons
          ]
        })
      ]
    });
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
    // Configure draw options including the source and styling function.
    const drawOptions = {
      type: 'Circle',
      geometryFunction: createBox()
    };

    // Create a new draw interaction with the specified options.
    envelope = new Draw(drawOptions);

    // Set up an event listener for the 'drawend' event.
    envelope.on(
      'drawend',
      async (evt) => {
        // Finalize the drawing by removing the draw interaction.
        map.removeInteraction(envelope);

        // Reset the state of the envelopeButton to 'initial'.
        envelopeButton.setState('initial');

        const modalContent = await createSaveModalContent(evt.feature);

        modal = createModal({
          title: localize('dlg_save_title'),
          content: modalContent,
          onClose: () => {
            clearAndRemoveInteraction();
            clearOfflineSelections();
          }
        });
      }
    );

    // Add the draw interaction to the map.
    map.addInteraction(envelope);
  }

  // Function to clear drawings and restart the draw interaction.
  function clearAndRestartInteraction() {
    clearAndRemoveInteraction();
    addInteraction();
  }

  /**
   * Displays ongoing downloads.
   *
   * @param {any} offlineSizes
   * @returns
   */
  function createDownloadModalContent() {
    let layerElements = layersInProgress.map(currLayer => {
      const percent = `${Math.round((currLayer.tilesDownloaded / currLayer.tiles) * 100)}%`;
      return Element({
        style: 'display: flex; gap: 4px;',
        components: [
          Element({ tagName: 'span', innerHTML: `${localize('global_layer')}: ${currLayer.name}: ${currLayer.isVector ? `${localize('global_vector')}` : `${currLayer.size}(${currLayer.tiles} ${localize('global_tiles')})`}` }),
          Element({
            style: 'display: flex; gap: 2px;',
            components: [
              Element({ cls: `${currLayer.name}-progress`, tagName: 'span', innerHTML: `${localize('dlg_download_progress')}: ` }),
              Element({ cls: `${currLayer.name}-progress-percent`, tagName: 'span', innerHTML: percent })
            ]
          })
        ]
      });
    });

    if (layerElements.length === 0) {
      layerElements = [Element({ tagName: 'p', innerHTML: `${localize('dlg_download_no_active')}` })];
    }

    return Element({
      style: 'display: flex; flex-direction: column; gap: 4px;',
      components: [
        Element({ tagName: 'span', innerHTML: `${localize('dlg_download_layers')}` }),
        Element({
          style: 'display: flex; flex-direction: column; gap: 4px;',
          components: [
            Element({ style: 'padding-top: 8px; padding-bottom: 8px;', components: layerElements })
          ]
        })
      ]
    });
  }

  /**
   * Toggles visibility of offline layers when going offline/online. State is persisted in localstorage
   * in order to be able to start in offline mode without network
   */
  function toggleOfflineLayers() {
    const currentState = goOfflineButton.getState();
    // Layers that are explicitly declared with "offline" are kept visible, assuming they can handle it.
    // Layers implementing any of the known offline source types are also kept visible
    const onlineLayers = viewer.getLayers().filter(layer => !isOfflineLayer(layer) && !layer.getProperties().offline);
    if (currentState === 'active') {
      goOfflineButton.setState('inactive');
      localStorage.setItem('offline_state', 'false');

      onlineLayers.forEach(layer => {
        const existingState = localStorage.getItem(`offline_existing_state:${layer.getProperties().name}`);
        layer.setVisible(existingState === 'true');
        localStorage.removeItem(`offline_existing_state:${layer.getProperties().name}`);
      });
      const temporyBackgroundlayerName = localStorage.getItem('offline_temporary_background');
      if (temporyBackgroundlayerName) {
        const temporyBackgroundlayer = viewer.getLayer(temporyBackgroundlayerName);
        temporyBackgroundlayer.setVisible(false);
        localStorage.removeItem('offline_temporary_background');
      }
    } else {
      goOfflineButton.setState('active');
      localStorage.setItem('offline_state', 'true');
      // Check current state and store it in localstorage so we remember to reactivate them when user goes online again
      onlineLayers.forEach(layer => {
        localStorage.setItem(`offline_existing_state:${layer.getProperties().name}`, layer.getVisible());
        layer.setVisible(false);
      });
      // Switch to an offline background map if available
      const bglayers = viewer.getLayersByProperty('group', 'background');
      if (bglayers && bglayers.length > 0) {
        const visibleofflinebg = bglayers.find(l => l.getProperties().offline && l.getProperties().visible);
        if (!visibleofflinebg) {
          const firstofflinebg = bglayers.find(l => l.getProperties().offline);
          if (firstofflinebg) {
            firstofflinebg.setVisible(true);
            localStorage.setItem('offline_temporary_background', firstofflinebg.getProperties().name);
          }
        }
      }
    }
  }

  /**
   * Synchronizes local edits for all editable layers
   */
  function syncOfflineLayers() {
    const offlineLayers = getOfflineLayers().filter(l => l.get('editable'));
    const responses = offlineLayers.map(layer => layer.getSource().syncEdits());
    Promise.all(responses).then(() => {
      viewer.getLogger().createToast({
        status: 'success',
        title: `${localize('toast_sync_title')}`,
        message: `${localize('toast_sync_body')}`
      });
    });
  }

  /**
   * Dispatches our active state to all other tools
   */
  function toggleOffline() {
    const detail = {
      name: 'offline',
      active: !isActive
    };
    viewer.dispatch('toggleClickInteraction', detail);
  }

  function createToolbarButtons() {
    envelopeButton = createButton({
      cls: 'padding-small icon-smaller round light box-shadow relative',
      async click() {
        const editLayers = getOfflineLayers().filter(l => l.get('editable'));
        // There is no async some. Do it the hard way.
        const editsPromise = editLayers.map(async l => {
          const res = await l.getSource().getLocalEdits();
          return res.insert.length || res.update.length || res.delete.length;
        });
        const res = await Promise.all(editsPromise);
        if (res.some(r => r)) {
          viewer.getLogger().createModal({
            title: localize('global_error'),
            message: localize('btn_envelope_pending_edits'),
            status: 'danger'
          });
        } else {
          clearAndRestartInteraction();
          drawExistingOfflineSelections();
          envelopeButton.setState('active');
        }
      },
      icon: '#ic_crop_square_24px',
      tooltipText: `${localize('btn_envelope_tooltip')}`,
      tooltipPlacement: 'south',
      tooltipStyle: 'bottom:-5px;'
    });

    const clearButton = createButton({
      cls: 'padding-small icon-smaller round light box-shadow relative',
      click() {
        clearAndRemoveInteraction();
        envelopeButton.setState('initial');
        // If Origo had a confirm modal, this would be a great place to use it.
        if (window.confirm(localize('btn_clear_confirm'))) {
          const offlineLayers = getOfflineLayers();
          // Pick all known offline sources
          const responses = offlineLayers.map(layer => layer.getSource().clearStorage());
          Promise.all(responses).then(() => {
            viewer.getLogger().createToast({
              status: 'success',
              title: `${localize('toast_clear_title')}`,
              message: `${localize('toast_clear_body')}`
            });
          });
        }
      },
      icon: '#ic_delete_24px',
      tooltipText: `${localize('btn_clear_tooltip')}`,
      tooltipPlacement: 'south',
      tooltipStyle: 'bottom:-5px;'
    });

    // Opens the ongoing downloads dialog. In the future, it may also contain info about already downloaded layers.
    const downloadButton = createButton({
      cls: 'padding-small icon-smaller round light box-shadow relative',
      async click() {
        const modalContent = createDownloadModalContent();
        modal = createModal({
          title: `${localize('dlg_download_tile')}`,
          content: modalContent,
          onClose: () => downloadButton.setState('inactive')
        });
        downloadButton.setState('active');
      },
      icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#e8eaed"><path d="M439-82q-76-8-141.5-42.5t-113.5-88Q136-266 108.5-335T81-481q0-155 102.5-268.5T440-880v80q-121 17-200 107.5T161-481q0 121 79 211.5T439-162v80Zm40-198L278-482l57-57 104 104v-245h80v245l103-103 57 58-200 200Zm40 198v-80q43-6 82.5-23t73.5-43l58 58q-47 37-101 59.5T519-82Zm158-652q-35-26-74.5-43T520-800v-80q59 6 113 28.5T733-792l-56 58Zm112 506-56-57q26-34 42-73.5t22-82.5h82q-8 59-30 113.5T789-228Zm8-293q-6-43-22-82.5T733-677l56-57q38 45 61 99.5T879-521h-82Z"/></svg>',
      tooltipText: `${localize('btn_download_tooltip')}`,
      tooltipPlacement: 'south',
      tooltipStyle: 'bottom:-5px;'
    });

    goOfflineButton = createButton({
      cls: 'padding-small icon-smaller round light box-shadow relative',
      async click() {
        toggleOfflineLayers();
      },
      icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#e8eaed"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M21 11l2-2c-3.73-3.73-8.87-5.15-13.7-4.31l2.58 2.58c3.3-.02 6.61 1.22 9.12 3.73zm-2 2c-1.08-1.08-2.36-1.85-3.72-2.33l3.02 3.02.7-.69zM9 17l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zM3.41 1.64L2 3.05 5.05 6.1C3.59 6.83 2.22 7.79 1 9l2 2c1.23-1.23 2.65-2.16 4.17-2.78l2.24 2.24C7.79 10.89 6.27 11.74 5 13l2 2c1.35-1.35 3.11-2.04 4.89-2.06l7.08 7.08 1.41-1.41L3.41 1.64z"/></svg>',
      tooltipText: `${localize('btn_offline_tooltip')}`,
      tooltipPlacement: 'south',
      tooltipStyle: 'bottom:-5px;'
    });

    syncButton = createButton({
      cls: 'padding-small icon-smaller round light box-shadow relative',
      async click() {
        // If there are unsaved edits we must not sync, otherwise local edits will be lost but editstore remembers them.
        // Just block, no fancy grey out of button as that requires events from editStore
        if (viewer.getControlByName('editor').hasEdits()) {
          viewer.getLogger().createModal({
            title: localize('global_error'),
            message: localize('btn_sync_pending_edits'),
            status: 'danger'
          });
        } else {
          syncOfflineLayers();
        }
      },
      icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#e8eaed"><g stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"><path d="M12,4 L12,1 L8,5 L12,9 L12,6 C15.31,6 18,8.69 18,12 C18,13.01 17.75,13.97 17.3,14.8 L18.76,16.26 C19.54,15.03 20,13.57 20,12 C20,7.58 16.42,4 12,4 Z M12,18 C8.69,18 6,15.31 6,12 C6,10.99 6.25,10.03 6.7,9.2 L5.24,7.74 C4.46,8.97 4,10.43 4,12 C4,16.42 7.58,20 12,20 L12,23 L16,19 L12,15 L12,18 Z" fill="#000000"></path></g></svg>',
      tooltipText: `${localize('btn_sync_tooltip')}`,
      tooltipPlacement: 'south',
      tooltipStyle: 'bottom:-5px;'
    });

    return [envelopeButton, clearButton, downloadButton, goOfflineButton, syncButton];
  }

  function createToolbar(toolbarButtons) {
    const toolbarElement = Element({
      cls: 'flex fixed bottom-center divider-horizontal bg-inverted z-index-ontop-high no-print small-gap',
      components: toolbarButtons
    });

    return Element({
      cls: 'o-go-offline-toolbar o-toolbar o-toolbar-horizontal o-padding-horizontal-8 o-rounded-top o-hidden',
      tagName: 'div',
      components: [toolbarElement]
    });
  }
  /**
   * The Offline tool button
   */
  const offlineButton = createButton({
    cls: 'o-offline-in padding-small icon-smaller round light box-shadow',
    click: toggleOffline,
    icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#e8eaed"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M21 11l2-2c-3.73-3.73-8.87-5.15-13.7-4.31l2.58 2.58c3.3-.02 6.61 1.22 9.12 3.73zm-2 2c-1.08-1.08-2.36-1.85-3.72-2.33l3.02 3.02.7-.69zM9 17l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zM3.41 1.64L2 3.05 5.05 6.1C3.59 6.83 2.22 7.79 1 9l2 2c1.23-1.23 2.65-2.16 4.17-2.78l2.24 2.24C7.79 10.89 6.27 11.74 5 13l2 2c1.35-1.35 3.11-2.04 4.89-2.06l7.08 7.08 1.41-1.41L3.41 1.64z"/></svg>',
    tooltipText: localize('btn_tool_title'),
    tooltipPlacement: 'east'
  });

  const toolbarButtons = createToolbarButtons();
  const toolbar = createToolbar(toolbarButtons);

  /**
   * Function to set the active state of the component and changes active state of toolbar button.
   * @param {Boolean} state Desired state
   */
  function setActive(state) {
    isActive = state;
    document.getElementById(offlineButton.getId()).classList.toggle('active', isActive);
  }

  /**
   *  Function to disable interaction and update button states.
   */
  function disableInteraction() {
    document.getElementById(envelopeButton.getId()).classList.remove('active');
    document.getElementById(toolbar.getId()).classList.add('o-hidden');
    setActive(false);
    clearOfflineSelections();
    clearAndRemoveInteraction();
  }

  /**
   * Function to enable interaction and update button states.
   */
  function enableInteraction() {
    setActive(true);
    // Check if we are in offline mode
    const offlineState = localStorage.getItem('offline_state');
    document.getElementById(toolbar.getId()).classList.remove('o-hidden');
    if (offlineState === 'true') {
      goOfflineButton.setState('active');
    }
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
     * The `onAdd` method performs several tasks upon component addition to the viewer, including viewer
     * and projection initialization, setting button and toolbar targets, initializing the map and adding
     * a vector layer, adding specific components to the current component, and setting up an event listener
     * for the 'toggleClickInteraction' event in the viewer.
     *
     * @param {Object} evt - The event object.
     * @param {Object} evt.target - The viewer instance.

     */
    onAdd(evt) {
      // Set the viewer variable to the target of the event (viewer instance).
      viewer = evt.target;
      const offlineState = localStorage.getItem('offline_state');
      if (offlineState === 'true') {
        toggleOfflineLayers();
      }

      // Initialize the target for the offline button and toolbar if not already set.
      if (!offlineButtonTarget) offlineButtonTarget = viewer.getMain().getMapTools().getId();
      if (!toolbarTarget) toolbarTarget = 'o-tools-bottom';

      const scale = 1;

      // Set up a temporary layer for displaying already downloaded extents
      existingOfflineExtentsLayer = new VectorLayer({
        group: 'none',
        name: 'offline-selection',
        source: new VectorSource(),
        stroke: new Stroke({
          color: 'rgba(133, 193, 233, 1)',
          lineDash: [10 * scale, 10 * scale],
          width: 5 * scale
        })
      });
      // Get the map instance and add the vector layer.
      map = viewer.getMap();
      map.addLayer(existingOfflineExtentsLayer);

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
        } else {
          // Disable interaction and set the state of offlineButton to 'initial'.
          disableInteraction();
        }
      });
    },

    /**
     * Called when the component is initialized.
     */
    onInit() {
      // Intentionally left empty
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
      this.dispatch('render'); // Tell our children that we have rendered
    }
  });
}
