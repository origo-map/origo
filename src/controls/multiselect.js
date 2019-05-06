import { getArea, getLength } from 'ol/sphere';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import { Component, Element as El, Button, dom, Modal } from '../ui';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import DrawInteraction, { createBox } from 'ol/interaction/Draw';
import PointerInteraction from 'ol/interaction/Pointer';
import Overlay from 'ol/Overlay';
import { fromExtent, fromCircle } from 'ol/geom/Polygon';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style.js';
import wfs from './offline/wfs';
import getFeatureInfo from '../getfeatureinfo';
import GeoJSON from 'ol/format/GeoJSON';
import disjoint from '@turf/boolean-disjoint';
import buffer from '@turf/buffer';
// import modal from '../modal';
import GeometryType from 'ol/geom/GeometryType';
// import selectionManager from '../selectionmanager';
import SelectedItem from '../models/SelectedItem';
import Feature from 'ol/Feature';
import featurelayer from '../featurelayer';

const Multiselect = function Multiselect(options = {}) {

  let selectSource;
  let isActive = false;
  let clickInteraction;
  let boxInteraction;
  let circleInteraction;
  let bufferInteraction;
  let sketch;
  let radius;
  let radiusXPosition;
  let radiusYPosition;
  let radiusLengthTooltip;
  let radiusLengthTooltipElement;
  let bufferFeature;
  let debugLayer;
  let map;
  let activeButton;
  let defaultButton;
  let type;
  let helpTooltip;
  let helpTooltipElement;
  let vector;
  let source;
  let label;
  const overlayArray = [];
  let viewer;
  let multiselectButton;
  let clickSelectionButton;
  let boxSelectionButton;
  let circleSelectionButton;
  let bufferSelectionButton;
  let target;
  let multiselectElement;
  let selectionManager;
  const buttons = [];
  const clusterFeatureinfoLevel = 1;
  const hitTolerance = 0;

  let tools = options.hasOwnProperty('tools') ? options.tools : ['click', 'box', 'circle', 'buffer'];
  let defaultTool = options.hasOwnProperty('default') ? options.default : 'click';
  let clickSelection = tools.find(i => i === 'click') ? true : false;
  let boxSelection = tools.find(i => i === 'box') ? true : false;
  let circleSelection = tools.find(i => i === 'circle') ? true : false;
  let bufferSelection = tools.find(i => i === 'buffer') ? true : false;

  function setActive(state) {
    isActive = state;
  }

  function toggleMultiselection() {
    if (isActive) {
      document.dispatchEvent(new CustomEvent('toggleInteraction', {
        bubbles: true,
        detail: 'featureInfo'
      }));
      disableInteraction();
    } else {
      document.dispatchEvent(new CustomEvent('toggleInteraction', {
        bubbles: true,
        detail: 'multiselection'
      }));
      enableInteraction();
    }
  }

  function enableInteraction() {
    document.getElementById(multiselectButton.getId()).classList.add('active');
    if (clickSelection) {
      document.getElementById(clickSelectionButton.getId()).classList.remove('hidden');
    }
    if (boxSelection) {
      document.getElementById(boxSelectionButton.getId()).classList.remove('hidden');
    }
    if (circleSelection) {
      document.getElementById(circleSelectionButton.getId()).classList.remove('hidden');
    }
    if (bufferSelection) {
      document.getElementById(bufferSelectionButton.getId()).classList.remove('hidden');
    }
    document.getElementById(multiselectButton.getId()).classList.remove('tooltip');
    setActive(true);
    addInteractions();
    document.getElementById(defaultButton.getId()).click();
    // if features are added to selection managaer from featureinfo, this will clear that selection when activating multiselect.
    // selectionManager.clearSelection();
  }

  function disableInteraction() {
    if (activeButton) {
      document.getElementById(activeButton.getId()).classList.remove('active');
    }
    document.getElementById(multiselectButton.getId()).classList.remove('active');
    if (clickSelection) {
      document.getElementById(clickSelectionButton.getId()).classList.add('hidden');
    }
    if (boxSelection) {
      document.getElementById(boxSelectionButton.getId()).classList.add('hidden');
    }
    if (circleSelection) {
      document.getElementById(circleSelectionButton.getId()).classList.add('hidden');
    }
    if (bufferSelection) {
      document.getElementById(bufferSelectionButton.getId()).classList.add('hidden');
    }
    document.getElementById(multiselectButton.getId()).classList.add('tooltip');

    removeInteractions();
    removeRadiusLengthTooltip();
    debugLayer.clear();
    selectionManager.clearSelection();
    setActive(false);
  }

  function addInteractions() {

    clickInteraction = new PointerInteraction({
      handleEvent: fetchFeatures_Click
    });

    boxInteraction = new DrawInteraction({
      source: selectSource,
      type: 'Circle',
      geometryFunction: createBox()
    });

    circleInteraction = new DrawInteraction({
      source: selectSource,
      type: 'Circle'
    });

    bufferInteraction = new PointerInteraction({
      handleEvent: fetchFeatures_Buffer_click
    });

    map.addInteraction(clickInteraction);
    map.addInteraction(boxInteraction);
    map.addInteraction(circleInteraction);
    map.addInteraction(bufferInteraction);

    boxInteraction.on('drawend', fetchFeatures_Box);
    circleInteraction.on('drawstart', (evt) => {
      sketch = evt.feature.getGeometry();
      createRadiusLengthTooltip();
    });
    circleInteraction.on('drawend', fetchFeatures_Circle);
  }

  function toggleType(button) {
    if (activeButton) {
      document.getElementById(activeButton.getId()).classList.remove('active');
    }

    document.getElementById(button.getId()).classList.add('active');
    activeButton = button;

    if (type === 'click') {
      clickInteraction.setActive(true);
      boxInteraction.setActive(false);
      circleInteraction.setActive(false);
      bufferInteraction.setActive(false);
      map.un('pointermove', pointerMoveHandler);

    } else if (type === 'box') {
      clickInteraction.setActive(false);
      boxInteraction.setActive(true);
      circleInteraction.setActive(false);
      bufferInteraction.setActive(false);
      map.un('pointermove', pointerMoveHandler);

    } else if (type === 'circle') {
      clickInteraction.setActive(false);
      boxInteraction.setActive(false);
      circleInteraction.setActive(true);
      bufferInteraction.setActive(false);
      map.on('pointermove', pointerMoveHandler);

    } else if (type === 'buffer') {
      clickInteraction.setActive(false);
      boxInteraction.setActive(false);
      circleInteraction.setActive(false);
      bufferInteraction.setActive(true);
      map.un('pointermove', pointerMoveHandler);
    }

  }

  function removeInteractions() {
    map.removeInteraction(clickInteraction);
    map.removeInteraction(boxInteraction);
    map.removeInteraction(circleInteraction);
    map.removeInteraction(bufferInteraction);
  }

  function fetchFeatures_Click(evt) {

    //const point = evt.feature.getGeometry().getCoordinates();
    if (evt.type === 'singleclick') {
      const isCtrlKeyPressed = evt.originalEvent.ctrlKey;
      // Featurinfo in two steps. Concat serverside and clientside when serverside is finished      
      const pixel = evt.pixel;
      const coordinate = evt.coordinate;
      const layers = viewer.getQueryableLayers();
      const clientResult = getFeatureInfo.getFeaturesAtPixel({
        coordinate,
        map,
        pixel,
        clusterFeatureinfoLevel,
        hitTolerance
      }, viewer);
      // Abort if clientResult is false
      if (clientResult !== false) {
        getFeatureInfo.getFeaturesFromRemote({
          coordinate,
          layers,
          map,
          pixel
        }, viewer)
          .done((data) => {
            const serverResult = data || [];
            const result = serverResult.concat(clientResult);
            if (isCtrlKeyPressed) {
              if (result.length > 0) {
                selectionManager.removeItems(result);
              }
            } else {
              if (result.length === 1) {
                selectionManager.addOrHighlightItem(result[0]);
              } else if (result.length > 1) {
                selectionManager.addItems(result);
              }
            }
          });
      }
      return false;
    }
    return true;
  }

  function fetchFeatures_Box(evt) {
    const extent = evt.feature.getGeometry().getExtent();
    const layers = viewer.getQueryableLayers();

    if (layers.length < 1) {
      return;
    }

    let allItems = [];
    const results = getItemsIntersectingExtent(layers, extent);
    // adding clint features
    allItems = allItems.concat(results.selectedClientItems);

    // adding features got from wfs GetFeature
    Promise.all(results.selectedRemoteItemsPromises).then(data => {
      // data is an array containing corresponding array of features for each layer.
      data.forEach(items => allItems = allItems.concat(items));

      if (allItems.length === 1) {
        selectionManager.addOrHighlightItem(allItems[0]);
      } else if (allItems.length > 1) {
        selectionManager.addItems(allItems);
      }
    }).catch(err => console.error(err));
  }

  function fetchFeatures_Circle(evt) {

    // Things needed to be done on 'drawend'
    // ==>
    sketch = null;
    removeRadiusLengthTooltip();
    // <==

    const circle = evt.feature.getGeometry();
    // const center = circle.getCenter();
    // const radius = circle.getRadius();
    const extent = circle.getExtent();
    const layers = viewer.getQueryableLayers();

    let allItems = [];
    const results = getItemsIntersectingExtent(layers, extent);

    // adding clint features
    allItems = allItems.concat(getItemsIntersectingGeometry(results.selectedClientItems, circle));

    // adding features got from wfs GetFeature
    Promise.all(results.selectedRemoteItemsPromises).then(data => {
      // data is an array containing corresponding arrays of features for each layer.
      data.forEach(items => allItems = allItems.concat(getItemsIntersectingGeometry(items, circle)));

      if (allItems.length === 1) {
        selectionManager.addOrHighlightItem(allItems[0]);
      } else if (allItems.length > 1) {
        selectionManager.addItems(allItems);
      }
    });

    //Uncomment this to draw the extent on the map for debugging porposes
    // const f = new Feature(fromExtent(extent));
    // debugLayer.addFeature(f);
  }

  function fetchFeatures_Buffer_click(evt) {

    if (evt.type === 'singleclick') {

      // Featurinfo in two steps. Concat serverside and clientside when serverside is finished
      const pixel = evt.pixel;
      const coordinate = evt.coordinate;
      const layers = viewer.getQueryableLayers();
      const clientResult = getFeatureInfo.getFeaturesAtPixel({
        coordinate,
        map,
        pixel,
        clusterFeatureinfoLevel,
        hitTolerance
      }, viewer);
      // Abort if clientResult is false
      if (clientResult !== false) {
        getFeatureInfo.getFeaturesFromRemote({
          coordinate,
          layers,
          map,
          pixel
        }, viewer)
          .done((data) => {
            const serverResult = data || [];
            const result = serverResult.concat(clientResult);
            if (result.length > 0) {
              let promise;
              if (result.length === 1) {
                bufferFeature = result[0].getFeature().clone();
                promise = Promise.resolve();
              } else if (result.length > 1) {
                promise = createFeatureSelectionModal(result);
              }
              promise.then(() => createRadiusModal());
            }
          });
      }
      return false;
    }
    return true;
  }

  function createFeatureSelectionModal(items) {
    // extracting features
    const features = items.map(item => item.getFeature());
    const featuresList = items.map(item => {
      const layerAttributes = item.getLayer().get('attributes');
      const bufferAttribute = layerAttributes ? layerAttributes[0].name ? layerAttributes[0].name : undefined : undefined;
      const feature = item.getFeature();
      const title = feature.get(bufferAttribute) || feature.get('namn') || feature.getId();
      return `<div class="featureSelectorItem" id="${feature.getId()}"> ${title} </div>`;
    });

    return new Promise((resolve, reject) => {
      const title = 'Du har valt flera objekt:';
      const content = `<div id="featureSelector"> 
                        ${featuresList.join('')}
                      </div>`;
      const target = viewer.getId();
      const modal = Modal({
        title,
        content,
        target
      });
      const featureSelectors = document.getElementsByClassName('featureSelectorItem');

      for (let index = 0; index < featureSelectors.length; index++) {
        const f = featureSelectors[index];
        f.addEventListener('click', (e) => {
          bufferFeature = features.find(f => f.getId().toString() === e.target.id).clone();
          console.log(bufferFeature);
          modal.closeModal();
          resolve();
          e.stopPropagation();
        });
      }
    });
  }

  function createRadiusModal() {
    const title = 'Ange buffert i meter (ex 10,4):';
    const content = `<div> 
                      <input type="number" id="bufferradius">
                      <button id="bufferradiusBtn">OK</button>
                    </div>`;
    const target = viewer.getId();
    const modal = Modal({
      title,
      content,
      target
    });
    const bufferradiusEl = document.getElementById('bufferradius');
    const bufferradiusBtn = document.getElementById('bufferradiusBtn');
    bufferradiusBtn.addEventListener('click', (e) => {
      const radiusVal = bufferradiusEl.value;
      // entered value should only be a number
      // const pattern = /^[0-9]*$/;
      // const onlyNumbers = pattern.test(radiusVal);
      // console.log(onlyNumbers);
      const radius = parseFloat(radiusVal);
      if ((!radius && radius !== 0) ||
        (radius <= 0 && (bufferFeature.getGeometry().getType() === GeometryType.POINT ||
          bufferFeature.getGeometry().getType() === GeometryType.MULTI_POINT ||
          bufferFeature.getGeometry().getType() === GeometryType.MULTI_LINE_STRING ||
          bufferFeature.getGeometry().getType() === GeometryType.LINE_STRING))) {
        bufferradiusEl.classList.add('unvalidValue')
        e.stopPropagation();
        return;
      }
      e.stopPropagation();
      modal.closeModal();
      // TODO: validating radius(only number, min, max)
      fetchFeatures_Buffer_buffer(radius);
    });
  }

  function fetchFeatures_Buffer_buffer(radius) {
    const geometry = bufferFeature.getGeometry();
    const bufferedFeature = createBufferedFeature(geometry, radius);
    const bufferedGeometry = bufferedFeature.getGeometry();
    const extent = bufferedGeometry.getExtent();
    const layers = viewer.getQueryableLayers();

    // Uncomment this to draw the extent of the buffer on the map for debugging porposes
    // const f = new Feature(fromExtent(extent));
    // debugLayer.addFeature(f);

    let allItems = [];
    const results = getItemsIntersectingExtent(layers, extent);

    // adding clint features
    allItems = allItems.concat(getItemsIntersectingGeometry(results.selectedClientItems, bufferedGeometry));

    // adding features got from wfs GetFeature
    Promise.all(results.selectedRemoteItemsPromises).then(data => {
      // data is an array containing corresponding arrays of features for each layer.
      data.forEach(items => allItems = allItems.concat(getItemsIntersectingGeometry(items, bufferedGeometry)));

      if (allItems.length === 1) {
        selectionManager.addOrHighlightItem(allItems[0]);
      } else if (allItems.length > 1) {
        selectionManager.addItems(allItems);
      }
    });
  }

  // General function that recieves a geometry and a radius and returns a buffered feature
  function createBufferedFeature(geometry, radius) {

    const format = new GeoJSON();
    const projection = map.getView().getProjection();

    let turfGeometry;

    if (geometry.getType() === 'Circle') {
      // circle is not a standard geometry. we need to create a polygon first.
      const polygon = fromCircle(geometry);
      polygon.transform(projection, 'EPSG:4326');
      turfGeometry = format.writeGeometryObject(polygon);
    } else {
      geometry.transform(projection, 'EPSG:4326');
      turfGeometry = format.writeGeometryObject(geometry);
    }

    // OBS! buffer always return a feature
    const bufferedTurfFeature = buffer(turfGeometry, radius / 1000, { units: 'kilometers' });
    const bufferedOLFeature = format.readFeature(bufferedTurfFeature);
    bufferedOLFeature.getGeometry().transform('EPSG:4326', projection);

    // Uncomment this to draw the geometry for debugging puposes.
    const f = bufferedOLFeature.clone();
    debugLayer.addFeature(f);

    return bufferedOLFeature;
  }

  // General function that recieves an extent and some layers and returns all features in those layers that intersect the extent.
  function getItemsIntersectingExtent(layers, extent) {

    const selectedClientItems = [];
    const selectedRemoteItemsPromises = [];

    function extractResultsForALayer(layer, groupLayer) {

      let selectionGroup;
      let selectionGroupTitle;

      if (groupLayer) {
        selectionGroup = groupLayer.get('name');
        selectionGroupTitle = groupLayer.get('title');
      } else {
        selectionGroup = layer.get('name');
        selectionGroupTitle = layer.get('title');
      }

      // check if layer supports this method, or basically is some sort of vector layer.
      // Alternatively we can check layer.getType() === 'VECTOR', but a bit unsure if all types of vector layer have 'VECTOR' as type.
      // Basically here we get all vector features from client.
      if (layer.getSource().forEachFeatureIntersectingExtent) {
        layer.getSource().forEachFeatureIntersectingExtent(extent, (feature) => {
          const item = new SelectedItem(feature, layer, map, selectionGroup, selectionGroupTitle);
          selectedClientItems.push(item);
        });
      } else {
        selectedRemoteItemsPromises.push(getFeaturesFromWfsServer(layer, extent, selectionGroup, selectionGroupTitle));
      }
    }

    layers.forEach(layer => {
      if (layer.get('type') === 'GROUP') {
        const subLayers = layer.getLayers();
        subLayers.forEach(subLayer => {
          if (subLayer.get('type') === 'GROUP') {
            console.log('LayersGroups deeper than one level are not handled!');
          } else {
            extractResultsForALayer(subLayer, layer);
          }
        });
      } else {
        extractResultsForALayer(layer);
      }
    });

    return {
      selectedClientItems: selectedClientItems,
      selectedRemoteItemsPromises: selectedRemoteItemsPromises
    };
  }

  // General function that recieves a list of features and a geometry, then removes all the features that lie outside of the geometry.
  // Do not confuse this function with getFeaturesIntersectingExtent!
  function getItemsIntersectingGeometry(items, geometry) {

    const format = new GeoJSON();
    const projection = map.getView().getProjection();
    let turfGeometry;

    if (geometry.getType() === 'Circle') {
      // circle is not a standard geometry. we need to create a polygon first.
      const polygon = fromCircle(geometry);
      polygon.transform(projection, 'EPSG:4326');
      turfGeometry = format.writeGeometryObject(polygon);
    } else {
      geometry.transform(projection, 'EPSG:4326');
      turfGeometry = format.writeGeometryObject(geometry);
    }

    const intersectingItems = [];
    items.forEach(item => {
      const feature = item.getFeature();
      feature.getGeometry().transform(projection, 'EPSG:4326');
      const turfFeature = format.writeFeatureObject(feature);
      const booleanDisjoint = disjoint(turfFeature, turfGeometry);

      if (!booleanDisjoint) {
        intersectingItems.push(item);
      }

      feature.getGeometry().transform('EPSG:4326', projection);
    });

    /*
    Uncomment this to draw the geometry for debugging puposes.
    const olFeature = format.readFeature(turfGeometry);
    olFeature.getGeometry().transform('EPSG:4326', projection);
    debugLayer.addFeature(olFeature);
    console.log(features.length);
    console.log(intersectingFeatures.length);
  */

    return intersectingItems;
  }

  function getFeaturesFromWfsServer(layer, extent, selectionGroup, selectionGroupTitle) {
    return new Promise(function (resolve, reject) {
      const req = wfs.request(layer, extent);
      req
        .then(data => {
          const selectedRemoteItems = data.map(feature => {
            return new SelectedItem(feature, layer, map, selectionGroup, selectionGroupTitle);
          });
          resolve(selectedRemoteItems);
        })
        .catch(err => console.error(err));
    });
  }

  function createRadiusLengthTooltip() {
    if (radiusLengthTooltipElement) {
      radiusLengthTooltipElement.parentNode.removeChild(radiusLengthTooltipElement);
    }

    radiusLengthTooltipElement = document.createElement('div');
    radiusLengthTooltipElement.className = 'o-tooltip o-tooltip-measure';

    radiusLengthTooltip = new Overlay({
      element: radiusLengthTooltipElement,
      offset: [0, 0],
      positioning: 'bottom-center',
      stopEvent: false
    });

    map.addOverlay(radiusLengthTooltip);
  }

  function removeRadiusLengthTooltip() {
    map.removeOverlay(radiusLengthTooltip);
    //  viewer.removeOverlays(overlayArray);
  }

  function pointerMoveHandler(e) {

    if (!sketch) return;

    radius = sketch.getRadius();
    radiusLengthTooltipElement.innerHTML = radius.toFixed() + ' m';
    radiusXPosition = (e.coordinate[0] + sketch.getCenter()[0]) / 2;
    radiusYPosition = (e.coordinate[1] + sketch.getCenter()[1]) / 2;
    radiusLengthTooltip.setPosition([radiusXPosition, radiusYPosition]);
  }

  function runpolyfill() {
    if (!Array.prototype.find) {
      Object.defineProperty(Array.prototype, 'find', {
        value: function (predicate) {
          // 1. Let O be ? ToObject(this value).
          if (this == null) {
            throw new TypeError('"this" is null or not defined');
          }

          var o = Object(this);

          // 2. Let len be ? ToLength(? Get(O, "length")).
          var len = o.length >>> 0;

          // 3. If IsCallable(predicate) is false, throw a TypeError exception.
          if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
          }

          // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
          var thisArg = arguments[1];

          // 5. Let k be 0.
          var k = 0;

          // 6. Repeat, while k < len
          while (k < len) {
            // a. Let Pk be ! ToString(k).
            // b. Let kValue be ? Get(O, Pk).
            // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
            // d. If testResult is true, return kValue.
            var kValue = o[k];
            if (predicate.call(thisArg, kValue, k, o)) {
              return kValue;
            }
            // e. Increase k by 1.
            k++;
          }

          // 7. Return undefined.
          return undefined;
        },
        configurable: true,
        writable: true
      });
    }
  }

  return Component({
    name: 'multiselection',
    onInit() {

      runpolyfill();

      if (clickSelection || boxSelection || circleSelection || bufferSelection) {
        multiselectElement = El({
          tagName: 'div',
          cls: 'flex column'
        });

        multiselectButton = Button({
          cls: 'o-multiselect padding-small margin-bottom-smaller icon-smaller rounded light box-shadow',
          click() {
            toggleMultiselection();
          },
          icon: '#baseline-select-all-24px',
          tooltipText: 'Markera i kartan',
          tooltipPlacement: 'west'
        });
        buttons.push(multiselectButton);

        if (clickSelection) {
          clickSelectionButton = Button({
            cls: 'o-multiselect-click padding-small margin-bottom-smaller icon-smaller rounded light box-shadow hidden',
            click() {
              type = 'click';
              toggleType(this);
            },
            icon: '#fa-mouse-pointer',
            tooltipText: 'Klick',
            tooltipPlacement: 'east'
          });
          buttons.push(clickSelectionButton);
          defaultButton = clickSelectionButton;
        }

        if (boxSelection) {
          boxSelectionButton = Button({
            cls: 'o-multiselect-box padding-small margin-bottom-smaller icon-smaller rounded light box-shadow hidden',
            click() {
              type = 'box';
              toggleType(this);
            },
            //icon: '#baseline-crop_square-24px',
            icon: '#fa-square-o',
            tooltipText: 'Box',
            tooltipPlacement: 'north'
          });
          buttons.push(boxSelectionButton);
        }

        if (circleSelection) {
          circleSelectionButton = Button({
            cls: 'o-multiselect-circle padding-small margin-bottom-smaller icon-smaller rounded light box-shadow hidden',
            click() {
              type = 'circle';
              toggleType(this);
            },
            icon: '#fa-circle-o',
            tooltipText: 'Circle',
            tooltipPlacement: 'north'
          });
          buttons.push(circleSelectionButton);
        }

        if (bufferSelection) {
          bufferSelectionButton = Button({
            cls: 'o-multiselect-buffer padding-small margin-bottom-smaller icon-smaller rounded light box-shadow hidden',
            click() {
              type = 'buffer';
              toggleType(this);
            },
            icon: '#fa-bullseye',
            tooltipText: 'Buffer',
            tooltipPlacement: 'north'
          });
          buttons.push(bufferSelectionButton);
        }

        if (defaultTool === 'click') {
          defaultButton = clickSelectionButton;
        } else if (defaultTool === 'box') {
          defaultButton = boxSelectionButton;
        } else if (defaultTool === 'circle') {
          defaultButton = circleSelectionButton;
        } else if (defaultTool === 'buffer') {
          defaultButton = bufferSelectionButton;
        }
      }
    },
    onAdd(evt) {
      viewer = evt.target;
      target = `${viewer.getMain().getMapTools().getId()}`;
      map = viewer.getMap();
      selectionManager = viewer.getSelectionManager();
      // source object to hold drawn features that mark an area to select features from
      // Draw Interaction does not need a layer, only a source is enough for it to work.  
      selectSource = new VectorSource();

      const debugStyle = [
        /* We are using two different styles:
         *  - The first style is for line & polygons geometries.
         *  - The second style is for point geometries.
         */
        new Style({
          stroke: new Stroke({
            color: 'rgba(255, 0, 0, 0.5)',
            width: 1
          }),
          fill: new Fill({
            color: 'rgba(0, 0, 255, 0)'
          })
        }),
        new Style({
          image: new CircleStyle({
            radius: 5,
            fill: new Fill({
              color: 'red'
            })
          })
        })
      ];

      debugLayer = featurelayer(null, map);
      debugLayer.setStyle(debugStyle);

      document.addEventListener('infowindowclosed', (e) => disableInteraction());

      this.addComponents(buttons);
      this.render();
    },
    render() {
      let htmlString = `${multiselectElement.render()}`;
      let el = dom.html(htmlString);
      document.getElementById(target).appendChild(el);

      htmlString = multiselectButton.render();
      el = dom.html(htmlString);
      document.getElementById(multiselectElement.getId()).appendChild(el);

      if (clickSelection) {
        htmlString = clickSelectionButton.render();
        el = dom.html(htmlString);
        document.getElementById(multiselectElement.getId()).appendChild(el);
      }
      if (boxSelection) {
        htmlString = boxSelectionButton.render();
        el = dom.html(htmlString);
        document.getElementById(multiselectElement.getId()).appendChild(el);
      }
      if (circleSelection) {
        htmlString = circleSelectionButton.render();
        el = dom.html(htmlString);
        document.getElementById(multiselectElement.getId()).appendChild(el);
      }
      if (bufferSelection) {
        htmlString = bufferSelectionButton.render();
        el = dom.html(htmlString);
        document.getElementById(multiselectElement.getId()).appendChild(el);
      }

      this.dispatch('render');
    }
  });
};

export default Multiselect;
