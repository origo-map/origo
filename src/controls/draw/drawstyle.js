const white = [255, 255, 255, 1];
const blue = [0, 153, 255, 1];
const blueSelect = [0, 153, 255, 0.1];
const width = 3;

const drawStyle = {
  draw: [{
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
  }, {
    stroke: {
      color: [0, 153, 255, 1],
      width: 3
    }
  }, {
    fill: {
      color: [255, 255, 255, 0]
    }
  }, {
    icon: {
      anchor: [0.5, 32],
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      src: 'img/png/drop_blue.png'
    }
  }],
  select: [{
    stroke: {
      color: white,
      width: width + 2
    }
  }, {
    stroke: {
      color: blue,
      width
    },
    fill: {
      color: blueSelect
    },
    circle: {
      radius: 3,
      stroke: {
        color: blue,
        width: 0
      },
      fill: {
        color: blue
      }
    }
  }],
  text: {
    text: {
      font: '20px "Helvetica Neue", Helvetica, Arial, sans-serif',
      textBaseline: 'bottom',
      textAlign: 'center',
      fill: {
        color: blue
      },
      stroke: {
        color: [255, 255, 255, 0.8],
        width: 4
      }
    }
  }
};

export default drawStyle;
