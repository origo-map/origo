var getcenter = require('./geometry/getcenter');
var getarea = require('./geometry/getarea');

var geom = {};
geom.center = getcenter;
geom.area = getarea;

module.exports = geom;
