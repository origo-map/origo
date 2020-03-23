import {
    ImageWMS,
    TileWMS,
    OSM
} from 'ol/source';
import GeoJSON from 'ol/format/GeoJSON';
import $ from 'jquery';
import { Component, Button, dom} from '../ui';
import config from '../../conf/printSettings';
import { getArea, getLength } from 'ol/sphere';
import Polygon from 'ol/geom/Polygon';
import LineString from 'ol/geom/LineString';
import Point from 'ol/geom/Point';
import Feature from 'ol/Feature';
import PinStyle from '../style/pin';



const Mapfishprint = function Mapfishprint(options = {}) {
    let {
        target
    } = options;

    let viewer = options.viewer;


    function convertToMapfishOptions(options) {
        let dpi = parseInt(options.dpi.split(' ')[0]);
        let scale = parseInt(options.scale.split(/[: ]/).pop());
        let layers = options.layers;
        let units = viewer.getProjection().getUnits();
        let mapfishOptions = {
            layout: options.layout,
            srs: viewer.getProjection().getCode(),
            units: viewer.getProjection().getUnits(), //TODO: Kolla upp om detta stämmer
            outputFilename: "kartutskrift",
            outputFormat: options.outputFormat,
            mapTitle: options.title,
            layers: [],
            pages: [{
                comment: "",
                mapTitle: options.title,
                center: options.center,
                scale: options.scale,
                dpi: options.dpi,
                geodetic: false
            }],
            legends: [{
                classes: [],
                name: ""
            }]
        };
        let promise = new Promise(function(resolve, reject) {
            //get name of background map
            let backgroundLayer = layers.filter(function(layer) {
                return layer.get('group') === "background";
            })[0];

            //assemble object to be pushed to layers. backgroundLayer will always contain 1 element
            if (backgroundLayer) {
                let url;
                if (backgroundLayer.getSource() instanceof TileWMS) {
                    url = fetchSourceUrl(backgroundLayer)
                }else if (backgroundLayer.getSource() instanceof ImageWMS) { //----------------------------ol
                    url = fetchSourceUrl(backgroundLayer)
                } else {
                    console.warn('Bakgrundslager är av okänd bildtyp: ', backgroundLayer.getSource());
                }
                let backgroundLayerObject = {
                    type: backgroundLayer.get('type'),
                    baseURL: url,
                    format: backgroundLayer.getSource().getParams().FORMAT,
                    layers: [backgroundLayer.getSource().getParams().LAYERS]
                };
                mapfishOptions.layers.push(backgroundLayerObject);
            } else {
                //tom
            }

            //filter background map from remaining layers.
            layers = layers.filter(function(layer) {
                return layer.get('group') !== "background" && typeof layer.get('name') !== 'undefined';
            });

            //Set existing print_theme and sublayers properties to false unless handled manually
            //ArcGIS WMS theme layers and grouplayers layers are handled manually
            layers.forEach(function(layer) {
                if (Boolean(layer.get("print_theme")) && !Boolean(layer.get("ArcGIS")) && !Boolean(layer.get("grouplayer"))) {
                    layer.set("print_theme", false);
                    layer.set("sublayers", false);
                } 
            });
            
            //return Object[] filtered by baseURL and/or type
            let wmsLayers = buildLayersObjects(layers.filter(function(layer) {
                return typeof layer.get('name') != "undefined"
            }), "WMS");
            let wfsLayers = buildLayersObjects(layers.filter(function(layer) {
                return typeof layer.get('name') != "undefined"
            }), "WFS");

            if (wmsLayers.length !== 0) {
                wmsLayers.forEach(function(layer) {
                    mapfishOptions.layers.push(layer);
                });
            }
            if (wfsLayers.length !== 0) {
                wfsLayers.forEach(function(layer) {
                    mapfishOptions.layers.push(layer);
                });
            }

            //Both pin, draw and measure are vector types, mapfish needs other properties for them
            //Current version is mapfish V2 and the styles are similar to OL2
            let measureLayer = layers.filter((layer) => layer.get('name') === "measure");
            if(measureLayer.length > 0) mapfishOptions.layers.push(measureToPrint(measureLayer))

            let pin = viewer.getFeatureinfo().getPin();
            if (pin) mapfishOptions.layers.push(pinToPrint(pin));

            let draw = viewer.getControlByName('draw')
            if(draw){
                draw = JSON.parse(draw.getState().features)
                if (draw.features.length > 0) mapfishOptions.layers.push(drawToPrint(draw))
            }

            // build legend objects and add to mapfishconfig
            let promises = getLegendInfos(layers, scale);
            Promise.all(promises).then(
                responses => responses.map((response) => {return response}), 
                error => {console.error("Error.", error)}
            ).then(
                legendInfos => {
                    layers = appendLegendInfos(layers, legendInfos);
                },
                error => {console.error("Error.", error)}
            ).finally( () => {                
                let legendArray = buildLegend(layers.filter(function(layer) {
                    return (layer.get('name').indexOf("_bk_") === -1 && layer.get('name') != "measure")
                }), scale);

                legendArray.forEach(function(obj) {
                    if (obj) mapfishOptions.legends[0].classes.push(obj);
                });

                resolve(mapfishOptions)
            });
        })
        return promise;
    }
    //determine whether layer should be printed as a theme layer by its json legend
    function appendLegendInfos (layers, legendInfos) { 
        layers = layers.map((layer) => {
            //manually handled layers will/should have sublayers at this point
            if (!layer.get("sublayers")) {
                legendInfos.forEach((info => {
                    //layer might be invisible at this scale    
                    if (info.data.Legend != null) { 
                        if (info.data.Legend[0].layerName === layer.get("name") && info.data.Legend[0].rules.length > 1) {
                            layer.set("print_theme", true);
                            layer.set("sublayers", info.data.Legend[0].rules.map( (ruleInfo) => { return {title: ruleInfo.title, rule: ruleInfo.name}}))
                        }
                    }
                }));
            }
            return layer
        })
        return layers
    }

    //Builds mapfish-friendly object to from drawn features
    function drawToPrint(draw){
        let styles = {
            "draw": {
                "fillColor": "#0099ff",
                "fillOpacity": 0.1,
                "strokeColor": "#0099ff",
                "strokeWidth": 1.5
            },
            "point": { 
                "externalGraphic":`${viewer.getUrl()}${PinStyle[0].icon.src}`,
                "graphicWidth": 25, 
                "graphicHeight": 25
            }
        };
        draw.features.forEach((feature)=>{
            if(!feature.properties)
                feature.properties = {}
            feature.properties.style = 'draw'


            if(feature.geometry.type === "Point"){
                feature.properties.style = 'point'
            }

            if(feature.properties.annonation){
                feature.properties.style = `draw-${feature.properties.annonation}`
                styles[`draw-${feature.properties.annonation}`] = {
                    "fillOpacity": 0.0,
                    "strokeOpacity": 0.0,
                    "label": feature.properties.annonation,
                    "fontColor": "#0099ff"
                }
            }
        })
        return {
            "geoJson": draw,
            "type": "vector",
            "styleProperty" : "style",
            styles
        }
    }

    function pinToPrint(pinFeature){
        let pinGeoJson = new GeoJSON().writeFeaturesObject([pinFeature]);
        pinGeoJson.features[0].properties = { "style" : "bluepin"};
        let pin = {
            "geoJson": pinGeoJson,
            "type": "vector",
            "styleProperty" : "style",
            "styles": {
              "bluepin": { 
                "externalGraphic":`${viewer.getUrl()}${pinFeature.getStyle().getImage().getSrc()}`, 
                "graphicWidth": 25, 
                "graphicHeight": 25
                }
            }
        }
        return pin;
    }

    /*Measure function from Measure control.
        Could not use it from measure control
        since it was "private"*/
    function measureFeature(feature){
        let geom = feature.getGeometry();
        let projection = viewer.getProjection()
        let output = ""
        if(geom instanceof Polygon){
            const area = getArea(geom, {
              projection
            });
            if (area > 10000000) {
              output = `${Math.round((area / 1000000) * 100) / 100} km`;
            } else if (area > 10000) {
              output = `${Math.round((area / 10000) * 100) / 100} ha`;
            } else {
              output = `${Math.round(area * 100) / 100} m`;
            }
        }
        if(geom instanceof LineString){
            const length = getLength(geom, {
              projection
            });
            if (length > 1000) {
              output = `${Math.round((length / 1000) * 100) / 100} km`;
            } else {
              output = `${Math.round(length * 100) / 100} m`;
            }
        }
        return output;
    }

    //Builds mapfish-friendly object from measure layer 
    function measureToPrint(measure){
        let geom;
        let coord;
        let coords;
        let labelAlign;
        let strokeOpacity;
        let fillOpacity;
        let xDirection;
        let features = measure[0].getSource().getFeatures();
        let styles = {
            "measure": {
                "fillColor": "#0099ff",
                "fillOpacity": 0.1,
                "strokeColor": "#0099ff",
                "strokeWidth": 1.5
            }
        };

        features.forEach((feature, index) =>{
            feature.set("style", "measure");
            geom = feature.getGeometry();

            if(geom instanceof LineString){
                coords = geom.getCoordinates();
                coord = coords.pop();
                //Align label depending on how the feature is drawn
                xDirection = coord[0]-coords.pop()[0];
                labelAlign = xDirection > 0 ? "lt" : "rt";
                strokeOpacity = fillOpacity = 1.0;
            }
            if(geom instanceof Polygon){
                coord = geom.getInteriorPoint().getCoordinates();
                labelAlign = "cm";
                strokeOpacity = fillOpacity = 0.0; 
            }

            /*Add a point for every feature in measure,
                point is used to hold label and some
                indication on where measure ended*/
            features.push(new Feature({
                geometry: new Point(coord),
                "style": `measure-${index}`
            }));

            styles[`measure-${index}`] = {
                "label": measureFeature(feature),
                "fontColor": "#0099ff",
                "pointRadius": 2,
                "fillColor": "#0099ff",
                "strokeColor": "#0099ff",
                strokeOpacity,
                fillOpacity,
                labelAlign
            }
        });

        return {
            "geoJson" : new GeoJSON().writeFeaturesObject(features),
            "type" : "vector",
            "styleProperty" : "style",
            styles
        };
    }

    function getLegendInfos(layers, scale) {
        var requests = [];
        layers.forEach(function (layer) {
            //ArcGIS WMS layers are exempt, for now, as not the same format:application/json 
            if (Boolean(layer.get('type') == 'WMS') && !Boolean(layer.get('ArcGIS')) && !Boolean(layer.get('grouplayer')) ) {
                let params;
                let url = fetchSourceUrl(layer);
                let requestUrl;
                if (!layer.get('sublayers')) { //manually handled theme layers
                    params = {
                        service: "WMS",
                        version: "1.1.0",
                        request: "GetLegendGraphic",
                        layer: layer.get("name"),
                        format: "application/json",
                        scale: scale
                    }
                    requestUrl = url + '?' + Object.keys(params).map(function (key) {return key + '=' + params[key]}).join('&')
                    requests.push(new Promise(function(resolve, reject) {
                        try {
                            fetch(requestUrl).then(response => {return response.json()}).then( json => resolve({data: json, layerName: layer.get('name')}))
                        }
                        catch(error) {
                            console.error("Error while getting legend as json: ", error)
                            reject(error)
                        }
                        
                    }));
                }
            }
        })
        return requests
        
    }

    function buildLegend(layers, scale) {
        let themeLayers = [];
        let legendObjects = layers.reduce(function(result, layer) {
            const type = layer.get('type') || "";
            let url, name;
            switch (type.toUpperCase()) {
                case "WMS":
                    url = fetchSourceUrl(layer);
                    name = layer.get('name');
                    //special case for theme layers
                    //whether ArcGIS Server WMS layers or not
                    if (layer.get('print_theme') === true) { 
                        themeLayers.push({
                            sublayers: layer.get('sublayers'),
                            title: layer.get('title'),
                            name: layer.get('name'),
                            print_theme: layer.get('print_theme'),
                            ArcGIS: layer.get('ArcGIS'),
                            url: url
                        })
                    }
                    //special case for grouped layers
                    else if (layer.get('grouplayer') === true) {
                        let sublayers = layer.get('sublayers');
                        for (let i = 0; i < sublayers.length; i++) {
                            //theme layers might be in grouped layers
                            if (sublayers[i].print_theme === true) {
                                if (!sublayers[i].url)
                                    sublayers[i].url = url;
                                themeLayers.push(sublayers[i]);
                            } else {
                                let subName = sublayers[i].title;
                                let rule = sublayers[i].rule;
                                let style = sublayers[i].style;
                                let layername = sublayers[i].name;
                                result.push({
                                    name: subName,
                                    icons: [url + '/?REQUEST=GetLegendGraphic&transparent=true&service=WMS&VERSION=1.0.0&FORMAT=image/png&LAYER=' + layername + '&STYLE=' + style + '&RULE=' + rule + '&SCALE=' + scale + '&legend_options=dpi:400']
                                })
                            }
                        }
                    }
                    //normal case, single layer
                    else {
                        result.push({
                            name: layer.get('title'),
                            icons: [url + '/?REQUEST=GetLegendGraphic&transparent=true&service=WMS&VERSION=1.0.0&FORMAT=image/png&LAYER=' + name + '&SCALE=' + scale + '&legend_options=dpi:400']
                        })
                    }
                    return result;
                    break;
                case "WFS":
                    url = fetchSourceUrl(layer);
                    name = layer.get('name');
                    result.push({
                        name: layer.get('title'),
                        icons: [url + '/?REQUEST=GetLegendGraphic&transparent=true&service=WMS&VERSION=1.0.0&FORMAT=image/png&LAYER=' + name + '&SCALE=' + scale + '&legend_options=dpi:400']
                    })
                    return result;
                    break;
                default:
                    return result;
            }
        }, []);

        //handle the cases for themelayers and add to same array as the rest of the layers
        //handle after to make sure any single layers is added before every theme layer
        themeLayers.forEach(function(layer, index) {
            let sublayers = layer.sublayers;
            let url = layer.url;
            let name = layer.name;
            //newline for some separation between theme layers
            legendObjects.push({
                name: "\n" + layer.title
            });
            if (layer.print_theme === true && !Boolean(layer.ArcGIS)) {
                for (let i = 0; i < sublayers.length; i++) {
                    let subName = sublayers[i].title;
                    let rule = sublayers[i].rule;
                    //handle if another style is specified
                    let url = layer.style ?
                        layer.url + '/?REQUEST=GetLegendGraphic&transparent=true&service=WMS&VERSION=1.0.0&FORMAT=image/png&LAYER=' + name + '&STYLE=' + layer.style + '&RULE=' + rule + '&SCALE=' + scale + '&legend_options=dpi:400' :
                        layer.url + '/?REQUEST=GetLegendGraphic&transparent=true&service=WMS&VERSION=1.0.0&FORMAT=image/png&LAYER=' + name + '&RULE=' + rule + '&SCALE=' + scale + '&legend_options=dpi:400'
                    legendObjects.push({
                        name: subName,
                        icons: [url]
                    });
                };
            } else if (layer.print_theme === true && Boolean(layer.ArcGIS)) {
                for (let i = 0; i < sublayers.length; i++) {
                    let subName = sublayers[i].title;
                    let subUrl = sublayers[i].url;
                    legendObjects.push({
                        name: subName,
                        icons: [subUrl]
                    });
                }
            }
        });

        return legendObjects;
        

        
    }

    // All urls should point to wms service, regardless if layer type is wfs
    function fetchSourceUrl(layer) {
        let url;
        switch (layer.get('type').toUpperCase()) {
            case "WMS":
                if (layer.getSource() instanceof TileWMS) {
                    url = layer.getSource().getUrls()[0];
                } else if (layer.getSource() instanceof ImageWMS) {
                    url = layer.getSource().getUrl();
                }
                if (url.charAt(0) === "/") {
                    url = config.localHost + url
                }
                return url;
                break;
            case "WFS":
                let fullUrl = viewer.getSettings().source[layer.get('sourceName')].url;
                let parsed = fullUrl.split('/');
                let result = parsed[0] + '//' + parsed[2];
                return result + '/geoserver/wms';
                break;
        }
        // return viewer.getSettings().source[sourceName].url;

    }

    /**
     * 
     * @param {(Object[])} layers 
     */
    function buildLayersObjects(inLayers, type) {
        //WFS style defaults
        let fillColor = "#FC345C",
            fillOpacity = 0.5,
            strokeColor = "#FC345C",
            strokeOpacity = 1,
            strokeWidth = 3,
            strokeLinecap = "round",
            strokeDashstyle = "solid",
            pointRadius = 10,
            pointFillColor = "#FC345C",
            externalGraphic = "",
            graphicOpacity = 1,
            labelAlign = "cm",
            labelOutlineColor = "white",
            labelOutlineWidth = 3,
            fontSize = "16",
            fontColor = "#FFFFFF",
            fontBackColor = "#000000";

        //Filter layers by type
        let layers = inLayers.filter(function(layer) {
            return layer.get("type") === type;
        });

        let printableLayers = [];
        let printIndex = null;
        switch (type) {
            case 'WMS':
                let url;
                //Build wms objects one per source
                layers.forEach(function(layer) {
                    if (layer.getSource() instanceof TileWMS) {
                        url = fetchSourceUrl(layer)
                    } else if (layer.getSource() instanceof ImageWMS) {
                        url = fetchSourceUrl(layer)
                    } else {
                        console.warn('Lagertyp stöds ej.');
                    }
                    printIndex = printableLayers.map(function(l, idx) {
                        if (l.baseURL === url) {
                            return idx
                        }
                    }).filter(function (l) {return l !=  undefined});
                    printIndex = printIndex.length > 0 ? printIndex[0] : -1;
                    if (printIndex !== -1) {
                        printableLayers[printIndex].layers.push(layer.get('name'));
                    } else {
                        printableLayers.push({
                            type: layer.get('type'),
                            baseURL: url,
                            format: layer.getSource().getParams().FORMAT,
                            layers: [layer.getSource().getParams().LAYERS],
                            opacity: layer.get('opacity')
                        });
                    }
                });
                break;
            case 'WFS':
                layers.forEach(function(layer) {
                    let projectionCode = viewer.getProjection().getCode();
                    let styleName = layer.get('styleName');

                    // Ändra på defaultvärden beroende på vad som finns i index.json (styleSettings);
                    modifyDefaultStyles(viewer.getStyleSettings()[styleName]);

                    let geojson = new GeoJSON();
                    let source = layer.getSource();
                    let features = source.getFeatures();
                    let type = layer.get('type');

                    features.forEach(function(feature) {
                        feature.setProperties({
                            '_gx_style': 0
                        });
                    });

                    let data = geojson.writeFeatures(features, {
                        featureProjection: projectionCode,
                        dataProjection: projectionCode
                    });
                    printableLayers.push({
                        type: 'vector',
                        geoJson: JSON.parse(data),
                        name: layer.get('name'),
                        version: "1",
                        styleProperty: "_gx_style",
                        styles: {
                            0: {
                                fillColor: fillColor,
                                fillOpacity: fillOpacity,
                                strokeColor: strokeColor,
                                strokeWidth: strokeWidth,
                                pointRadius: pointRadius,
                                pointFillColor: pointFillColor,
                                externalGraphic: externalGraphic,
                                graphicOpacity: graphicOpacity,
                                labelAlign: labelAlign,
                                labelOutlineColor: labelOutlineColor,
                                labelOutlineWidth: labelOutlineWidth,
                                fontSize: fontSize,
                                fontColor: fontColor,
                                fontBackColor: fontBackColor
                            }
                        }
                    });
                });
                break;
        }

        function modifyDefaultStyles(styles) {
            //based on index.json styles being defined as [[]]
            styles.forEach(function(s) {
                s.forEach(function(f) {
                    // Set fill properties if fill exists
                    if (f.hasOwnProperty('fill')) {
                        if (f.fill.hasOwnProperty('color')) {
                            fillColor = utils.rgbaToHex(f.fill.color).toUpperCase();
                        }
                        if (f.fill.hasOwnProperty('opacity')) {
                            fillOpacity = f.fill.opacity;
                        }
                    }
                    // Set stroke properties if stroke exists
                    if (f.hasOwnProperty('stroke')) {
                        if (f.stroke.hasOwnProperty('color')) {
                            strokeColor = utils.rgbaToHex(f.stroke.color).toUpperCase();
                        }
                        if (f.stroke.hasOwnProperty('opacity')) {
                            strokeOpacity = f.stroke.opacity;
                        }
                        if (f.stroke.hasOwnProperty('width')) {
                            strokeWidth = f.stroke.width;
                        }
                        if (f.stroke.hasOwnProperty('linecap')) {
                            strokeLinecap = f.stroke.linecap;
                        }
                        if (f.stroke.hasOwnProperty('dashstyle')) {
                            strokeDashstyle = f.stroke.dashstyle;
                        }
                    }
                    // Punkt-stilar?? Det verkar så.
                    if (f.hasOwnProperty('circle')) {
                        if (f.circle.hasOwnProperty('stroke')) {
                            if (f.circle.stroke.hasOwnProperty('color')) {
                                strokeColor = utils.rgbaToHex(f.circle.stroke.color);
                            }
                            if (f.circle.stroke.hasOwnProperty('width')) {
                                strokeWidth = f.circle.stroke.width;
                            }
                        }
                        if (f.circle.hasOwnProperty('fill')) {
                            if (f.circle.fill.hasOwnProperty('color')) {
                                fillColor = utils.rgbaToHex(f.circle.fill.color);
                            }
                        }
                        if (f.circle.hasOwnProperty('radius')) {
                            pointRadius = f.circle.radius;
                        }
                        if (f.circle.hasOwnProperty('color')) {
                            pointFillColor = utils.rgbaToHex(f.circle.color);
                        }
                        if (f.circle.hasOwnProperty('source')) {
                            pointSrc = f.circle.source;
                        }
                    }

                    if (f.hasOwnProperty('label')) {
                        if (f.label.hasOwnProperty('align')) {
                            labelAlign = f.label.align;
                        }
                        if (f.label.hasOwnProperty('outlineColor')) {
                            labelOutlineColor = utils.rgbaToHex(f.label.outlineColor);
                        }
                        if (f.label.hasOwnProperty('outlineWidth')) {
                            labelOutlineWidth = f.label.outlineWidth;
                        }
                    }

                    if (f.hasOwnProperty('font')) {
                        if (f.font.hasOwnProperty('size')) {
                            fontSize = f.font.size;
                        }
                        if (f.font.hasOwnProperty('color')) {
                            fontColor = utils.rgbaToHex(f.font.color);
                        }
                        if (f.font.hasOwnProperty('backColor')) {
                            fontBackColor = utils.rgbaToHex(f.font.backColor);
                        }
                    }
                    if (f.hasOwnProperty('icon')) {
                        if (f.icon.hasOwnProperty('src')) {
                            externalGraphic = f.icon.src;
                        }
                        if (f.icon.hasOwnProperty('opacity')) {
                            graphicOpacity = f.icon.opacity;
                        }
                    }
                });
            });

        }
        return printableLayers;
    }

    function executeMapfishCall(url, data) {
        let body = JSON.stringify(data);
        let progress = document.getElementById('o-dl-progress');
        let cancel = document.getElementById('o-dl-cancel');
        document.getElementById('o-dl-link').style.display = 'none';
        progress.style.display = 'inline-block';
        cancel.style.display = 'inline-block';

        let request = $.ajax({
            type: 'POST',
            url: url,
            data: body,
            contentType: 'application/json',
            dataType: 'json',
            success: function(data) {
                let url = newUrl(data.getURL);
                progress.style.display = 'none';
                cancel.style.display = 'none';
                window.open(url);
            },
            error: function(data) {
                console.warn('Error creating report: ' + data.statusText);
            }
        });
        return request;
    }

    // because mapfish can't return a dang url which isnt localhost
    function newUrl(url) {
        let basePart = config.printCreate.substr(0, config.printCreate.indexOf('/', 8))
        let mapfishPart = url.substr(url.indexOf('/', 8), url.length - 1)
        return basePart + mapfishPart
    }


    return Component({
        onAdd(evt) {
            viewer = evt.target;
        },
        printMap(settings) {
            
            let url = config.printCreate;
            let promise = new Promise(function(resolve, reject) {
                convertToMapfishOptions(settings).then(function (data) {
                    executeMapfishCall(url, data).then(function (resp){
                        resolve(resp)
                    });
                })
              });
            return promise
        },
        onInit() {},
        render() {
            this.dispatch('render');
        }
    });
};

export default Mapfishprint;