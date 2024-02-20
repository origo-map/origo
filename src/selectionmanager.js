import Collection from 'ol/Collection';
import { getArea, getLength } from 'ol/sphere';
import { Component } from './ui';
import featurelayer from './featurelayer';
import infowindowManagerV1 from './infowindow';
import infowindowManagerV2 from './infowindow_expandableList';
import Style from './style';
import StyleTypes from './style/styletypes';
import formatAreaString from './utils/formatareastring';
import formatLengthString from './utils/formatlengthstring';

const styleTypes = StyleTypes();

const Selectionmanager = function Selectionmanager(options = {}) {
  const {
    toggleSelectOnClick = false
  } = options;

  let aggregations = [];
  if (options.infowindowOptions && options.infowindowOptions.groupAggregations) {
    aggregations = options.infowindowOptions.groupAggregations;
  }
  let viewer;
  let selectedItems;
  let urval;
  let map;
  let infowindow;
  /** The selectionmanager component itself */
  let component;

  /** Keeps track of highlighted features. Stores pointers to the actual features. */
  let highlightedFeatures = [];

  const multiselectStyleOptions = options.multiSelectionStyles || styleTypes.getStyle('multiselection');
  const isInfowindow = options.infowindow === 'infowindow' || false;
  const infowindowManager = options.infowindowOptions && options.infowindowOptions.listLayout ? infowindowManagerV2 : infowindowManagerV1;

  function alreadyExists(item) {
    return selectedItems.getArray().some((i) => item.getId() === i.getId() && item.selectionGroup === i.selectionGroup);
  }

  function getSelectedItemsForASelectionGroup(selectionGroup) {
    const items = selectedItems.getArray().filter((i) => i.getSelectionGroup() === selectionGroup);
    return items;
  }

  function removeItem(item) {
    selectedItems.remove(item);
  }

  function removeItems(items) {
    const itemsToBeRemoved = [];
    items.forEach((item) => {
      selectedItems.forEach((si) => {
        if (item.getId() === si.getId()) {
          itemsToBeRemoved.push(si);
        }
      });
    });
    itemsToBeRemoved.forEach((item) => selectedItems.remove(item));
  }

  function removeItemById(id) {
    selectedItems.forEach((item) => {
      if (item.getId() === id) {
        selectedItems.remove(item);
      }
    });
  }

  function addItem(item) {
    if (alreadyExists(item)) {
      if (toggleSelectOnClick) {
        removeItems([item]);
      }
      return;
    }
    selectedItems.push(item);
    if (getSelectedItemsForASelectionGroup(item.getSelectionGroup()).length === selectedItems.getArray().length) {
      infowindow.showSelectedList(item.getSelectionGroup());
    }
  }

  function addItems(items) {
    items.forEach((item) => {
      addItem(item);
    });
  }

  /** Helper that refreshes all urvallayers. Typically called after highlightning or symbology has changed */
  function refreshAllLayers() {
    urval.forEach((value) => {
      value.getFeatureStore().changed();
    });
  }

  /**
   * Clears highlighted features
   */
  function clearHighlightedFeatures() {
    highlightedFeatures = [];
  }

  /**
   * Highlights the feature with fid id.
   * All other items are un-highlighted
   * Emits event 'highlight' with highlighted SelectedItem
   * @param {any} id
   */
  function highlightFeatureById(id) {
    selectedItems.forEach((item) => {
      const feature = item.getFeature();
      if (item.getId() === id) {
        highlightedFeatures = [feature];
        component.dispatch('highlight', item);
      }
    });

    // We need to manually refresh all layers, otherwise selecting and unselecting does not take effect until the next layer refresh.
    refreshAllLayers();
  }

  function highlightAndExpandItem(item) {
    const featureId = item.getId();
    highlightFeatureById(featureId);
    infowindow.showSelectedList(item.getSelectionGroup());
    infowindow.expandListElement(featureId);
    infowindow.highlightListElement(featureId);
  }

  // FIXME: does almost exactly the same as highlightAndExpandItem
  function highlightItem(item) {
    const featureId = item.getId();
    highlightFeatureById(featureId);
    infowindow.showSelectedList(item.getSelectionGroup());
    infowindow.expandListElement(featureId);
    infowindow.highlightListElement(featureId);
    infowindow.scrollListElementToView(featureId);
  }

  function addOrHighlightItem(item) {
    if (alreadyExists(item)) {
      if (toggleSelectOnClick) {
        removeItems([item]);
      } else {
        // highlight
        highlightItem(item);
      }
    } else {
      // add
      selectedItems.push(item);
      if (selectedItems.getLength() === 1) {
        highlightAndExpandItem(item);
      }
    }
  }

  function getSelectedItems() {
    return selectedItems;
  }

  function clearSelection() {
    // This will trigger onItemremove for each feature and refresh layers etc
    selectedItems.clear();
    component.dispatch('cleared', null);
  }

  /**
   * Returns a style function to be used when a feature is drawn.
   * @param {any} selectionGroup
   */
  function getFeatureStyler(selectionGroup) {
    function featureStyler(feature) {
      if (highlightedFeatures.includes(feature)) {
        return Style.createStyleRule(multiselectStyleOptions.highlighted);
      } else if (selectionGroup === infowindow.getActiveSelectionGroup()) {
        return Style.createStyleRule(multiselectStyleOptions.inActiveLayer ? multiselectStyleOptions.inActiveLayer : multiselectStyleOptions.selected);
      }
      return Style.createStyleRule(multiselectStyleOptions.selected);
    }
    return featureStyler;
  }

  function createSelectionGroup(selectionGroup, selectionGroupTitle) {
    const urvalLayer = featurelayer(null, map);
    urvalLayer.setStyle(getFeatureStyler(selectionGroup));
    urval.set(selectionGroup, urvalLayer);
    infowindow.createUrvalElement(selectionGroup, selectionGroupTitle);
  }

  /**
   * Calculates all configured aggregations for one selectionGroup
   * @param {any} selectionGroup
   */
  function calculateGroupAggregations(selectionGroup) {
    const retval = [];
    // function pointer to a function that takes an array as argumnet
    let aggregationFn;

    aggregations.forEach(currAggregation => {
      const {
        useHectare = true
      } = currAggregation;
      let helperName;
      if (!currAggregation.layer || currAggregation.layer === selectionGroup) {
        let valFound = false;
        // Suck out the attribute to aggregate.
        const values = urval.get(selectionGroup).getFeatures().map(currFeature => {
          let val = 0;
          if (currAggregation.attribute.startsWith('@')) {
            helperName = currAggregation.attribute.substring(1);
            const geometry = currFeature.getGeometry();
            const geomType = geometry.getType();
            const proj = viewer.getProjection();
            if (helperName === 'area') {
              if (geomType === 'Polygon' || geomType === 'MultiPolygon') {
                val = getArea(geometry, { projection: proj });
                valFound = true;
              }
            } else if (helperName === 'length') {
              if (geomType === 'LineString' || geomType === 'LinearRing' || geomType === 'MultiLineString') {
                val = getLength(geometry, { projection: proj });
                valFound = true;
              }
            } else {
              console.error(`Unsupported geometry operation: ${helperName}`);
            }
          } else {
            val = currFeature.get(currAggregation.attribute);
            if (val !== undefined) {
              valFound = true;
            }
          }
          return val;
        });

        // Only add the aggregation if this layer has the attribute (or function)
        if (valFound) {
          switch (currAggregation.function) {
            case 'sum':
              // Define the "sum" aggregation.
              // To be honest, we could have just performed the aggregation here
              // but it is cool to use function pointers.
              // javascript does not provide a sum function. Define our own.
              aggregationFn = (arr) => arr.reduce((a, b) => (Number(a) || 0) + (Number(b) || 0), 0);
              break;
            default:
              console.error(`Unsupported aggregation function: ${currAggregation.function}`);
              return; // Return from labmda. Skips this aggregation
          }

          let result = aggregationFn(values);
          const decimals = currAggregation.decimals !== undefined ? currAggregation.decimals : 2;

          // Correct result depending on type
          let resultstring;
          if (helperName === 'area' && !currAggregation.unit) {
            resultstring = formatAreaString(result, { useHectare, decimals });
          } else if (helperName === 'length' && !currAggregation.unit) {
            resultstring = formatLengthString(result, { decimals });
          } else {
            if (currAggregation.scalefactor) {
              result *= currAggregation.scalefactor;
            }
            resultstring = result.toFixed(decimals);
            if (currAggregation.unit) {
              resultstring = `${resultstring} ${currAggregation.unit}`;
            }
          }

          const prefix = currAggregation.label || `${currAggregation.function}(${currAggregation.attribute}):`;
          const line = `${prefix} ${resultstring}`;
          retval.push(line);
        }
      }
    });

    // Return all aggregations in one multiline string
    return retval.join('<br>');
  }

  /**
   * Callback function called when a SelectedItem is added to selectedItems
   * @param {any} event
   */
  function onItemAdded(event) {
    const item = event.element;

    const selectionGroup = event.element.getSelectionGroup();
    const selectionGroupTitle = event.element.getSelectionGroupTitle();

    if (!urval.has(selectionGroup)) {
      createSelectionGroup(selectionGroup, selectionGroupTitle);
    }

    urval.get(selectionGroup).addFeature(item.getFeature());
    infowindow.createListElement(item);

    if (isInfowindow) {
      infowindow.show();
    }

    const sum = urval.get(selectionGroup).getFeatures().length;
    infowindow.updateUrvalElementText(selectionGroup, selectionGroupTitle, sum);
    const aggregationstring = calculateGroupAggregations(selectionGroup);
    infowindow.updateSelectionGroupFooter(selectionGroup, aggregationstring);
  }

  /**
   * Callback function called when a SelectedItem is removed from selectedItems
   * @param {any} event
   */
  function onItemRemoved(event) {
    const item = event.element;

    const selectionGroup = event.element.getSelectionGroup();
    const selectionGroupTitle = event.element.getSelectionGroupTitle();

    const feature = item.getFeature();
    // Remove from highlighted as feature does not exist in the layer anymore
    highlightedFeatures = highlightedFeatures.filter(f => f !== feature);

    urval.get(selectionGroup).removeFeature(feature);
    infowindow.removeListElement(item);

    const sum = urval.get(selectionGroup).getFeatures().length;
    infowindow.updateUrvalElementText(selectionGroup, selectionGroupTitle, sum);
    const aggregationstring = calculateGroupAggregations(selectionGroup);
    infowindow.updateSelectionGroupFooter(selectionGroup, aggregationstring);

    if (urval.get(selectionGroup).getFeatures().length < 1) {
      infowindow.hideUrvalElement(selectionGroup);
    }

    if (selectedItems.getLength() < 1) {
      infowindow.hide();
    }
  }

  /**
   * Highlights a feature. All other highlights remain and list is not affected.
   * @param {any} feature The feature to highlight
   */
  function highlightFeature(feature) {
    highlightedFeatures.push(feature);
    refreshAllLayers();
  }

  function getNumberOfSelectedItems() {
    return selectedItems.getLength();
  }

  function getUrval() {
    return urval;
  }

  return Component({
    name: 'selectionmanager',
    addItems,
    removeItem,
    removeItems,
    addOrHighlightItem,
    removeItemById,
    clearSelection,
    clearHighlightedFeatures,
    createSelectionGroup,
    highlightFeature,
    highlightFeatureById,
    getNumberOfSelectedItems,
    getSelectedItems,
    getSelectedItemsForASelectionGroup,
    getUrval,
    refreshAllLayers,
    onInit() {
      selectedItems = new Collection([], { unique: true });
      urval = new Map();
      selectedItems.on('add', onItemAdded);
      selectedItems.on('remove', onItemRemoved);
    },
    onAdd(e) {
      // Keep a reference to "ourselves"
      component = this;
      viewer = e.target;
      map = viewer.getMap();
      infowindow = infowindowManager.init(options);
    }
  });
};

export default Selectionmanager;
