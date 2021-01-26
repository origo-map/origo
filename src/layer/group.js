import layerGroup from 'ol/layer/Group';

const group = function group(layerOptions) {
  const groupDefault = {
    layerType: 'group',
    styleName: 'default'
  };
  const groupOptions = Object.assign(groupDefault, layerOptions);
  return new layerGroup(groupOptions);
};

export default group;
