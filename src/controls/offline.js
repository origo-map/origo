/* eslint-disable no-use-before-define */
import { Draw } from 'ol/interaction';
import { createBox } from 'ol/interaction/Draw';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { Component, Button, dom, Element, Modal } from '../ui';

/**
 * Creates a component for drawing an envelope whose extent
 * will be used to cache tiles for offline use.
 *
 * @returns {Component} The offline drawing component.
 */
export default function Offline({ localization }) {
  let offlineButtonTarget;
  let toolbarTarget;
  let viewer;
  let isActive = false;
  let envelope;
  let map;
  let modal;
  let layersInProgress = []; // store the layer names that are currently being downloaded

  function localize(key) {
    return localization.getStringByKeys({ targetParentKey: 'offline', targetKey: key });
  }

  const offlineButton = Button({
    cls: 'o-offline-in padding-small icon-smaller round light box-shadow',
    click() {
      toggleOffline();
    },
    icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#e8eaed"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M21 11l2-2c-3.73-3.73-8.87-5.15-13.7-4.31l2.58 2.58c3.3-.02 6.61 1.22 9.12 3.73zm-2 2c-1.08-1.08-2.36-1.85-3.72-2.33l3.02 3.02.7-.69zM9 17l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zM3.41 1.64L2 3.05 5.05 6.1C3.59 6.83 2.22 7.79 1 9l2 2c1.23-1.23 2.65-2.16 4.17-2.78l2.24 2.24C7.79 10.89 6.27 11.74 5 13l2 2c1.35-1.35 3.11-2.04 4.89-2.06l7.08 7.08 1.41-1.41L3.41 1.64z"/></svg>',
    tooltipText: localize('btn_tool_title'),
    tooltipPlacement: 'east'
  });

  // Initialize an empty array for toolbar buttons.
  let toolbarButtons = [];

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
  // TODO: Button should not be visible if no cache is stored
  const clearButton = Button({
    cls: 'padding-small icon-smaller round light box-shadow relative',
    click() {
      clearAndRemoveInteraction();
      envelopeButton.setState('initial');
      const offlineLayers = viewer.getLayers().filter(layer => layer.getProperties().type === 'WMSOFFLINE');
      const responses = [];
      offlineLayers.forEach(layer => {
        responses.push(layer.getProperties().source.clearStorage());
      });
      Promise.all(responses).then((result) => {
        console.log('Cleared cache for layers:', result);
        viewer.getLogger().createToast({
          status: 'success',
          title: 'Lager rensat',
          message: 'Dina lager är rensade.'
        });
      });
    },
    icon: '#ic_delete_24px',
    tooltipText: 'Rensa cache',
    tooltipPlacement: 'south',
    tooltipStyle: 'bottom:-5px;'
  });

  toolbarButtons.push(clearButton);

  const downloadButton = Button({
    cls: 'padding-small icon-smaller round light box-shadow relative',
    async click() {
      const offlineLayers = viewer.getLayers().filter(layer => layer.getProperties().type === 'WMSOFFLINE');
      const offlineSizes = await getOfflineCalculations(offlineLayers);

      const lagerElements = offlineSizes.map(lager => {
        console.log();
        const percent = layersInProgress.includes(lager.name) ? '0%' : '100%';
        return Element({
          style: 'display: flex; gap: 4px;',
          components: [
            Element({ tagName: 'span', innerHTML: `Lager: ${lager.name}: ${lager.size} (${lager.tiles} tiles)` }),
            Element({
              style: 'display: flex; gap: 2px;',
              components: [
                Element({ cls: `${lager.name}-progress`, tagName: 'span', innerHTML: 'Progress:' }),
                Element({ cls: `${lager.name}-progress-percent`, tagName: 'span', innerHTML: percent })
              ] })
          ]
        });
      });

      const modalContent = Element({
        style: 'display: flex; flex-direction: column; gap: 4px;',
        components: [
          Element({ tagName: 'span', innerHTML: 'Dina sparade lager.' }),
          Element({
            style: 'display: flex; flex-direction: column; gap: 4px;',
            components: [
              Element({ style: 'padding-top: 8px; padding-bottom: 8px;', components: lagerElements })
              // Element({ tagName: 'hr' })
            ]
          })
        ]
      });

      modal = Modal({
        title: 'Spara ner kartlager',
        contentCmp: modalContent,
        cls: 'o-offline-modal',
        target: viewer.getId(),
        style: ''
      });

      envelopeButton.setState('active');
    },
    icon: '#ic_crop_square_24px',
    tooltipText: 'Visa sparade lager',
    tooltipPlacement: 'south',
    tooltipStyle: 'bottom:-5px;'
  });

  toolbarButtons.push(downloadButton);

  // Create options object for the toolbar with buttons.
  if (toolbarButtons.length) {
    toolbarButtons = toolbarButtons.flatMap((button, index) => {
      // Add a separator unless it's the last button.
      if (index < toolbarButtons.length - 1) {
        return [button, Element({ cls: 'padding-smaller', tagName: 'div' })];
      }
      return [button];
    });
  }

  // Create the offline toolbar.
  const toolbarElement = Element({
    cls: 'flex fixed bottom-center divider-horizontal bg-inverted z-index-ontop-high no-print',
    // style: 'height: 2rem;',
    components: toolbarButtons
  });

  // Wrap the toolbar element in a wrapper element.
  const toolbar = Element({
    cls: 'o-go-offline-toolbar o-toolbar o-toolbar-horizontal o-padding-horizontal-8 o-rounded-top o-hidden',
    tagName: 'div',
    components: [toolbarElement]
  });

  // Create an offline button to toggle offline interaction.

  // Create a vector source for drawn features.
  const source = new VectorSource();

  // Create a vector layer to display drawn features.
  const vector = new VectorLayer({
    group: 'none',
    name: 'offline',
    title: 'Offline',
    source,
    zIndex: 8,
    styleName: 'origoStylefunction'
    // style(feature) {
    //   return styleFunction(feature);
    // }
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
    // Configure draw options including the source and styling function.
    const drawOptions = {
      source,
      //   style(feature) {
      //     // Use the specified style function to style the drawn feature.
      //     return styleFunction(feature);
      //   },
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

        // Calculate the total size of the layers to be saved.
        // Get each offline layer and calculate the estimate for the extent.
        const offlineLayers = viewer.getLayers().filter(layer => layer.getProperties().type === 'WMSOFFLINE');
        const extent = evt.feature.getGeometry().getExtent();

        const offlineSize = await getOfflineCalculations(offlineLayers, [{ extentid: extent }]);

        const modalCloseButton = Button({
          cls: 'o-offline-modal-btn-close icon-smaller',
          text: 'Stäng',
          icon: '#ic_close_24px',
          click() {
            modal.closeModal();
            modal.dispatch('closed');
            clearAndRemoveInteraction();
          }
        });
        const modalSaveButton = Button({
          cls: 'o-offline modal btn-save icon-smaller',
          text: 'Spara',
          icon: '#ic_save_24px',
          click() {
            // Store the extends
            const responses = [];

            offlineLayers.forEach(offlineLayer => {
              layersInProgress.push(offlineLayer.getProperties().name);
              let tilesDownloaded = 0;
              const numberOfTilesToDownload = offlineSize.find(lager => lager.name === offlineLayer.getProperties().name).tiles;
              // THis needs to emit an event that the download modal listens to and can update the progress
              const progressCallback = () => {
                tilesDownloaded += 1;
                const percentElement = document.querySelector(`.${offlineLayer.getProperties().name}-progress-percent`);
                // Check if the modal is open before we try and update the progress
                if (percentElement) {
                  percentElement.innerHTML = `${Math.round((tilesDownloaded / numberOfTilesToDownload) * 100)}%`;
                }
              };
              responses.push(offlineLayer.getProperties().source.preload(extent, progressCallback));
            });

            modal.closeModal();
            modal.dispatch('closed');
            viewer.getLogger().createToast({
              status: 'info',
              title: 'Nedladdning pågår',
              message: 'Dina lager sparas ner i bakgrunden.'
            });

            Promise.all(responses).then((result) => {
              console.log('All tiles saved', result);
              // Remove the layer from the in progress list
              layersInProgress = [];
              viewer.getLogger().createToast({
                status: 'success',
                title: 'Lager sparat',
                message: 'Dina lager är redo att användas offline.'
              });
            });
          }
        });

        const actionButtons = Element({
          style: 'display: flex; flex-gap: 2px; justify-content: end;',
          components: [modalCloseButton, modalSaveButton]
        });

        const lagerElements = offlineSize.map(lager => Element({
          tagName: 'span', innerHTML: `Lager: ${lager.name}: ${lager.size} (${lager.tiles} tiles)`
        }));

        const modalContent = Element({
          style: 'display: flex; flex-direction: column; gap: 4px;',
          components: [
            Element({ tagName: 'span', innerHTML: 'Följande data kommer att sparas ner för att användas online.' }),
            Element({
              style: 'display: flex; flex-direction: column; gap: 4px;',
              components: [
                Element({ style: 'padding-top: 8px; padding-bottom: 8px;', components: lagerElements }),
                Element({ tagName: 'hr' }),
                actionButtons
              ]
            })
          ]
        });

        modal = Modal({
          title: 'Spara ner kartlager',
          contentCmp: modalContent,
          cls: 'o-offline-modal',
          target: viewer.getId(),
          style: ''
        });

        modal.on('closed', () => {
          clearAndRemoveInteraction();
        });
      }
    );

    // Add the draw interaction to the map.
    map.addInteraction(envelope);
  }

  async function getOfflineCalculations(offlineLayers, extents) {
    const results = await Promise.all(offlineLayers.map(async layer => {
      const extentsForLayer = extents ?? await layer.getProperties().source.fetchExtentsFromDb();
      let totalTiles = 0;
      let totalBytes = 0;

      extentsForLayer.forEach(extent => {
        const { numberOfTiles, estimateBytes } = layer.getProperties().source.calculateEstimateForExtent(extent.extentid);
        totalTiles += numberOfTiles;
        totalBytes += estimateBytes;
      });

      let size;
      if (totalBytes >= 1e9) {
        size = `${(totalBytes / 1e9).toFixed(2)} GB`;
      } else if (totalBytes >= 1e6) {
        size = `${(totalBytes / 1e6).toFixed(2)} MB`;
      } else {
        size = `${(totalBytes / 1e3).toFixed(2)} KB`;
      }

      return {
        name: layer.getProperties().name,
        size,
        tiles: totalTiles
      };
    }));

    return results;
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
    onInit() { },

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
