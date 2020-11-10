import { Component, Button, dom} from '../ui';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Stroke, Style, Fill } from 'ol/style';
import { getCenter } from 'ol/extent';
import { Translate } from 'ol/interaction';
import Collection from 'ol/Collection';
import Feature from 'ol/Feature';
import { Polygon } from 'ol/geom';

const Printarea = function Printarea(options = {}) {
    let {
        target,
        printAreaColor
    } = options;

    let viewer = options.viewer;
    let map, vector, interaction;

    function _updatePreviewFeature(scale, paper, center) {
        //vector = getVector();
        let feature = _createPreviewFeature(scale, paper, center);
        vector.getSource().clear();
        vector.set('polygonFeature', feature);
        vector.getSource().addFeature(feature);
        let translate = new Translate({
            features: new Collection([feature])
        });
        map.addInteraction(translate);
    }

    function _createPreviewFeature(scale, paper, center) {
        let dpi = 25.4 / 0.28,
            ipu = 39.37,
            sf = 1,
            w = (paper.width / dpi / ipu * scale / 2) * sf,
            y = (paper.height / dpi / ipu * scale / 2) * sf,
            coords = [
                [
                    [center[0] - w, center[1] - y],
                    [center[0] - w, center[1] + y],
                    [center[0] + w, center[1] + y],
                    [center[0] + w, center[1] - y],
                    [center[0] - w, center[1] - y]
                ]
            ],
            feature = new Feature({
                geometry: new Polygon(coords)
            });
        return feature;
    }

    return Component({
        onAdd(evt) {
            viewer = evt.target;
        },
        printA1: () => {
            map = viewer.getMap();
            vector = new VectorLayer({
                group: "none",
                source: new VectorSource({
                    features: [],
                    name: 'printarea',
                    visible: true
                }),
                style: new Style({
                    stroke: new Stroke({
                        color: 'rgba(0, 0, 0, 0.7)',
                        width: 2
                    }),
                    fill: new Fill({
                        color: `${printAreaColor}`
                    })
                })
            });
            map.addLayer(vector);
            vector.setZIndex(501);
            console.log(printAreaColor);

            return vector;
        },
        getVector: () => {
            return vector;
        },
        addPreview: (scale, paper) => {
            let center;
            if (vector.getSource().getFeatures().length > 0) {
                let extent = vector.getSource().getFeatures()[0].getGeometry().getExtent();
                center = getCenter(extent);
            } else {
                center = map.getView().getCenter();
            }
            _updatePreviewFeature(scale, paper, center);
        },
        onInit() {},
        render() {
            this.dispatch('render');
        }
    });
};

export default Printarea;