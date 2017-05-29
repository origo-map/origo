"use strict";

var measure = {
  linestring: [
    {
      'geometry': 'endPoint',
      'circle': {
        fill: {
          color: [0, 153, 255, 1]
        },
        stroke: {
          color: [0, 153, 255, 1],
          width: 1
        },
        radius: 3
      },
      'text': {
        font: 'bold 13px "Helvetica Neue", Helvetica, Arial, sans-serif',
        textBaseline: 'bottom',
        textAlign: 'center',
        offsetY: -4,
        fill: {color: [0, 153, 255, 1]},
        stroke: {color: [255, 255, 255, 0.8], width: 4}
      }
    },
    {
      'stroke': {
        color: [0, 153, 255, 1],
        width: 2
      }
    }
  ],
  polygon: [
    {
      'fill': {
        color: [255, 255, 255, 0.4]
      },
      'stroke': {
        color: [0, 153, 255, 1],
        width: 2
      },
      'text': {
        font: 'bold 13px "Helvetica Neue", Helvetica, Arial, sans-serif',
        textBaseline: 'middle',
        textAlign: 'center',
        fill: {color: [0, 153, 255, 1]},
        stroke: {color: [255, 255, 255, 0.8], width: 4}
      }
    }
  ],
  interaction: [
    {
      'fill': {
        color: [255, 255, 255, 0.2]
      },
      'stroke': {
        'color': [0, 0, 0, 0.5],
        'lineDash': [10, 10],
        'width': 2
      },
      'circle': {
        'radius': 5,
        'stroke': {
          'color': [0, 0, 0, 0.7]
        },
        'fill': {
          color: [255, 255, 255, 0.2]
        }
      }
    }
  ]
};

module.exports = measure;
