import { getArea, getLength } from 'ol/sphere';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import DrawInteraction from 'ol/interaction/Draw';
import Overlay from 'ol/Overlay';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import Projection from 'ol/proj/Projection';
import { Component, Element as El, Button, dom } from '../ui';
import Style from '../style';
import StyleTypes from '../style/styletypes';
import replacer from '../utils/replacer';

const Measure = function Measure({
  default: defaultMeasureTool = 'length',
  measureTools = ['length', 'area'],
  elevationServiceURL,
  elevationTargetProjection,
  elevationAttribute
} = {}) {
  const style = Style;
  const styleTypes = StyleTypes();

  let map;
  let activeButton;
  let defaultButton;
  let measure;
  let type;
  let sketch;
  let measureTooltip;
  let measureTooltipElement;
  let measureStyleOptions;
  let helpTooltip;
  let helpTooltipElement;
  let vector;
  let source;
  let label;
  let lengthTool;
  let areaTool;
  let elevationTool;
  let defaultTool;
  let isActive = false;
  const overlayArray = [];

  let viewer;
  let measureElement;
  let measureButton;
  let lengthToolButton;
  let areaToolButton;
  let elevationToolButton;
  const buttons = [];
  let target;

  function createStyle(feature) {
    const featureType = feature.getGeometry().getType();
    const measureStyle = featureType === 'LineString' ? style.createStyleRule(measureStyleOptions.linestring) : style.createStyleRule(measureStyleOptions.polygon);

    return measureStyle;
  }
  function setActive(state) {
    isActive = state;
  }

  function createHelpTooltip() {
    if (helpTooltipElement) {
      helpTooltipElement.parentNode.removeChild(helpTooltipElement);
    }

    helpTooltipElement = document.createElement('div');
    helpTooltipElement.className = 'o-tooltip o-tooltip-measure';

    helpTooltip = new Overlay({
      element: helpTooltipElement,
      offset: [15, 0],
      positioning: 'center-left'
    });

    overlayArray.push(helpTooltip);
    map.addOverlay(helpTooltip);
  }

  function createMeasureTooltip() {
    if (measureTooltipElement) {
      measureTooltipElement.parentNode.removeChild(measureTooltipElement);
    }

    measureTooltipElement = document.createElement('div');
    measureTooltipElement.className = 'o-tooltip o-tooltip-measure';

    measureTooltip = new Overlay({
      element: measureTooltipElement,
      offset: [0, -15],
      positioning: 'bottom-center',
      stopEvent: false
    });

    overlayArray.push(measureTooltip);
    map.addOverlay(measureTooltip);
  }

  function formatLength(line) {
    const projection = map.getView().getProjection();
    const length = getLength(line, {
      projection
    });
    let output;

    if (length > 1000) {
      output = `${Math.round((length / 1000) * 100) / 100} km`;
    } else {
      output = `${Math.round(length * 100) / 100} m`;
    }

    return output;
  }

  function formatArea(polygon) {
    const projection = map.getView().getProjection();
    const area = getArea(polygon, {
      projection
    });
    let output;

    if (area > 10000000) {
      output = `${Math.round((area / 1000000) * 100) / 100} km<sup>2</sup>`;
    } else if (area > 10000) {
      output = `${Math.round((area / 10000) * 100) / 100} ha`;
    } else {
      output = `${Math.round(area * 100) / 100} m<sup>2</sup>`;
    }

    const htmlElem = document.createElement('span');
    htmlElem.innerHTML = output;

    [].forEach.call(htmlElem.children, (element) => {
      const el = element;
      if (el.tagName === 'SUP') {
        el.textContent = String.fromCharCode(el.textContent.charCodeAt(0) + 128);
      }
    });

    return htmlElem.textContent;
  }

  function getElevationAttribute(path, obj = {}) {
    const properties = Array.isArray(path) ? path : path.split(/[.[\]]+/).filter(element => element);
    return properties.reduce((prev, curr) => prev && prev[curr], obj);
  }

  function getElevation(evt) {
    const feature = evt.feature;
    let coordinates;
    let elevationProjection;
    const options = {
      start: '{',
      end: '}'
    };

    if (elevationTargetProjection && elevationTargetProjection !== viewer.getProjection().getCode()) {
      const clone = feature.getGeometry().clone();
      clone.transform(viewer.getProjection().getCode(), elevationTargetProjection);
      coordinates = clone.getCoordinates();
      elevationProjection = new Projection({ code: elevationTargetProjection });
    } else {
      coordinates = feature.getGeometry().getCoordinates();
      elevationProjection = viewer.getProjection();
    }

    let easting = coordinates[0];
    let northing = coordinates[1];

    switch (elevationProjection.getAxisOrientation()) {
      case 'enu':
        easting = coordinates[0];
        northing = coordinates[1];
        break;
      case 'neu':
        northing = coordinates[0];
        easting = coordinates[1];
        break;
      default:
        easting = coordinates[0];
        northing = coordinates[1];
        break;
    }

    const url = replacer.replace(elevationServiceURL, {
      easting,
      northing
    }, options);

    feature.setStyle(createStyle(feature));
    feature.getStyle()[0].getText().setText('Hämtar höjd...');

    fetch(url).then(response => response.json({
      cache: false
    })).then((data) => {
      const elevation = getElevationAttribute(elevationAttribute, data);
      feature.getStyle()[0].getText().setText(`${elevation.toFixed(1)} m`);
      source.changed();
    });
  }

  // Display and move tooltips with pointer
  function pointerMoveHandler(evt) {
    if (evt.dragging) {
      return;
    }

    const helpMsg = 'Klicka för att börja mäta';
    let tooltipCoord = evt.coordinate;

    if (sketch) {
      const geom = (sketch.getGeometry());
      let output;

      if (geom instanceof Polygon) {
        output = formatArea((geom));
        tooltipCoord = geom.getInteriorPoint().getCoordinates();
      } else if (geom instanceof LineString) {
        output = formatLength((geom));
        tooltipCoord = geom.getLastCoordinate();
      }

      measureTooltipElement.innerHTML = output;
      label = output;
      measureTooltip.setPosition(tooltipCoord);
    }

    if (evt.type === 'pointermove') {
      helpTooltipElement.innerHTML = helpMsg;
      helpTooltip.setPosition(evt.coordinate);
    }
  }

  function disableInteraction() {
    if (activeButton) {
      document.getElementById(activeButton.getId()).classList.remove('active');
    }
    document.getElementById(measureButton.getId()).classList.remove('active');
    if (lengthTool) {
      document.getElementById(lengthToolButton.getId()).classList.add('hidden');
    }
    if (areaTool) {
      document.getElementById(areaToolButton.getId()).classList.add('hidden');
    }
    if (elevationTool) {
      document.getElementById(elevationToolButton.getId()).classList.add('hidden');
    }
    document.getElementById(measureButton.getId()).classList.add('tooltip');
    setActive(false);

    map.un('pointermove', pointerMoveHandler);
    map.un('click', pointerMoveHandler);
    map.removeInteraction(measure);
    vector.setVisible(false);
    viewer.removeOverlays(overlayArray);
    vector.getSource().clear();
    setActive(false);
  }

  function enableInteraction() {
    document.getElementById(measureButton.getId()).classList.add('active');
    if (lengthTool) {
      document.getElementById(lengthToolButton.getId()).classList.remove('hidden');
    }
    if (areaTool) {
      document.getElementById(areaToolButton.getId()).classList.remove('hidden');
    }
    if (elevationTool) {
      document.getElementById(elevationToolButton.getId()).classList.remove('hidden');
    }
    document.getElementById(measureButton.getId()).classList.remove('tooltip');
    setActive(true);
    document.getElementById(defaultButton.getId()).click();
  }

  function addInteraction() {
    vector.setVisible(true);

    measure = new DrawInteraction({
      source,
      type,
      style: style.createStyleRule(measureStyleOptions.interaction)
    });

    map.addInteraction(measure);
    createMeasureTooltip();
    createHelpTooltip();

    map.on('pointermove', pointerMoveHandler);
    map.on('click', pointerMoveHandler);

    measure.on('drawstart', (evt) => {
      sketch = evt.feature;
      document.getElementsByClassName('o-tooltip-measure')[1].classList.add('hidden');
    }, this);

    measure.on('drawend', (evt) => {
      const feature = evt.feature;
      feature.setStyle(createStyle(feature));
      feature.getStyle()[0].getText().setText(label);
      document.getElementsByClassName('o-tooltip-measure')[0].remove();
      // unset sketch
      sketch = null;
      // unset tooltip so that a new one can be created
      measureTooltipElement = null;
      createMeasureTooltip();
      document.getElementsByClassName('o-tooltip-measure')[1].classList.remove('hidden');
      if (feature.getGeometry().getType() === 'Point') {
        getElevation(evt);
      }
    }, this);
  }

  function toggleMeasure() {
    const detail = {
      name: 'measure',
      active: !isActive
    };
    viewer.dispatch('toggleClickInteraction', detail);
  }

  function toggleType(button) {
    if (activeButton) {
      document.getElementById(activeButton.getId()).classList.remove('active');
    }

    document.getElementById(button.getId()).classList.add('active');
    activeButton = button;
    map.removeInteraction(measure);
    addInteraction();
  }

  return Component({
    name: 'measure',
    onAdd(evt) {
      viewer = evt.target;
      target = `${viewer.getMain().getMapTools().getId()}`;

      map = viewer.getMap();
      source = new VectorSource();
      measureStyleOptions = styleTypes.getStyle('measure');

      // Drawn features
      vector = new VectorLayer({
        group: 'none',
        source,
        name: 'measure',
        visible: false,
        zIndex: 6
      });

      map.addLayer(vector);
      this.addComponents(buttons);
      this.render();
      viewer.on('toggleClickInteraction', (detail) => {
        if (detail.name === 'measure' && detail.active) {
          enableInteraction();
        } else {
          disableInteraction();
        }
      });
    },
    onInit() {
      lengthTool = measureTools.indexOf('length') >= 0;
      areaTool = measureTools.indexOf('area') >= 0;
      elevationTool = measureTools.indexOf('elevation') >= 0;
      defaultTool = lengthTool ? defaultMeasureTool : 'area';
      if (lengthTool || areaTool || elevationTool) {
        measureElement = El({
          tagName: 'div',
          cls: 'flex column'
        });

        measureButton = Button({
          cls: 'o-measure padding-small margin-bottom-smaller icon-smaller round light box-shadow',
          click() {
            toggleMeasure();
          },
          icon: '#ic_straighten_24px',
          tooltipText: 'Mäta',
          tooltipPlacement: 'east'
        });
        buttons.push(measureButton);

        if (lengthTool) {
          lengthToolButton = Button({
            cls: 'o-measure-length padding-small margin-bottom-smaller icon-smaller round light box-shadow hidden',
            click() {
              type = 'LineString';
              toggleType(this);
            },
            icon: '#ic_timeline_24px',
            tooltipText: 'Längd',
            tooltipPlacement: 'east'
          });
          buttons.push(lengthToolButton);
          defaultButton = lengthToolButton;
        }

        if (areaTool) {
          areaToolButton = Button({
            cls: 'o-measure-area padding-small margin-bottom-smaller icon-smaller round light box-shadow hidden',
            click() {
              type = 'Polygon';
              toggleType(this);
            },
            icon: '#o_polygon_24px',
            tooltipText: 'Yta',
            tooltipPlacement: 'east'
          });
          buttons.push(areaToolButton);
          defaultButton = defaultTool === 'length' ? lengthToolButton : areaToolButton;
        }

        if (elevationTool) {
          elevationToolButton = Button({
            cls: 'o-measure-elevation padding-small icon-smaller round light box-shadow hidden',
            click() {
              type = 'Point';
              toggleType(this);
            },
            icon: '#ic_height_24px',
            tooltipText: 'Höjd',
            tooltipPlacement: 'east'
          });
          buttons.push(elevationToolButton);
          defaultButton = defaultTool === 'length' ? lengthToolButton : elevationToolButton;
        }
      }
    },
    render() {
      let htmlString = `${measureElement.render()}`;
      let el = dom.html(htmlString);
      document.getElementById(target).appendChild(el);
      htmlString = measureButton.render();
      el = dom.html(htmlString);
      document.getElementById(measureElement.getId()).appendChild(el);
      if (lengthTool) {
        htmlString = lengthToolButton.render();
        buttons.push(lengthToolButton);
        el = dom.html(htmlString);
        document.getElementById(measureElement.getId()).appendChild(el);
      }
      if (areaTool) {
        htmlString = areaToolButton.render();
        el = dom.html(htmlString);
        document.getElementById(measureElement.getId()).appendChild(el);
      }
      if (elevationTool) {
        htmlString = elevationToolButton.render();
        el = dom.html(htmlString);
        document.getElementById(measureElement.getId()).appendChild(el);
      }
      this.dispatch('render');
    }
  });
};

export default Measure;
