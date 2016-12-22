/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');
var Viewer = require('../viewer');

var getCenter = function getCenter(geometry_in, destination, axisOrientation) {
    var geometry = geometry_in.clone();

    if (destination) {
      geometry.transform(Viewer.getMap().getView().getProjection(), destination);
    }

    var type = geometry.getType();
    var center;
    switch (type) {
        case "Polygon":
            center = geometry.getInteriorPoint().getCoordinates();
            break;
        case "MultiPolygon":
            center = geometry.getInteriorPoints().getCoordinates()[0];
            break;
        case "Point":
            center = geometry.getCoordinates();
            break;
        case "MultiPoint":
            center = geometry[0].getCoordinates();
            break;
        case "LineString":
            center = geometry.getCoordinateAt(0.5);
            break;
        case "MultiLineString":
            center = geometry.getLineStrings()[0].getCoordinateAt(0.5);
            break;
        case "Circle":
            center = geometry.getCenter();
            break;
    }

    if (axisOrientation) {
      if (axisOrientation === 'reverse') {
        center.reverse();
      }
    }

    return center;
}

module.exports = getCenter;
