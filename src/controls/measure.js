import cu from 'ceeu';
import Sphere from 'ol/sphere';
import VectorSource from 'ol/source/vector';
import VectorLayer from 'ol/layer/vector';
import DrawInteraction from 'ol/interaction/draw';
import Overlay from 'ol/overlay';
import Polygon from 'ol/geom/polygon';
import LineString from 'ol/geom/linestring';
import Style from '../style';
import StyleTypes from '../style/styletypes';

const Measure = function Measure({
  default: defaultMeasureTool = 'length',
  measureTools = ['length', 'area']
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
  let defaultTool;
  let isActive = false;
  const overlayArray = [];

  let viewer;
  let mapEl;
  let measureElement;
  let measureButton;
  let lengthToolButton;
  let areaToolButton;
  const buttons = [];
  let target;

  const disableMeasureEvent = new CustomEvent('enableInteraction', {
    bubbles: true,
    detail: 'featureInfo'
  });
  const enableMeasureEvent = new CustomEvent('enableInteraction', {
    bubbles: true,
    detail: 'measure'
  });

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
    const length = Sphere.getLength(line, {
      projection
    });
    let output;

    if (length > 100) {
      output = `${Math.round((length / 1000) * 100) / 100} km`;
    } else {
      output = `${Math.round(length * 100) / 100} m`;
    }

    return output;
  }

  function formatArea(polygon) {
    const projection = map.getView().getProjection();
    const area = Sphere.getArea(polygon, {
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
    }, this);
  }

  function toggleMeasure() {
    if (isActive) {
      document.dispatchEvent(new CustomEvent('toggleInteraction', {
        bubbles: true,
        detail: 'featureInfo'
      }));
      disableInteraction();
    } else {
      document.dispatchEvent(new CustomEvent('toggleInteraction', {
        bubbles: true,
        detail: 'measure'
      }));
      enableInteraction();
    }
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

  return cu.Component({
    name: 'measure',
    onAdd(evt) {
      viewer = evt.target;
      target = `${viewer.getMain().getMapTools().getId()}`;
      mapEl = document.getElementById(viewer.getMain().getId());

      map = viewer.getMap();
      source = new VectorSource();
      measureStyleOptions = styleTypes.getStyle('measure');

      // Drawn features
      vector = new VectorLayer({
        source,
        name: 'measure',
        visible: false,
        zIndex: 6
      });

      map.addLayer(vector);
      this.addComponents(buttons);
      this.render();
    },
    onInit() {
      lengthTool = measureTools.indexOf('length') >= 0;
      areaTool = measureTools.indexOf('area') >= 0;
      defaultTool = lengthTool ? defaultMeasureTool : 'area';
      if (lengthTool || areaTool) {
        measureElement = cu.Element({
          cls: 'o-toolbar-horizontal',
          tagName: 'div'
        });

        measureButton = cu.Button({
          cls: 'o-home-in padding-small icon-smaller rounded light box-shadow',
          click() {
            toggleMeasure();
          },
          icon: '#ic_straighten_24px'
        });
        buttons.push(measureButton);

        if (lengthTool) {
          lengthToolButton = cu.Button({
            cls: 'o-home-in padding-small margin-left-smaller icon-smaller rounded light box-shadow hidden',
            click() {
              type = 'LineString';
              toggleType(this);
            },
            icon: '#minicons-line-vector',
            tooltipText: 'Linje',
            tooltipPlacement: 'north'
          });
          buttons.push(lengthToolButton);
          defaultButton = lengthToolButton;
        }

        if (areaTool) {
          areaToolButton = cu.Button({
            cls: 'o-home-in padding-small margin-left-smaller icon-smaller rounded light box-shadow absolute hidden',
            click() {
              type = 'Polygon';
              toggleType(this);
            },
            icon: '#minicons-square-vector',
            tooltipText: 'Yta',
            tooltipPlacement: 'north'
          });
          buttons.push(areaToolButton);
          defaultButton = defaultTool === 'length' ? lengthToolButton : areaToolButton;
        }
      }
    },
    render() {
      let htmlString = `<div class="absolute width-8">
                            ${measureElement.render()}
                         </div>`;
      let el = cu.dom.html(htmlString);
      document.getElementById(target).appendChild(el);
      htmlString = measureButton.render();
      el = cu.dom.html(htmlString);
      document.getElementById(measureElement.getId()).appendChild(el);
      if (lengthTool) {
        htmlString = lengthToolButton.render();
        buttons.push(lengthToolButton);
        el = cu.dom.html(htmlString);
        document.getElementById(measureElement.getId()).appendChild(el);
      }
      if (areaTool) {
        htmlString = areaToolButton.render();
        el = cu.dom.html(htmlString);
        document.getElementById(measureElement.getId()).appendChild(el);
      }
      this.dispatch('render');
    }
  });
};

export default Measure;
