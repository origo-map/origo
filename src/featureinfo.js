import 'owl.carousel';
import Overlay from 'ol/overlay';
import $ from 'jquery';
import { Component } from './ui';
import Popup from './popup';
import sidebar from './sidebar';
import maputils from './maputils';
import featurelayer from './featurelayer';
import Style from './style';
import StyleTypes from './style/styletypes';
import getFeatureInfo from './getfeatureinfo';

const styleTypes = StyleTypes();

const Featureinfo = function Featureinfo(options = {}) {
  const {
    clickEvent = 'click',
    clusterFeatureinfoLevel = 1,
    hitTolerance = 0,
    pinning = true,
    pinsStyle: pinStyleOptions = styleTypes.getStyle('pin'),
    savedPin: savedPinOptions,
    savedSelection,
    selectionStyles: selectionStylesOptions,
    showOverlay = true
  } = options;

  let identifyTarget;
  let overlay;
  let items;
  let popup;
  let selectionLayer;
  let viewer;

  const pinStyle = Style.createStyleRule(pinStyleOptions)[0];
  const selectionStyles = selectionStylesOptions ? Style.createGeometryStyle(selectionStylesOptions) : Style.createEditStyle();
  let savedPin = savedPinOptions ? maputils.createPointFeature(savedPinOptions, pinStyle) : undefined;
  const savedFeature = savedPin || savedSelection || undefined;

  if (showOverlay) {
    identifyTarget = 'overlay';
  } else {
    sidebar.init();
    identifyTarget = 'sidebar';
  }

  const clear = function clear() {
    selectionLayer.clear();
    sidebar.setVisibility(false);
    if (overlay) {
      viewer.removeOverlays(overlay);
    }
  };

  const callback = function callback(evt) {
    const currentItem = evt.item.index;
    if (currentItem !== null) {
      selectionLayer.clearAndAdd(
        items[currentItem].feature.clone(),
        selectionStyles[items[currentItem].feature.getGeometry().getType()]
      );
      if (identifyTarget === 'overlay') {
        popup.setTitle(items[currentItem].title);
      } else {
        sidebar.setTitle(items[currentItem].title);
      }
    }
  };

  const initCarousel = function initCarousel(id, opt) {
    const carouselOptions = opt || {
      onChanged: callback,
      items: 1,
      nav: true,
      navText: ['<svg class="o-icon-fa-chevron-left"><use xlink:href="#fa-chevron-left"></use></svg>',
        '<svg class="o-icon-fa-chevron-right"><use xlink:href="#fa-chevron-right"></use></svg>'
      ]
    };
    if (identifyTarget === 'overlay') {
      const popupHeight = $('.o-popup').outerHeight() + 20;
      $('#o-popup').height(popupHeight);
    }
    return $(id).owlCarousel(carouselOptions);
  };

  const getSelectionLayer = function getSelectionLayer() {
    return selectionLayer.getFeatureLayer();
  };

  const getSelection = function getSelection() {
    const selection = {};
    selection.geometryType = selectionLayer.getFeatures()[0].getGeometry().getType();
    selection.coordinates = selectionLayer.getFeatures()[0].getGeometry().getCoordinates();
    return selection;
  };

  const getPin = function getPin() {
    return savedPin;
  };

  const getHitTolerance = function getHitTolerance() {
    return hitTolerance;
  };

  const render = function render(identifyItems, target, coordinate) {
    const map = viewer.getMap();
    items = identifyItems;
    clear();
    let content = items.map(i => i.content).join('');
    content = `<div id="o-identify"><div id="o-identify-carousel" class="owl-carousel owl-theme">${content}</div></div>`;
    switch (target) {
      case 'overlay':
      {
        popup = Popup(`#${viewer.getId()}`);
        popup.setContent({
          content,
          title: items[0].title
        });
        popup.setVisibility(true);
        initCarousel('#o-identify-carousel');
        const popupHeight = $('.o-popup').outerHeight() + 20;
        $('#o-popup').height(popupHeight);
        overlay = new Overlay({
          element: popup.getEl(),
          autoPan: true,
          autoPanAnimation: {
            duration: 500
          },
          autoPanMargin: 40,
          positioning: 'bottom-center'
        });
        const geometry = items[0].feature.getGeometry();
        const coord = geometry.getType() === 'Point' ? geometry.getCoordinates() : coordinate;
        map.addOverlay(overlay);
        overlay.setPosition(coord);
        break;
      }
      case 'sidebar': {
        sidebar.setContent({
          content,
          title: items[0].title
        });
        sidebar.setVisibility(true);
        initCarousel('#o-identify-carousel');
        break;
      }
      default: {
        break;
      }
    }
  };

  const onClick = function onClick(evt) {
    savedPin = undefined;
    // Featurinfo in two steps. Concat serverside and clientside when serverside is finished
    const pixel = evt.pixel;
    const map = viewer.getMap();
    const coordinate = evt.coordinate;
    const layers = viewer.getQueryableLayers();
    const clientResult = getFeatureInfo.getFeaturesAtPixel({
      coordinate,
      clusterFeatureinfoLevel,
      hitTolerance,
      map,
      pixel
    });
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
            selectionLayer.clear();
            render(result, identifyTarget, evt.coordinate);
          } else if (selectionLayer.getFeatures().length > 0) {
            clear();
          } else if (pinning) {
            const resolution = map.getView().getResolution();
            sidebar.setVisibility(false);
            setTimeout(() => {
              if (!maputils.checkZoomChange(resolution, map.getView().getResolution())) {
                savedPin = maputils.createPointFeature(evt.coordinate, pinStyle);
                selectionLayer.addFeature(savedPin);
              }
            }, 250);
          }
        });
    }
  };

  const setActive = function setActive(state) {
    const map = viewer.getMap();
    if (state) {
      map.on(clickEvent, onClick);
    } else {
      clear();
      map.un(clickEvent, onClick);
    }
  };

  // jQuery Events
  const onEnableInteraction = function onEnableInteraction(e) {
    if (e.interaction === 'featureInfo') {
      setActive(true);
    } else {
      setActive(false);
    }
  };

  // ES6 Events
  const onToggleInteraction = function onToggleInteraction(e) {
    if (e.detail === 'featureInfo') {
      setActive(true);
    } else {
      setActive(false);
    }
  };

  return Component({
    name: 'featureInfo',
    clear,
    getHitTolerance,
    getPin,
    getSelectionLayer,
    getSelection,
    onAdd(e) {
      viewer = e.target;
      const map = viewer.getMap();
      selectionLayer = featurelayer(savedFeature, map);
      map.on(clickEvent, onClick);
      $(document).on('enableInteraction', onEnableInteraction);
      document.addEventListener('toggleInteraction', onToggleInteraction);
    },
    render
  });
};

export default Featureinfo;
