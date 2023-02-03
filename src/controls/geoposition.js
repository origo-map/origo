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
    panTo = true,
    enableTracking = false
  } = options;

  const geolocationIcon = '#ic_near_me_24px';
  const trackingIcon = '#ic_navigation_24px';

  let viewer;
  let positionButton;
  let markerOverlay;
  let geolocation;

  const centerPosition = () => {
    if (geolocation.getTracking()) {
      viewer.getMap().getView().animate({
        center: geolocation.getPosition(),
        zoom: zoomLevel
      });
    }
  };

  const trackingPosition = () => {
    if (geolocation.getTracking()) {
      viewer.getMap().getView().animate({
        center: geolocation.getPosition()
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
    } else if (positionButton.getState() === 'active' && enableTracking) {
      positionButton.dispatch('change', { state: 'tracking' });
    } else {
      positionButton.dispatch('change', { state: 'initial' });
    }
  };

  const onPointerDrag = function onMapMove() {
    geolocation.un('change', trackingPosition);
    positionButton.setIcon(geolocationIcon);
    positionButton.dispatch('change', { state: 'active' });
  };

  const onActive = function onActive() {
    if (!geolocation.getTracking()) {
      const markerEl = dom.createElement('img', '', {
        src: 'img/geolocation_marker.png'
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
    }
  };

  const onInitial = function onInitial() {
    geolocation.setTracking(false);
    geolocation.un('change', updatePosition);
    geolocation.un('change', trackingPosition);
    viewer.getMap().un('pointerdrag', onPointerDrag);
    viewer.getMap().removeOverlay(markerOverlay);
    positionButton.setIcon(geolocationIcon);
  };

  const onTracking = function onTracking() {
    geolocation.on('change', trackingPosition);
    positionButton.setIcon(trackingIcon);
    viewer.getMap().on('pointerdrag', onPointerDrag);
  };

  return Component({
    name: 'geoposition',
    onAdd(evt) {
      viewer = evt.target;
      if (!target) target = `${viewer.getMain().getNavigation().getId()}`;
      if (!zoomLevel) zoomLevel = viewer.getResolutions().length - 3 || 0;
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
        icon: geolocationIcon,
        tooltipText: 'Visa din nuvarande position i kartan',
        tooltipPlacement: 'east',
        methods: {
          active: onActive,
          initial: onInitial,
          tracking: onTracking
        }
      });
    },
    hide() {
      document.getElementById(positionButton.getId()).classList.add('hidden');
    },
    unhide() {
      document.getElementById(positionButton.getId()).classList.remove('hidden');
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
