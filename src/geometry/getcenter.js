/* ========================================================================
 * Copyright 2016 Origo
 * Licensed under BSD 2-Clause (https://github.com/origo-map/origo/blob/master/LICENSE.txt)
 * ======================================================================== */
"use strict";

var ol = require('openlayers');

var getCenter = function getCenter(geometry) {
    var type = geometry.getType();
    var center;
    switch (type) {
        case "Polygon":
            center = geometry.getInteriorPoint().getCoordinates();
            break;
        case "MultiPolygon":
            center = geometry.getInteriorPoints()[0].getCoordinates();
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
    return center;
}

module.exports = getCenter;
