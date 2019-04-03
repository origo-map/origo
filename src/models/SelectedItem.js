import { getUid } from "ol";
import getAttributes from '../getattributes';

export default class SelectedItem {
    constructor(feature, layer, map) {
        
        this.feature = feature;
        this.layer = layer;
        if (layer && map) {
            this.content = getAttributes(feature, layer, map);
        }
    }

    getId() {
        let id = this.feature.getId().toString();
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
}