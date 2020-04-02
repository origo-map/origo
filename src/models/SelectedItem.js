import { getUid } from 'ol';
import getAttributes from '../getattributes';

export default class SelectedItem {
  constructor(feature, layer, map, selectionGroup, selectionGroupTitle) {
    this.feature = feature;
    this.layer = layer;
    if (layer && map) {
      this.content = getAttributes(feature, layer, map);
    }

    this.selectionGroup = selectionGroup || layer.get('name');
    this.selectionGroupTitle = selectionGroupTitle || layer.get('title');
  }

  getId() {
    let id = this.feature.getId() ? this.feature.getId().toString() : undefined;
    if (!id) {
      id = getUid(this.feature);
    }
    return id;
  }

  getFeature() {
    return this.feature;
  }

  getLayer() {
    return this.layer;
  }

  getContent() {
    return this.content;
  }

  setFeature(feature) {
    this.feature = feature;
  }

  setLayer(layer) {
    this.layer = layer;
  }

  setContent(content) {
    this.content = content;
  }

  getSelectionGroup() {
    return this.selectionGroup;
  }

  // TODO: Maybe it is better to handle SelectionGroupTitle in selection manager instead.
  getSelectionGroupTitle() {
    return this.selectionGroupTitle;
  }
}
