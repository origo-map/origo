import urlparser from '../utils/urlparser';

const layerModel = {
  v: {
    name: 'visible',
    dataType: 'boolean'
  },
  s: {
    name: 'legend',
    dataType: 'boolean'
  }
};

function PermalinkSelectFormatException(value) {
  this.name = 'PermalinkSelectFormatException';
  this.value = value;
  this.example = 'Use: #select=layer/objectid. Where layer is the name and objectid is an integer.';
  this.message = 'does not conform to the expected format.';
  this.toString = () => `${value} ${this.message} ${this.example}`;
}
// http://localhost:9966/#select=bebyggelse/45410:OBJECTID
function PermalinkSelect(s) {
  try {
    const a = s.split('/');
    const hasInt = a.filter(e => parseInt(e, 10));
    const hasStr = a.filter(t => t !== hasInt[hasInt.indexOf(t)]);
    const hasAttr = s.split(':');
    if (a.length === 2 && hasInt.length === 1 && hasStr.length === 1) {
      return {
        id: hasAttr.length === 2 ? parseInt(hasInt[0].split(':')[0], 10) : parseInt(hasInt[0], 10),
        layer: hasStr[0],
        attribute: hasAttr.length === 2 ? hasAttr[1] : 'OBJECTID'
      };
    }
    throw new PermalinkSelectFormatException(s);
  } catch (error) {
    throw new Error(error);
  }
}

// http://localhost:9966/#select=layer:bebyggelse/attributes:OBJECTID:45410,PURPOSE:7
// http://localhost:9966/#select=layer:bebyggelse/attributes:OBJECTID:45410
function PermalinkSelect2(s) {
  try {
    if (s) {
      const res = { layer: '', attributes: [] };
      const layer = s.split('/')[0];
      res.layer = layer.split(':')[1];
      const attributes = s.split('/')[1].split(',').map(e => e.replace('attributes:', ''));
      res.attributes = attributes.map((e) => {
        const k = e.split(':')[0];
        const v = e.split(':')[1];
        const o = {};
        o[k] = v;
        return o;
      });
      return res;
    }
    throw new PermalinkSelectFormatException(s);
  } catch (error) {
    throw new Error(error);
  }
}
export default {
  layers(layersStr) {
    const layers = layersStr.split(',');
    const layerObjects = {};
    layers.forEach((layer) => {
      const obj = {};
      const layerObject = urlparser.objectify(layer, {
        topmost: 'name'
      });
      Object.getOwnPropertyNames(layerObject).forEach((prop) => {
        const val = layerObject[prop];
        if (Object.prototype.hasOwnProperty.call(layerModel, prop)) {
          const attribute = layerModel[prop];
          obj[attribute.name] = urlparser.strBoolean(val);
        } else {
          obj[prop] = val;
        }
      });
      layerObjects[obj.name] = obj;
    });
    return layerObjects;
  },
  zoom(zoomStr) {
    return parseInt(zoomStr, 10);
  },
  center(centerStr) {
    const center = centerStr.split(',').map(coord => parseInt(coord, 10));
    return center;
  },
  selection(selectionStr) {
    return urlparser.strArrayify(selectionStr, {
      topmostName: 'geometryType',
      arrName: 'coordinates'
    });
  },
  feature(featureId) {
    return featureId;
  },
  pin(pinStr) {
    return urlparser.strIntify(pinStr);
  },
  map(mapStr) {
    return mapStr;
  },
  select(s) {
    return new PermalinkSelect2(s);
  },
  selectAttr(s) {
    return s;
  }
};
