import Select from 'ol/interaction/Select';
import Feature from 'ol/Feature';

import dispatcher from './editdispatcher';

// Point of entry. Create on of these each time the tool is selected
//  viewer: the viewer
//  editLayer: the destination layer for edits
//  options: the current drawTools configuration for this layer
const copyTool = function copyTool(viewer, options) {
  const map = viewer.getMap();
  let selectLayers = [];
  let hasGoups = false;

  // Add configured layers
  if (options.layers && options.layers.length > 0) {
    selectLayers = options.layers.map((layerName) => viewer.getLayer(layerName));
  }

  // Groups are mainly intended for drag-and-drop layers when we don't know the name of the layer at config time
  // But we can take a legend group and add all layers from the group.
  // TODO: make group lookup recursive?
  if (options.groups && options.groups.length > 0) {
    hasGoups = true;
    options.groups.forEach((groupName) => {
      const currLayers = viewer.getLayers().filter((layer) => layer.get('group') === groupName);
      if (currLayers && currLayers.length) {
        selectLayers.push(...currLayers);
      }
    });
  }

  // Abort if there are no eligible layers, otherwise user can not do anything anyway
  if (hasGoups && selectLayers.length === 0) {
    alert('Det finns inga lager att välja från');
    dispatcher.emitCustomDrawEnd();
    return;
  }

  const selectOptions = {};
  // Add all configured layers as the only possible to select.
  // If no layers are configured all layers are eligible
  if (selectLayers.length > 0) {
    selectOptions.layers = selectLayers;
  }

  // Set up the OL interaction that makes it possible to select a feature
  let select = new Select(selectOptions);
  map.addInteraction(select);

  // Helper that cleans up after us
  function cancelTool() {
    // Remove the interaction (and the handler goes as well)
    map.removeInteraction(select);
    select = null;
  }

  // Called when another menu is selected. Should clean up as we are no longer active
  function onToggleEdit() {
    cancelTool();
  }

  // Eventhandler called when OL has selected something.
  // To abort, the user has to click the menu as select event won't be fired unless a feature is clicked
  function onSelect(e) {
    // TODO: when multiple hits show dropdown
    //       Right now interaction is configured for single select, but using multiple could resolve overlapping features

    // The event is actually fired on deselect as well
    if (e.selected.length > 0) {
      const accept = window.confirm('Kopiera vald geometri? Avbryt för att välja en annan');
      if (accept) {
        const f = new Feature(e.selected[0].getGeometry().clone());

        cancelTool();
        // Important! Remove handler so it won't linger
        document.removeEventListener('toggleEdit', onToggleEdit, { once: true });
        dispatcher.emitCustomDrawEnd(f);
      }
    }
  }

  // Hook up some callbacks and just wait for user to select a feature
  select.on('select', onSelect);
  // Makes it possible to abort
  document.addEventListener('toggleEdit', onToggleEdit, { once: true });
};

export default copyTool;
