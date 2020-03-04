import Geolocation from 'ol/Geolocation';
import Overlay from 'ol/Overlay';
import { Component, Button, dom } from '../ui';

const Geoposition = function Geoposition(options = {}) {
  let {
    target,
    zoomLevel
  } = options;

  const {
    active = false,
    panTo = true
  } = options;

  let viewer;
  let positionButton;
  let baseUrl;
  let markerOverlay;
  let geolocation;
  // const tooltipText = 'Visa nuvarande position i kartan';

  const centerPosition = () => {
    if (geolocation.getTracking()) {
      viewer.getMap().getView().animate({
        center: geolocation.getPosition(),
        zoom: zoomLevel
      });
    }
  };

  const addPosition = function addPosition(current) {
    const position = current.position;
    markerOverlay.setPosition(position);
  };

  const getPositionVal = function getPositionVal() {
    const current = {};
    current.position = geolocation.getPosition();
    current.accuracy = geolocation.getAccuracy();
    current.heading = geolocation.getHeading() || 0;
    current.speed = geolocation.getSpeed() || 0;
    current.m = Date.now();
    return current;
  };

  const updatePosition = function updatePosition() {
    addPosition(getPositionVal());
  };

  const toggleState = function toggleState() {
    if (positionButton.getState() === 'initial') {
      positionButton.dispatch('change', { state: 'active' });
    } else {
      positionButton.dispatch('change', { state: 'initial' });
    }
  };

  const onActive = function onActive() {
    const markerEl = dom.createElement('img', '', {
      src: `${baseUrl}img/geolocation_marker.png`
    });
    viewer.getMap().getTargetElement().appendChild(markerEl);
    markerOverlay = new Overlay({
      positioning: 'center-center',
      element: markerEl,
      stopEvent: false
    });
    viewer.getMap().addOverlay(markerOverlay);

    geolocation.on('change', updatePosition);
    if (panTo) {
      geolocation.once('change', centerPosition);
    }
    geolocation.setTracking(true);
  };

  const onInitial = function onInitial() {
    geolocation.setTracking(false);
    geolocation.un('change', updatePosition);
    viewer.getMap().removeOverlay(markerOverlay);
  };

  return Component({
    name: 'geoposition',
    onAdd(evt) {
      viewer = evt.target;
      if (!target) target = `${viewer.getMain().getNavigation().getId()}`;
      if (!zoomLevel) zoomLevel = viewer.getResolutions().length - 3 || 0;
      baseUrl = viewer.getBaseUrl();
      this.on('render', this.onRender);
      this.addComponents([positionButton]);

      geolocation = new Geolocation(({
        projection: viewer.getProjection(),
        trackingOptions: {
          maximumAge: 10000,
          enableHighAccuracy: true,
          timeout: 600000
        }
      }));

      this.render();
    },
    onInit() {
      positionButton = Button({
        cls: 'o-geoposition padding-small icon-smaller round light box-shadow',
        click() {
          toggleState();
        },
        icon: '#ic_near_me_24px',
        methods: {
          active: onActive,
          initial: onInitial
        }
      });
    },
    render() {
      const htmlString = positionButton.render();
      if (active) {
        positionButton.setState('active');
      }
      const el = dom.html(htmlString);
      document.getElementById(target).appendChild(el);
      this.dispatch('render');
    }
  });
};

export default Geoposition;
