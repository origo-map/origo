/* ========================================================================
 * Copyright 2016 Mälardalskartan
 * Licensed under BSD 2-Clause (https://github.com/malardalskartan/mdk/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');


module.exports = (function() {

    var white = [255, 255, 255, 1];
    var blue = [0, 153, 255, 1];
    var width = 3;

    //default edit style options
    var editStyleOptions = {
        'Point': [
            {
                "circle": {
                    "radius": 1,
                    "stroke": {
                        "color": blue,
                        "width": 0
                    },
                    "fill": {
                        "color": blue
                    }
                }
            }
        ],
        'LineString': [
            {
                'stroke': {
                    color: white,
                    width: width + 2
                }
            },
            {
                'stroke': {
                    color: blue,
                    width: width
                }
            }
        ],
        'Polygon': [
            {
                'stroke': {
                    color: white,
                    width: width + 2
                }
            },
            {
                'stroke': {
                    color: blue,
                    width: width
                }
            }
        ]
    };

    return {
        createStyleOptions: function createStyleOptions(styleParams) {
            var styleOptions = {};
            if(styleParams.hasOwnProperty('geometry')) {
                switch (styleParams.geometry) {
                    case 'centerPoint':
                        styleOptions.geometry = function(feature) {
                            var coordinates = feature.getGeometry().getInteriorPoints().getFirstCoordinate();
                            return new ol.geom.Point(coordinates);
                        }
					case 'endPoint':
                        styleOptions.geometry = function(feature) {
                            var coordinates = feature.getGeometry().getLastCoordinate();
                            return new ol.geom.Point(coordinates);
                        }
                    break;
                }
            }
            if(styleParams.hasOwnProperty('zIndex')) {
                styleOptions.zIndex = styleParams.zIndex;
            }
            if(styleParams.hasOwnProperty('fill')) {
                styleOptions.fill = new ol.style.Fill(styleParams.fill);
            }
            if(styleParams.hasOwnProperty('stroke')) {
                styleOptions.stroke = new ol.style.Stroke(styleParams.stroke);
            }
            if(styleParams.hasOwnProperty('text')) {
                styleOptions.text = new ol.style.Text(styleParams.text);
                if(styleParams.text.hasOwnProperty('fill')) {
                    styleOptions.text.setFill(new ol.style.Fill(styleParams.text.fill));
                }
                if(styleParams.text.hasOwnProperty('stroke')) {
                    styleOptions.text.setStroke(new ol.style.Stroke(styleParams.text.stroke));
                }
            }
            if(styleParams.hasOwnProperty('icon')) {
                styleOptions.image = new ol.style.Icon(styleParams.icon);
            }
            if(styleParams.hasOwnProperty('circle')) {
                styleOptions.image = new ol.style.Circle({
                    radius: styleParams.circle.radius,
                    fill: new ol.style.Fill(styleParams.circle.fill) || undefined,
                    stroke: new ol.style.Stroke(styleParams.circle.stroke) || undefined
                });
            }
            return styleOptions;
        },
        createStyleList: function createStyleList(styleOptions) {
            var styleList=[];
            //Create style for each rule
            for (var i = 0; i < styleOptions.length; i++) {
                var styleRule = [];
                var styleOption;
                //Check if rule is array, ie multiple styles for the rule
                if(styleOptions[i].constructor === Array) {
                    for(var j=0; j < styleOptions[i].length; j++) {
                        styleOption = this.createStyleOptions(styleOptions[i][j]);
                        styleRule.push(new ol.style.Style(styleOption));
                    }
                }
                //If single style for rule
                else {
                    styleOption = this.createStyleOptions(styleOptions[i]);
                    styleRule = [new ol.style.Style(styleOption)];
                }

                styleList.push(styleRule);
            }
            return styleList;
        },
        createStyleRule: function createStyle(options) {
            var styleRule = [],
            styleOption;
            if(options.constructor === Array) {
                for(var i=0; i < options.length; i++) {
                    var styleOption = this.createStyleOptions(options[i]);
                    styleRule.push(new ol.style.Style(styleOption));
                }
            }
            //If single style for rule
            else {
                styleOption = this.createStyleOptions(options);
                styleRule = [new ol.style.Style(styleOption)];
            }
            return styleRule;
        },
        styleFunction: function styleFunction(styleSettings, styleList, clusterStyleSettings, clusterStyleList) {
            var s = styleSettings;
            var fn = function(feature,resolution) {
                var scale = getScale(resolution);
                var styleL;
                //If size is larger than, it is a cluster
                var size = clusterStyleList ? feature.get('features').length : 1;
                if(size > 1 && map.getView().getResolution() != settings.resolutions[settings.resolutions.length-1]) {
                    styleL = checkOptions(feature, scale, clusterStyleSettings, clusterStyleList, size.toString());
                    // clusterStyleList[0].setText(size);
                }
                else {
                    styleL = checkOptions(feature, scale, styleSettings, styleList);
                }
                return styleL;
            }
            return fn;
        },
        createEditStyle: function createEditStyle() {
            return {
                'Point': this.createStyleRule(editStyleOptions['Point']),
                'MultiPoint': this.createStyleRule(editStyleOptions['Point']),
                'LineString': this.createStyleRule(editStyleOptions['LineString']),
                'MultiLineString': this.createStyleRule(editStyleOptions['LineString']),
                'Polygon': this.createStyleRule(editStyleOptions['Polygon']),
                'MultiPolygon': this.createStyleRule(editStyleOptions['Polygon'])
            };
        }
    }
})();
