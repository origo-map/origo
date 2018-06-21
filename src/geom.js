var getcenter = require('./geometry/getcenter');
var getarea = require('./geometry/getarea');
var rad2deg = require('./geometry/rad2deg');
var deg2rad = require('./geometry/deg2rad');

var geom = {};
geom.center = getcenter;
geom.area = getarea;
geom.deg2rad = deg2rad;
geom.rad2deg = rad2deg;

module.exports = geom;
