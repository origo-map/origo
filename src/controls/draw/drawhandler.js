import Draw from 'ol/interaction/Draw';
import Select from 'ol/interaction/Select';
import Modify from 'ol/interaction/Modify';
import DoubleClickZoom from 'ol/interaction/DoubleClickZoom';
import GeoJSONFormat from 'ol/format/GeoJSON';
import Feature from 'ol/Feature';
import shapes from './shapes';
import generateUUID from '../../utils/generateuuid';
import { Component } from '../../ui';

const DrawHandler = function DrawHandler(options = {}) {
  const {
    stylewindow,
    drawCmp,
    viewer
  } = options;
  let map;
  let drawSource;
  let drawLayer;
  let draw;
  let activeTool;
  let select;
  let modify;
  let annotationField;
  let drawOptions;
  let thisComponent;

  function disableDoubleClickZoom(evt) {
    const featureType = evt.feature.getGeometry().getType();
    const interactionsToBeRemoved = [];

    if (featureType === 'Point') {
      return;
    }

    map.getInteractions().forEach((interaction) => {
      if (interaction instanceof DoubleClickZoom) {
        interactionsToBeRemoved.push(interaction);
      }
    });
    if (interactionsToBeRemoved.length > 0) {
      map.removeInteraction(interactionsToBeRemoved[0]);
    }
  }

  function onDrawStart(evt) {
    if (evt.feature.getGeometry().getType() !== 'Point') {
      disableDoubleClickZoom(evt);
    }
  }

  function setActive(drawType) {
    switch (drawType) {
      case 'draw':
        modify.setActive(true);
        if (select) {
          select.getFeatures().clear();
          select.setActive(false);
        }
        break;
      default:
        activeTool = undefined;
        map.removeInteraction(draw);
        modify.setActive(true);
        if (select) {
          select.getFeatures().clear();
          select.setActive(true);
        }
        break;
    }
  }

  function onTextEnd(feature, textVal) {
  // Remove the feature if no text is set
    if (textVal === '') {
      drawLayer.getSource().removeFeature(feature);
    } else {
      feature.set(annotationField, textVal);
    }
    setActive();
    activeTool = undefined;
    const details = {
      feature,
      layerName: drawLayer.get('name'),
      action: 'insert',
      tool: 'Text',
      active: false
    };
    thisComponent.dispatch('changeDraw', details);
  }

  function addDoubleClickZoomInteraction() {
    const allDoubleClickZoomInteractions = [];
    map.getInteractions().forEach((interaction) => {
      if (interaction instanceof DoubleClickZoom) {
        allDoubleClickZoomInteractions.push(interaction);
      }
    });
    if (allDoubleClickZoomInteractions.length < 1) {
      map.addInteraction(new DoubleClickZoom());
    }
  }

  function enableDoubleClickZoom() {
    setTimeout(() => {
      addDoubleClickZoomInteraction();
    }, 100);
  }

  function onDrawEnd(evt) {
    const feature = evt.feature;
    if (activeTool === 'Text') {
      onTextEnd(feature, 'Text');
      stylewindow.dispatch('showStylewindow', true);
    } else {
      setActive();
      activeTool = undefined;
    }
    enableDoubleClickZoom(evt);
    if (drawLayer) {
      feature.setId(generateUUID());
      const styleObject = stylewindow.getStyleObject(feature);
      feature.set('origostyle', styleObject);
    }
    const details = {
      feature,
      layerName: drawLayer.get('name'),
      action: 'insert',
      status: 'pending',
      tool: feature.getGeometry().getType(),
      active: false
    };
    thisComponent.dispatch('changeDraw', details);
    if (select) {
      select.getFeatures().clear();
      select.getFeatures().push(feature);
    }
  }

  function setDraw(tool, drawType) {
    let geometryType = tool;
    drawSource = drawLayer.getSource();
    activeTool = tool;

    if (activeTool === 'Text') {
      geometryType = 'Point';
    }

    const opt = {
      source: drawSource,
      type: geometryType
    };

    if (drawType) {
      Object.assign(opt, shapes(drawType));
    }

    map.removeInteraction(draw);
    draw = new Draw(opt);
    map.addInteraction(draw);
    const details = {
      tool,
      active: true
    };
    thisComponent.dispatch('changeDraw', details);

    draw.on('drawend', onDrawEnd, this);
    draw.on('drawstart', onDrawStart, this);
  }

  function onDeleteSelected() {
    const features = select.getFeatures();
    let source;
    if (features.getLength()) {
      source = drawLayer.getSource();
      features.forEach((feature) => {
        const details = {
          feature,
          layerName: drawLayer.get('name'),
          action: 'delete',
          status: 'pending'
        };
        thisComponent.dispatch('changeDraw', details);
        source.removeFeature(feature);
      });
      select.getFeatures().clear();
    }
  }

  function onModifyEnd(evt) {
    const feature = evt.features.item(0);
    const details = {
      feature,
      layerName: drawLayer.get('name'),
      action: 'update',
      status: 'pending'
    };
    thisComponent.dispatch('changeDraw', details);
  }

  function cancelDraw(tool) {
    setActive();
    activeTool = undefined;
    const details = {
      tool,
      active: false
    };
    thisComponent.dispatch('changeDraw', details);
  }

  function isActive() {
    if (modify === undefined || select === undefined) {
      return false;
    }
    return true;
  }

  function removeInteractions() {
    if (isActive()) {
      map.removeInteraction(modify);
      map.removeInteraction(select);
      map.removeInteraction(draw);
      modify = undefined;
      select = undefined;
      draw = undefined;
    }
  }

  function toggleDraw(detail) {
    if (detail.clearTool) {
      activeTool = undefined;
    }
    if (detail.tool === 'delete') {
      onDeleteSelected();
    } else if (detail.tool === 'cancel' && isActive()) {
      cancelDraw(detail.tool);
      removeInteractions();
    } else if (detail.tool === activeTool) {
      cancelDraw(detail.tool);
    } else if (detail.tool === 'Polygon' || detail.tool === 'LineString' || detail.tool === 'Point' || detail.tool === 'Text') {
      if (activeTool) {
        cancelDraw(activeTool);
      }
      setActive('draw');
      setDraw(detail.tool, detail.drawType);
    }
  }

  function getFeaturesByIds(type, layer, ids) {
    const source = layer.getSource();
    const features = [];
    if (type === 'delete') {
      ids.forEach((id) => {
        const dummy = new Feature();
        dummy.setId(id);
        features.push(dummy);
      });
    } else {
      ids.forEach((id) => {
        let feature;
        if (source.getFeatureById(id)) {
          feature = source.getFeatureById(id);
          feature.unset('bbox');
          features.push(feature);
        }
      });
    }

    return features;
  }

  const getSelection = () => select.getFeatures();

  const getActiveLayer = () => drawLayer;

  function getDrawLayers() {
    const drawLayersArray = viewer.getLayersByProperty('drawlayer', true);
    return drawLayersArray;
  }

  function onSelectChange() {
    thisComponent.dispatch('selectionChange', { features: getSelection() });
  }

  function onSelectAdd(e) {
    onSelectChange(e);
    if (e.target) {
      const feature = e.target.item(0);
      const s = feature.get('origostyle') || {};
      s.selected = true;
      feature.set('origostyle', s);
      feature.changed();
      stylewindow.updateStylewindow(feature);
    }
  }

  function onSelectRemove(e) {
    onSelectChange(e);
    const feature = e.element;
    const s = feature.get('origostyle') || {};
    s.selected = false;
    feature.set('origostyle', s);
    feature.changed();
    stylewindow.restoreStylewindow();
  }

  function removeDrawInteractions() {
    if (select) {
      select.getFeatures().clear();
      map.removeInteraction(select);
    }
    if (modify) {
      map.removeInteraction(modify);
    }
    thisComponent.dispatch('changeButtonState', { state: 'disabled' });
  }

  function addDrawInteractions() {
    removeDrawInteractions();
    select = new Select({
      layers: [drawLayer],
      style: null,
      hitTolerance: 5
    });
    modify = new Modify({
      features: select.getFeatures()
    });
    map.addInteraction(select);
    map.addInteraction(modify);
    select.getFeatures().on('add', onSelectAdd, this);
    select.getFeatures().on('remove', onSelectRemove, this);
    select.getFeatures().on('change', onSelectChange, this);
    modify.on('modifyend', onModifyEnd, this);
    setActive();
    if (drawLayer.getVisible()) {
      thisComponent.dispatch('changeButtonState', { state: 'initial' });
    }
  }

  function onChangeVisible() {
    if (drawCmp.isActive()) {
      if (drawLayer.getVisible()) {
        addDrawInteractions();
      } else {
        removeDrawInteractions();
      }
    }
  }

  function setActiveLayer(layer) {
    if (layer) {
      if (drawLayer) {
        drawLayer.un('change:visible', onChangeVisible);
      }
      drawLayer = layer;
      drawLayer.on('change:visible', onChangeVisible);
      onChangeVisible();
    } else {
      drawLayer = null;
      removeDrawInteractions();
    }
  }

  function onUpdate(feature, layerName) {
    const details = {
      feature,
      layerName,
      action: 'update',
      status: 'pending'
    };
    thisComponent.dispatch('changeDraw', details);
  }

  function addLayer(layerParams = {}) {
    const layerOptions = Object.assign({}, drawOptions, layerParams);
    const {
      layerTitle,
      groupName,
      groupTitle,
      draggable,
      layerId = generateUUID(),
      layer,
      features,
      source,
      visible,
      styleByAttribute,
      queryable,
      removable,
      exportable,
      drawlayer
    } = layerOptions;
    let newLayer;
    if (layer) { // Should maybe be handled differently, where does the layer come from?
      newLayer = layer;
      map.addLayer(newLayer);
    } else {
      if (!viewer.getGroup(groupName) && groupName !== 'none' && groupName !== 'root') {
        viewer.addGroup({ title: groupTitle, name: groupName, expanded: true, draggable });
      }
      const newLayerOptions = {
        group: groupName,
        id: layerId,
        name: layerId,
        title: layerTitle,
        zIndex: 7,
        styleByAttribute,
        visible,
        queryable,
        removable,
        exportable,
        drawlayer,
        type: 'GEOJSON',
        attributes: [
          {
            title: '',
            name: 'popuptext',
            type: 'text'
          }
        ]
      };
      if (source) {
        newLayerOptions.source = source;
      }
      if (features) {
        newLayerOptions.features = features;
      }
      newLayer = viewer.addLayer(newLayerOptions);
    }
    newLayer.getSource().forEachFeature((e) => {
      e.on('change:origostyle', () => {
        onUpdate(e, newLayer.get('name'));
      });
      e.on('change:popuptext', () => {
        onUpdate(e, newLayer.get('name'));
      });
    });
    newLayer.getSource().on('addfeature', (e) => {
      e.feature.on('change:origostyle', () => {
        onUpdate(e, newLayer.get('name'));
      });
      e.feature.on('change:popuptext', () => {
        onUpdate(e, newLayer.get('name'));
      });
    });
    return newLayer;
  }

  async function onEnableInteraction(e) {
    if (e.detail.name === 'draw' && e.detail.active) {
      if (drawLayer === undefined) {
        const addedLayer = await thisComponent.addLayer();
        setActiveLayer(addedLayer);
      }
      addDrawInteractions();
    }
  }

  const getActiveTool = () => activeTool;

  function getState() {
    if (select) {
      select.getFeatures().clear();
    }
    const drawLayers = getDrawLayers();
    const layerArr = [];
    drawLayers.forEach(layer => {
      const source = layer.getSource();
      const layerId = layer.get('name') || layer.get('id') || generateUUID();
      const layerTitle = layer.get('title') || drawOptions.layerTitle || 'Ritlager';
      const visible = layer.get('visible') || layer.getVisible();
      const features = source.getFeatures();
      const geojson = new GeoJSONFormat();
      layerArr.push({ id: layerId, title: layerTitle, visible, features: geojson.writeFeatures(features) });
    });
    if (layerArr.length > 0) {
      return {
        layers: layerArr
      };
    }
    return undefined;
  }

  function restoreState(urlParams) {
    if (urlParams && urlParams.controls && urlParams.controls.draw) {
      const state = urlParams.controls.draw;
      // TODO: Sanity/data check
      let activeLayer;
      if (state.layers && state.layers.length > 0) {
        state.layers.forEach(layer => {
          const layerId = layer.id || generateUUID();
          const layerTitle = layer.title || 'Ritlager';
          const visible = layer.visible;
          const features = layer.features;
          const newLayer = thisComponent.addLayer({ layerId, layerTitle, visible });
          const source = newLayer.getSource();
          source.addFeatures(features);
          activeLayer = newLayer;
        });
      } else if (state.features && state.features.length > 0) {
        const features = state.features;
        features.forEach(feature => {
          const layerId = feature.get('layer');
          if (layerId) {
            const layer = viewer.getLayer(layerId);
            if (layer) {
              const source = layer.getSource();
              source.addFeature(feature);
            } else {
              let layerTitle;
              const newLayer = thisComponent.addLayer({ layerId, layerTitle });
              const source = newLayer.getSource();
              source.addFeature(feature);
              activeLayer = newLayer;
            }
          } else {
            if (drawLayer === undefined) {
              drawLayer = thisComponent.addLayer();
            }
            const source = drawLayer.getSource();
            source.addFeature(feature);
            activeLayer = drawLayer;
          }
        });
      }
      if (activeLayer) {
        setActiveLayer(activeLayer);
      }
    }
  }
  return Component({
    name: 'drawHandler',
    getDrawLayers,
    getActiveLayer,
    setActiveLayer,
    addLayer,
    getSelection,
    getFeaturesByIds,
    getState,
    restoreState,
    getActiveTool,
    isActive,
    toggleDraw,
    onInit() {
      thisComponent = this;
      map = viewer.getMap();
      annotationField = 'annotation';
      drawOptions = drawCmp.getDrawOptions();
      activeTool = undefined;
      viewer.on('toggleClickInteraction', (detail) => {
        onEnableInteraction({ detail });
      });
    }
  });
};

export default DrawHandler;
