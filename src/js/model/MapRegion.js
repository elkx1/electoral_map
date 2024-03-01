import simplify from '../simplify/simplify.js';

function polygonArea(poly) {
  var area = 0;
  for (var i = 0; i < poly.length; ++i) {
    const j = (i + 1) % poly.length;
    area += poly[i][0] * poly[j][1];
    area -= poly[i][1] * poly[j][0];
  }
  return Math.abs(area);
}

function filterBadPolygons(feature) {
  function isValid(poly) {
    return !(poly.length <= 4 && poly[0] == poly[poly.length - 1]);
  }

  if (feature.geometry.type == "MultiPolygon") {
    const minPolygonArea = 1e-5;
    feature.geometry.coordinates = feature.geometry.coordinates.map(polyList => polyList.filter(poly => polygonArea(poly) > minPolygonArea));
  }
}

function simplifyMapFeature(feature) {
  // Simplifying the geometry of the map features improves render performance
  filterBadPolygons(feature);

  // todo rewrite the simplify library using my own impl of Douglas-Peucker, so we don't have
  // to swizzle this data like this

  function polygonArraysToDicts(poly) {
    return poly.map(function (point) { return { x: point[0], y: point[1] }; });
  }

  function polygonDictsToArrays(poly) {
    return poly.map(function (point) { return [point.x, point.y]; });
  }

  function simplifyPolygon(poly) {
    if (poly.length <= 4) {
      // Otherwise the Isle of Wight disappears
      return poly;
    }
    var dicts = polygonArraysToDicts(poly);
    var simplified = simplify(dicts, 0.001, true);
    var arrays = polygonDictsToArrays(simplified);
    return arrays;
  }

  // todo should do different things for multipolygon vs polygon
  if (feature.geometry.type == "MultiPolygon") {
    feature.geometry.coordinates = feature.geometry.coordinates.map(polyList => polyList.map(simplifyPolygon));
    // feature.geometry.coordinates = [];
  }
  else if (feature.geometry.type == "Polygon") {
    feature.geometry.coordinates = feature.geometry.coordinates.map(simplifyPolygon);
  }
  else {
    throw new Error("Unsupported geometry '" + feature.geometry.type + "'");
  }
}

export class MapRegion {
  constructor(geoJSONFeature) {
    this._geoJSONFeature = geoJSONFeature;

    simplifyMapFeature(this._geoJSONFeature);
  }

  geoJSON() {
    return this._geoJSONFeature;
  }
  
  name() {
    let properties = this._geoJSONFeature.properties;

    // This is specific to our current map data format; might need to change this in the future
    let valueCandidates = [
      properties.PCON13NM,
      properties.PC_NAME,
    ];

    for (const candidate of valueCandidates) {
      if (candidate) {
        return candidate;
      }
    }

    throw new Error("Missing name");
  }

  area() {
    function singleArea(poly) {
      return poly.map(polygonArea).reduce((a, b) => a + b, 0.0);
    }

    if (this._geoJSONFeature.geometry.type == "MultiPolygon") {
      return this._geoJSONFeature.geometry.coordinates.map(singleArea).reduce((a, b) => a + b, 0.0);
    }
    else {
      return singleArea(this._geoJSONFeature.geometry.coordinates);
    }
  }

  id() {
    return this._geoJSONFeature.id;
  }
}