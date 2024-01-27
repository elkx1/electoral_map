const topojson = require('topojson-client');
const simplify = require('../lib/simplify/simplify.js');

class ElectionResults {
  constructor(date, results) {
    this.date = date;
    this.results = results;

    this._partyNames = results.length == 0 ? [] : Object.keys(results[0]).filter(
      col => col !== 'Name' && col !== 'MP' && col !== 'Area' && col !== 'County' && col !== 'Electorate'
    );

    this._regionNames = results.map(item => item.Name);

    this._winningParties = {};
    this._votes = {};
    this._votesPercent = {};

    results.forEach(result => {
      const regionName = result.Name;
      const partyScores = this._partyNames.map(party => ({ party, score: parseInt(result[party]) }));

      const winningParty = partyScores.reduce((prev, current) => (prev.score > current.score ? prev : current)).party;
      this._winningParties[regionName] = winningParty;

      this._votes[regionName] = partyScores;

      const votesTotal = partyScores.reduce((a, b) => a + b.score, 0);

      const votesPercent = partyScores.map(function (v) {
        return { "party": v.party, "score": v.score / votesTotal * 100 };
      });
      this._votesPercent[regionName] = votesPercent;

      // console.log("Winnning party for " + regionName + ": " + winningParty)
    });
  }

  getPartyNames() {
    return this._partyNames;
  }

  getRegionNames() {
    return this._regionNames;
  }

  getWinningParty(regionName) {
    return this._winningParties[regionName];
  }

  getVotePercentages(regionName) {
    return this._votesPercent[regionName];
  }

  getVotes(regionName) {
    return this._votes[regionName];
  }
}

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

class MapRegion {
  constructor(geoJSONFeature) {
    this._geoJSONFeature = geoJSONFeature;

    simplifyMapFeature(this._geoJSONFeature);
  }

  name() {
    // This is specific to our current map data format; might need to change this in the future
    return this._geoJSONFeature.properties.PCON13NM;
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
}

class Map {
  constructor(date, geoJSON) {
    this.date = date;

    const mapFeatures = topojson.feature(geoJSON, geoJSON.objects.wpc).features;
    this.regions = [];
    for (const feature of mapFeatures) {
      this.regions.push(new MapRegion(feature));
    }
  }
}

class Timeline {
  constructor() {
    this.objects = [];
  }

  // Adds an object to the timeline; if the object's date is non-monotonic, an exception is thrown
  addObject(object) {
    const date = object.date;
    if (!(date instanceof Date)) {
      throw new TypeError('Expected an instance of Date');
    }
    
    if (this.objects.length != 0) {
      if (object.date <= this.objects[this.objects.length - 1].date) {
        throw new Error('Non-monotonic object added to Timeline');
      }
    }
    this.objects.push(object);
  }

  // Returns the newest object whose date is less than the given date
  getObjectByDate(date) {
    if (!(date instanceof Date)) {
      throw new TypeError('Expected an instance of Date');
    }

    // todo binary search

    var last = null;
    for (const object of this.objects) {
      if (object.date > date) {
        break;
      }
      last = object;
    }

    return last;
  }
}

module.exports = {
  ElectionResults: ElectionResults,
  MapRegion: MapRegion,
  Map: Map,
  Timeline: Timeline,
};