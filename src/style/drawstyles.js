import {
  Circle as CircleStyle,
  Fill,
  Icon,
  RegularShape,
  Stroke,
  Style,
  Text
} from 'ol/style';
import { getArea, getLength } from 'ol/sphere';
import { LineString, MultiPoint, Point } from 'ol/geom';

function createRegularShape(type, pointSize, pointFill, pointStroke, pointRotation) {
  let style;
  const size = pointSize || 10;
  const stroke = pointStroke || new Stroke({
    color: 'rgba(0, 0, 0, 0.7)'
  });
  const fill = pointFill || new Fill({
    color: 'rgba(0, 153, 255, 0.8)'
  });
  const rotation = pointRotation || 0;
  switch (type) {
    case 'square':
      style = new Style({
        image: new RegularShape({
          fill,
          stroke,
          points: 4,
          radius: size,
          rotation: (rotation / 360) * Math.PI,
          angle: Math.PI / 4
        })
      });
      break;

    case 'triangle':
      style = new Style({
        image: new RegularShape({
          fill,
          stroke,
          points: 3,
          radius: size,
          rotation: (rotation / 360) * Math.PI,
          angle: 0
        })
      });
      break;

    case 'star':
      style = new Style({
        image: new RegularShape({
          fill,
          stroke,
          points: 5,
          radius: size,
          radius2: size / 2.5,
          rotation: (rotation / 360) * Math.PI,
          angle: 0
        })
      });
      break;

    case 'cross':
      style = new Style({
        image: new RegularShape({
          fill,
          stroke,
          points: 4,
          radius: size,
          radius2: 0,
          rotation: (rotation / 360) * Math.PI,
          angle: 0
        })
      });
      break;

    case 'x':
      style = new Style({
        image: new RegularShape({
          fill,
          stroke,
          points: 4,
          radius: size,
          radius2: 0,
          rotation: (rotation / 360) * Math.PI,
          angle: Math.PI / 4
        })
      });
      break;

    case 'circle':
      style = new Style({
        image: new CircleStyle({
          fill,
          stroke,
          radius: size
        })
      });
      break;

    case 'marker': {
      let fillColor = 'blue';
      let strokeColor = 'black';
      let strokeWidth = 10;
      if (fill && fill.getColor) {
        fillColor = encodeURIComponent(fill.getColor());
      }
      if (stroke && stroke.getColor) {
        strokeColor = encodeURIComponent(stroke.getColor());
      }
      if (stroke && stroke.getWidth) {
        strokeWidth = 5 * stroke.getWidth();
      }
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" height="48" viewBox="0 96 960 960" width="48"><path stroke="${strokeColor}" stroke-width="${strokeWidth}" fill="${fillColor}" d="M480 897q133-121 196.5-219.5T740 504q0-117.79-75.292-192.895Q589.417 236 480 236t-184.708 75.105Q220 386.21 220 504q0 75 65 173.5T480 897Zm0 79"/></svg>`;
      style = new Style({
        image: new Icon({
          src: `data:image/svg+xml;utf8,${svg}`,
          scale: size / 10 || 1,
          rotation: (rotation / 360) * Math.PI,
          anchor: [0.5, 0.85]
        })
      });
      break;
    }
    default:
      style = new Style({
        image: new CircleStyle({
          fill,
          stroke,
          radius: size
        })
      });
  }
  return style;
}

function formatLength(line, projection) {
  const length = getLength(line, { projection });
  let output;
  if (length > 1000) {
    output = `${Math.round((length / 1000) * 100) / 100} km`;
  } else {
    output = `${Math.round(length * 100) / 100} m`;
  }
  return output;
}

function formatArea(polygon, useHectare, projection, featureArea) {
  const area = featureArea || getArea(polygon, { projection });
  let output;
  if (area > 10000000) {
    output = `${Math.round((area / 1000000) * 100) / 100} km\xB2`;
  } else if (area > 10000 && useHectare) {
    output = `${Math.round((area / 10000) * 100) / 100} ha`;
  } else {
    output = `${Math.round(area * 100) / 100} m\xB2`;
  }
  return output;
}

function formatRadius(feat) {
  let output;
  const length = feat.getGeometry().getRadius();
  if (length > 10000) {
    output = `${Math.round((length / 1000) * 100) / 100} km`;
  } else if (length > 100) {
    output = `${Math.round(length)} m`;
  } else {
    output = `${Math.round(length * 100) / 100} m`;
  }
  return output;
}

const selectionStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.7)'
    }),
    fill: new Fill({
      color: 'rgba(0, 153, 255, 0.8)'
    })
  }),
  geometry(feature) {
    let coords;
    let pointGeometry;
    const type = feature.getGeometry().getType();
    if (type === 'Polygon') {
      coords = feature.getGeometry().getCoordinates()[0];
      pointGeometry = new MultiPoint(coords);
    } else if (type === 'MultiPolygon') {
      coords = feature.getGeometry().getCoordinates();
      const coordArr = [];
      coords.forEach(parts => {
        parts.forEach(part => {
          coordArr.push(...part);
        });
      });
      pointGeometry = new MultiPoint(coordArr);
    } else if (type === 'LineString') {
      coords = feature.getGeometry().getCoordinates();
      pointGeometry = new MultiPoint(coords);
    } else if (type === 'MultiLineString') {
      coords = feature.getGeometry().getCoordinates();
      const coordArr = [];
      coords.forEach(part => {
        coordArr.push(...part);
      });
      pointGeometry = new MultiPoint(coordArr);
    } else if (type === 'Point') {
      coords = feature.getGeometry().getCoordinates();
      pointGeometry = new Point(coords);
    } else if (type === 'MultiPoint') {
      coords = feature.getGeometry().getCoordinates();
      pointGeometry = new MultiPoint(coords);
    }
    return pointGeometry;
  }
});

const measureStyle = function measureStyle(scale = 1) {
  return new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.4)'
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.8)',
      lineDash: [10 * scale, 10 * scale],
      width: 2 * scale
    }),
    image: new CircleStyle({
      radius: 5 * scale,
      stroke: new Stroke({
        color: 'rgba(0, 0, 0, 0.7)'
      }),
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      })
    })
  });
};

const labelStyle = function labelStyle(scale = 1) {
  return new Style({
    text: new Text({
      font: `${14 * scale}px Calibri,sans-serif`,
      fill: new Fill({
        color: 'rgba(255, 255, 255, 1)'
      }),
      backgroundFill: new Fill({
        color: 'rgba(0, 0, 0, 0.7)'
      }),
      padding: [3 * scale, 3 * scale, 3 * scale, 3 * scale],
      textBaseline: 'bottom',
      offsetY: -15 * scale
    }),
    image: new RegularShape({
      radius: 8 * scale,
      points: 3,
      angle: Math.PI,
      displacement: [0, 10 * scale],
      fill: new Fill({
        color: 'rgba(0, 0, 0, 0.7)'
      })
    })
  });
};

function getLabelStyle(scale = 1) {
  return labelStyle(scale).clone();
}

const tipStyle = new Style({
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)'
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)'
    }),
    padding: [2, 2, 2, 2],
    textAlign: 'left',
    offsetX: 15
  })
});

const modifyStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.7)'
    }),
    fill: new Fill({
      color: 'rgba(0, 153, 255, 0.8)'
    })
  }),
  text: new Text({
    text: 'Dra för att ändra',
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)'
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.7)'
    }),
    padding: [2, 2, 2, 2],
    textAlign: 'left',
    offsetX: 15
  })
});

const segmentStyle = function segmentStyle(scale = 1) {
  return new Style({
    text: new Text({
      font: `${12 * scale}px Calibri,sans-serif`,
      fill: new Fill({
        color: 'rgba(255, 255, 255, 1)'
      }),
      backgroundFill: new Fill({
        color: 'rgba(0, 0, 0, 0.4)'
      }),
      padding: [2 * scale, 2 * scale, 2 * scale, 2 * scale],
      textBaseline: 'bottom',
      offsetY: -12 * scale
    }),
    image: new RegularShape({
      radius: 6 * scale,
      points: 3,
      angle: Math.PI,
      displacement: [0, 8 * scale],
      fill: new Fill({
        color: 'rgba(0, 0, 0, 0.4)'
      })
    })
  });
};

function getBufferLabelStyle(label = '', scale = 1) {
  return new Style({
    text: new Text({
      font: `${14 * scale}px Calibri,sans-serif`,
      fill: new Fill({
        color: 'rgba(255, 255, 255, 1)'
      }),
      backgroundFill: new Fill({
        color: 'rgba(0, 0, 0, 0.7)'
      }),
      padding: [3 * scale, 3 * scale, 3 * scale, 3 * scale],
      textBaseline: 'bottom',
      offsetY: -15 * scale,
      text: label
    }),
    image: new RegularShape({
      radius: 8 * scale,
      points: 3,
      angle: Math.PI,
      displacement: [0, 10 * scale],
      fill: new Fill({
        color: 'rgba(0, 0, 0, 0.7)'
      })
    }),
    geometry: (feat) => {
      const coordinates = [feat.getGeometry().getCenter()[0], feat.getGeometry().getExtent()[3]];
      return new Point(coordinates);
    }
  });
}

function getSegmentLabelStyle(line, projection, scale = 1, segmentStyles = []) {
  let count = 0;
  const style = [];
  line.forEachSegment((a, b) => {
    const segment = new LineString([a, b]);
    const segmentLabel = formatLength(segment, projection);
    if (segmentStyles.length - 1 < count) {
      segmentStyles.push(segmentStyle(scale).clone());
    }
    const segmentPoint = new Point(segment.getCoordinateAt(0.5));
    segmentStyles[count].setGeometry(segmentPoint);
    segmentStyles[count].getText().setText(segmentLabel);
    style.push(segmentStyles[count]);
    count += 1;
  });
  return style;
}

function getBufferPointStyle(scale = 1) {
  return new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)'
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.5)',
      lineDash: [10 * scale, 10 * scale],
      width: 2 * scale
    }),
    image: new CircleStyle({
      radius: 5 * scale,
      stroke: new Stroke({
        color: 'rgba(0, 0, 0, 0.7)'
      }),
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)'
      })
    }),
    geometry: (feat) => {
      const coordinates = feat.getGeometry().getCenter();
      return new Point(coordinates);
    }
  });
}

function bufferStyleFunction(feature) {
  const styleScale = feature.get('styleScale') || 1;
  const bufferLabelStyle = getBufferLabelStyle(`${formatRadius(feature)}`, styleScale);
  const pointStyle = getBufferPointStyle(styleScale);
  return [measureStyle(styleScale), bufferLabelStyle, pointStyle];
}

const measure = {
  linestring: [{
    geometry: 'endPoint',
    circle: {
      fill: {
        color: [0, 153, 255, 1]
      },
      stroke: {
        color: [0, 153, 255, 1],
        width: 1
      },
      radius: 3
    },
    text: {
      font: 'bold 13px "Helvetica Neue", Helvetica, Arial, sans-serif',
      textBaseline: 'bottom',
      textAlign: 'center',
      offsetY: -4,
      fill: {
        color: [0, 153, 255, 1]
      },
      stroke: {
        color: [255, 255, 255, 0.8],
        width: 4
      }
    }
  },
  {
    stroke: {
      color: [0, 153, 255, 1],
      width: 2
    }
  }
  ],
  polygon: [{
    fill: {
      color: [255, 255, 255, 0.4]
    },
    stroke: {
      color: [0, 153, 255, 1],
      width: 2
    },
    text: {
      font: 'bold 13px "Helvetica Neue", Helvetica, Arial, sans-serif',
      textBaseline: 'middle',
      textAlign: 'center',
      overflow: 'true',
      fill: {
        color: [0, 153, 255, 1]
      },
      stroke: {
        color: [255, 255, 255, 0.8],
        width: 4
      }
    }
  }],
  interaction: [{
    fill: {
      color: [255, 255, 255, 0.2]
    },
    stroke: {
      color: [0, 0, 0, 0.5],
      lineDash: [10, 10],
      width: 2
    },
    circle: {
      radius: 5,
      stroke: {
        color: [0, 0, 0, 0.7]
      },
      fill: {
        color: [255, 255, 255, 0.2]
      }
    },
    text: {
      font: 'bold 13px "Helvetica Neue", Helvetica, Arial, sans-serif',
      textBaseline: 'middle',
      textAlign: 'center',
      overflow: 'true',
      fill: {
        color: [0, 153, 255, 1]
      },
      stroke: {
        color: [255, 255, 255, 0.8],
        width: 4
      }
    }
  }]
};

export {
  bufferStyleFunction,
  createRegularShape,
  formatLength,
  formatArea,
  formatRadius,
  getBufferLabelStyle,
  getBufferPointStyle,
  getLabelStyle,
  getSegmentLabelStyle,
  labelStyle,
  measure,
  measureStyle,
  modifyStyle,
  segmentStyle,
  selectionStyle,
  tipStyle
};
