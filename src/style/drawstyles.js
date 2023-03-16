import {
  Circle as CircleStyle,
  Fill,
  RegularShape,
  Stroke,
  Style,
  Text
} from 'ol/style';
import { getArea, getLength } from 'ol/sphere';
import { LineString, Point } from 'ol/geom';

function createRegularShape(type, size, fill, stroke) {
  let style;
  switch (type) {
    case 'square':
      style = new Style({
        image: new RegularShape({
          fill,
          stroke,
          points: 4,
          radius: size,
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
          rotation: 0,
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

function formatLength(line) {
  const length = getLength(line);
  let output;
  if (length > 1000) {
    output = `${Math.round((length / 1000) * 100) / 100} km`;
  } else {
    output = `${Math.round(length * 100) / 100} m`;
  }
  return output;
}

function formatArea(polygon, useHectare) {
  const area = getArea(polygon);
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

const measureStyle = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.4)'
  }),
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 0.8)',
    lineDash: [10, 10],
    width: 2
  }),
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.7)'
    }),
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)'
    })
  })
});

const labelStyle = new Style({
  text: new Text({
    font: '14px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)'
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.7)'
    }),
    padding: [3, 3, 3, 3],
    textBaseline: 'bottom',
    offsetY: -15
  }),
  image: new RegularShape({
    radius: 8,
    points: 3,
    angle: Math.PI,
    displacement: [0, 10],
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.7)'
    })
  })
});

function getLabelStyle() {
  return labelStyle.clone();
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
      color: 'rgba(255, 0, 0, 0.4)'
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

const segmentStyle = new Style({
  text: new Text({
    font: '12px Calibri,sans-serif',
    fill: new Fill({
      color: 'rgba(255, 255, 255, 1)'
    }),
    backgroundFill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)'
    }),
    padding: [2, 2, 2, 2],
    textBaseline: 'bottom',
    offsetY: -12
  }),
  image: new RegularShape({
    radius: 6,
    points: 3,
    angle: Math.PI,
    displacement: [0, 8],
    fill: new Fill({
      color: 'rgba(0, 0, 0, 0.4)'
    })
  })
});

function getBufferLabelStyle(label = '') {
  return new Style({
    text: new Text({
      font: '14px Calibri,sans-serif',
      fill: new Fill({
        color: 'rgba(255, 255, 255, 1)'
      }),
      backgroundFill: new Fill({
        color: 'rgba(0, 0, 0, 0.7)'
      }),
      padding: [3, 3, 3, 3],
      textBaseline: 'bottom',
      offsetY: -15,
      text: label
    }),
    image: new RegularShape({
      radius: 8,
      points: 3,
      angle: Math.PI,
      displacement: [0, 10],
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

function getSegmentLabelStyle(line, segmentStyles = []) {
  let count = 0;
  const style = [];
  line.forEachSegment((a, b) => {
    const segment = new LineString([a, b]);
    const segmentLabel = formatLength(segment);
    if (segmentStyles.length - 1 < count) {
      segmentStyles.push(segmentStyle.clone());
    }
    const segmentPoint = new Point(segment.getCoordinateAt(0.5));
    segmentStyles[count].setGeometry(segmentPoint);
    segmentStyles[count].getText().setText(segmentLabel);
    style.push(segmentStyles[count]);
    count += 1;
  });
  return style;
}

function getBufferPointStyle() {
  return new Style({
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)'
    }),
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.5)',
      lineDash: [10, 10],
      width: 2
    }),
    image: new CircleStyle({
      radius: 5,
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
  const bufferLabelStyle = getBufferLabelStyle(`${formatRadius(feature)}`);
  const pointStyle = getBufferPointStyle();
  return [measureStyle, bufferLabelStyle, pointStyle];
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
  tipStyle
};
