import { getUid } from 'ol';
import getAttributes, { getAttributesAsync } from '../getattributes';
/**
 * Class that represents a selected feature �n selection manager. Wraps a feature, its layer and html visualization of attributes
 */
export default class SelectedItem {
  /**
   * Contructor for SelectedItem. Builds the content according to layer's configuration, but does not include async
   * content (related tables, attachments) as that is an async operation.
   * @param {any} feature
   * @param {any} layer
   * @param {any} map
   * @param {any} selectionGroup
   * @param {any} selectionGroupTitle
   */
  constructor(feature, layer, map, selectionGroup, selectionGroupTitle) {
    this.feature = feature;
    this.layer = layer;
    this.map = map;
    if (layer && map) {
      // Create the visual representation of this feature
      // must not fail or be async as this is called from the contructor
      this.content = getAttributes(feature, layer, map);
    }

    this.selectionGroup = selectionGroup || layer.get('name');
    this.selectionGroupTitle = selectionGroupTitle || layer.get('title');
  }

  /**
   * Builds the content including async content.
   */
  async createContentAsync() {
    this.content = await getAttributesAsync(this.feature, this.layer, this.map);
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
