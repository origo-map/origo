//import 'Origo';
import Eventer from '../../ui/utils/eventer';

const eventer = Eventer();

const changeEvent = 'change';
let list = [];

const clear = function clear() {
  list = [];
  this.dispatch(changeEvent, list);
}

const getList = function getList() {
  return list;
}

const updateList = function update(layerList) {
  list = layerList;
  this.dispatch(changeEvent, list);
}

const LayerListStore = Object.assign({}, eventer, {
  clear,
  getList,
  updateList
});

Object.freeze(LayerListStore);

export default LayerListStore;