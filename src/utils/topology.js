import Point from 'ol/geom/Point';
import { LineString } from 'ol/geom';
import { intersects } from 'ol/extent';

/**
 * "namespace" for topology functions
 * */
const topology = {

  /**
   * Intersects two line segments and returns the intersection. If lines are crossing it returns a point, if overlapping it return a line.
   * Two consecutive line segments in a linestring will always intersect in at least one point (but possibly a line if turning 180 deg).
   * @param {LineString} s1 First line
   * @param {LineString} s2 Second line
   * @returns {any} The intersecting geometry or null if not overlapping
   */
  linesegmentIntersect: function linesegmentIntersect(s1, s2) {
    // Quickly discard of the easy ones
    if (!intersects(s1.getExtent(), s2.getExtent())) {
      return null;
    }
    // Algorithm is taken from wikipedia https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection

    // Set up variables according to exactly match wikipedia to avoid errors later
    const x1 = s1.getFirstCoordinate()[0];
    const x2 = s1.getLastCoordinate()[0];
    const y1 = s1.getFirstCoordinate()[1];
    const y2 = s1.getLastCoordinate()[1];
    const x3 = s2.getFirstCoordinate()[0];
    const x4 = s2.getLastCoordinate()[0];
    const y3 = s2.getFirstCoordinate()[1];
    const y4 = s2.getLastCoordinate()[1];

    const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);

    // If denominator is 0, the lines are parallel or coincident.
    // Have to allow for some rounding errors, otherwise it will almost never hit.
    if (Math.abs(denominator) <= 0.0001) {
      // Test if we have an overlapping linesegment. This is NOT from wikipedia. Maybe it can be done smarter, OL.intersectionCoords is probably not the fastest way,
      // but it's there and this condition will rarely be hit.
      const intersectionCoords = [];
      if (s1.intersectsCoordinate(s2.getFirstCoordinate())) {
        intersectionCoords.push(s2.getFirstCoordinate());
      }
      if (s1.intersectsCoordinate(s2.getLastCoordinate())) {
        intersectionCoords.push(s2.getLastCoordinate());
      }
      if (s2.intersectsCoordinate(s1.getFirstCoordinate()) && intersectionCoords.find(el => el[0] === s1.getFirstCoordinate()[0] && el[1] === s1.getFirstCoordinate()[1]) === undefined) {
        intersectionCoords.push(s1.getFirstCoordinate);
      }

      if (s2.intersectsCoordinate(s1.getLastCoordinate()) && intersectionCoords.find(el => el[0] === s1.getLastCoordinate()[0] && el[1] === s1.getLastCoordinate()[1]) === undefined) {
        intersectionCoords.push(s1.getLastCoordinate);
      }

      // If both ends are at the same coord, it's a point (a node on a straight line)
      if (intersectionCoords.length === 1) {
        return new Point(intersectionCoords[0]);
      }
      // If we have two points, lines are overlapping
      if (intersectionCoords.length === 2) {
        return new LineString(intersectionCoords);
      }

      // No overlap at all, which would indicate parallel, as colinear segments without overlaps were disposed of by comparing envelopes earlier.
      return null;
    }

    // If we got here we must do some more calculations to see if they really intersect (the extensions of the lines will intersect, but is it within the segments?)

    const numeratorT = (x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4);
    const numeratorU = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);

    const t = numeratorT / denominator;
    const u = numeratorU / denominator;

    if (t >= 0.0 && t <= 1.0 && u >= 0.0 && u <= 1.0) {
      // They are infact intersecting. Calculate where
      // Doesn't matter which line we calculate for.
      const x = (x1 + t * (x2 - x1));
      const y = (y1 + t * (y2 - y1));
      return new Point([x, y]);
    }
    // Not intersecting
    return null;
  },

  /**
   * Tests if a linestring is self-intersecting
   * @param {LineString} linestring The Linestring to test
   * @param {boolean} lastSegementOnly If true, only the last segment is tested. Used when drawing and the line has proven valid so far.
   * @returns true if self-intersecting, fasle otherwise
   */
  isSelfIntersecting: function isSelfIntersecting(linestring, lastSegementOnly) {
    const coords = linestring.getCoordinates();

    if (coords.length < 2) {
      // Can't self-intersect, but is not a valid line
      return false;
    }
    if (coords.length === 2) {
      // Start and end is same point. Self-intersecting, and otherwise invalid.
      return coords[0][0] === coords[1][0] && coords[0][1] === coords[1][1];
    }
    // Check line in reverse and only check last segment as an option to speed up checking when drawing, as we then know that the previously drawn
    // segments are valid.
    // First segment is not tested against anything else, as all other segments are already tested against it
    const outerLoopMin = lastSegementOnly ? coords.length - 1 : 2;
    const outerLoopStart = coords.length - 1;
    for (let i = outerLoopStart; i >= outerLoopMin; i -= 1) {
      const currSeg = new LineString([coords[i], coords[i - 1]]);
      const nextSeg = new LineString([coords[i - 1], coords[i - 2]]);
      // Next segment will intersect in at least its startingpoint, but if its a line it turns 180 deg.
      if (this.linesegmentIntersect(currSeg, nextSeg) instanceof LineString) {
        return true;
      }
      // Check against the rest (if any)
      for (let j = i - 2; j > 0; j -= 1) {
        const otherSeg = new LineString([coords[j], coords[j - 1]]);
        if (this.linesegmentIntersect(currSeg, otherSeg) !== null) {
          // First segment may share one point with last segment if linestring is in fact a ring. Allow that but nothing else
          if (!(i === outerLoopStart && j === 1 && otherSeg.getCoordinates()[1][0] === currSeg.getCoordinates()[0][0] && otherSeg.getCoordinates()[1][1] === currSeg.getCoordinates()[0][1])) {
            // It wasn't first and last segment sharing a point, so it's a self intersect
            return true;
          }
        }
      }
    }
    // No evidence of self intersect found.
    return false;
  },

  /**
   * Validates a geometry. Right now it only checks first ring in first polygon for self-intersect as it is only possible to draw simple polygons and lines yet.
   * @param {any} geom The geometry to validate
   * @returns true if valid
   */
  isGeometryValid: function isGeometryValid(geom) {
    let valid;
    switch (geom.getType()) {
      case 'LineString': valid = !topology.isSelfIntersecting(geom);
        break;
      // TODO: handle holes
      case 'Polygon': valid = !topology.isSelfIntersecting(new LineString(geom.getLinearRing(0).getCoordinates()));
        break;
      // TODO: check all polygons and rings including holes and against each other
      case 'MultiPolygon': valid = !topology.isSelfIntersecting(new LineString(geom.getPolygon(0).getLinearRing(0).getCoordinates()));
        break;
      // TODO: check all linestrings and against each other
      case 'MultiLineString': valid = !topology.isSelfIntersecting(new LineString(geom.getLineString(0).getCoordinates()));
        break;
      default: valid = true;
    }
    return valid;
  },

  /**
   * Densifies a geometry by adding points along segments.
   * @param {any} geom The geometry to densify
   * @param {double} multiple Higher value means more breakpoints
   * @returns {any} geom The densified geometry
   */
  densify: function densify(geom, multiple = 1) {

    function densifyGeom(geometry, mult) {
      let maxLength = 100;
      const lineCoords = [];
      let length = geometry.getLength();
      if (length < 100) {
        maxLength = 5 / mult;
      } else if (length < 1000) {
        maxLength = 25 / mult;
      } else if (length < 10000) {
        maxLength = 50 / mult;
      }
      if (maxLength < 1) { maxLength = 1 }
      let coords = geometry.getCoordinates();
      lineCoords.push(coords[0]);
      geometry.forEachSegment(function (start, end) {
        const segment = new LineString([start, end]);
        const segmentLength = segment.getLength();
        var splits = Math.ceil(segmentLength / maxLength);
        for (let i = 1; i < splits; i++) {
          const fraction = i / splits;
          const pt = segment.getCoordinateAt(fraction)
          lineCoords.push(pt);
        }
        lineCoords.push(end);
      });
      return lineCoords;
    }

    const densified = geom.clone()
    const densifiedCoords = densifyGeom(geom, multiple);
    if (densifiedCoords) {
      densified.setCoordinates(densifiedCoords);
    }
    return densified;
  },

  /**
   * Simplifies a line geometry.
   * @param {any} geom The line geometry to simplify
   * @param {double} tolerance
   * @returns {any} geom The simplified geometry
   */
  simplify: function simplify(geom, tolerance = 1) {

    function sqSegDist(p, p1, p2) {
      let x0 = p[0],
        x1 = p1[0],
        x2 = p2[0],
        y0 = p[1],
        y1 = p1[1],
        y2 = p2[1],
        z0 = p[2] || 0,
        z1 = p1[2] || 0,
        z2 = p2[2] || 0,
        dx = x2 - x1,
        dy = y2 - y1,
        dz = z2 - z1;
      if (dx !== 0 || dy !== 0 || dz !== 0) {
        const t = ((x0 - x1) * dx + (y0 - y1) * dy + (z0 - z1) * dz) / (dx * dx + dy * dy + dz * dz);
        if (t > 1) {
          x1 = x2;
          y1 = y2;
          z1 = z2;
        } else if (t > 0) {
          x1 += dx * t;
          y1 += dy * t;
          z1 += dz * t;
        }
      }
      dx = x0 - x1;
      dy = y0 - y1;
      dz = z0 - z1;
      return dx * dx + dy * dy + dz * dz;
    }

    function simplifyDouglasPeucker(geometry, sqTolerance) {
      const points = geometry.getCoordinates();
      let len = points.length,
        pArr = new Array(len),
        first = 0,
        last = len - 1,
        stack = [],
        newPoints = [],
        i, maxSqDist, sqDist, index;
      pArr[first] = pArr[last] = 1;
      while (last) {
        maxSqDist = 0;
        for (i = first + 1; i < last; i++) {
          sqDist = sqSegDist(points[i], points[first], points[last]);
          if (sqDist > maxSqDist) {
            index = i;
            maxSqDist = sqDist;
          }
        }
        if (maxSqDist > sqTolerance) {
          pArr[index] = 1;
          stack.push(first, index, index, last);
        }
        last = stack.pop();
        first = stack.pop();
      }
      for (i = 0; i < len; i++) {
        if (pArr[i]) {
          newPoints.push(points[i]);
        }
      }
      return newPoints;
    }

    function simplifyGeom(geometry, tol) {
      const sqTolerance = tol * tol || 1;
      const points = simplifyDouglasPeucker(geometry, sqTolerance);
      return points;
    }

    const simplified = geom.clone();
    const simplifiedCoords = simplifyGeom(geom, tolerance);
    if (simplifiedCoords) {
      simplified.setCoordinates(simplifiedCoords);
    }
    return simplified;
  }
};

export default topology;
