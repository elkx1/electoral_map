import * as topojson from 'topojson-client'
import simplify from './simplify/simplify.js';

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

  static parse(date, resultsStr) {
    const lines = resultsStr.split(new RegExp("\r\n|\n"));
    if (lines.length == 0) {
      return [];
    }

    function splitLine(line) {
      // Don't care about escaping right now
      return line.split(";");
    }

    const columns = splitLine(lines[0]);
    const objects = lines.slice(1).map(splitLine).map(parts => {
      var item = {};
      for (var i = 0; i < parts.length; ++i) {
        if (i >= columns.length) {
          throw new Error("More elements found than columns in row");
        }
        item[columns[i]] = parts[i];
      }
      return item;
    })

    return new ElectionResults(date, objects);
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

  id() {
    return this._geoJSONFeature.id;
  }
}

class Map {
  constructor(date, geoJSON) {
    this.date = date;

    const mapFeatures = topojson.feature(geoJSON, geoJSON.objects.wpc).features;
    this._topoJSONFeatures = mapFeatures;
    this._regions = [];
    for (const feature of mapFeatures) {
      this._regions[feature.id] = new MapRegion(feature);
    }
  }

  getTopoJSONFeatures() {
    return this._topoJSONFeatures;
  }
  
  getRegions() { 
    return Object.values(this._regions)
  }

  getRegionNames() {
    return this.getRegions().map(region => region.name());
  }

  getRegionByGeoJSONID(id) {
    return this._regions[id];
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

class RegionNameAliasMap {
  constructor(mapsArray, electionResultsArray) {
    function getAllRegionNames(collection) {
      const superSet = new Set();
      collection.map(item => item.getRegionNames().forEach(v => superSet.add(v)));
      return superSet;
    }

    this.mapRegionNames = getAllRegionNames(mapsArray);
    this.electionDataRegionNames = getAllRegionNames(electionResultsArray);

    // Alias mapping between constituency names in election data and GeoJSON data, 
    // for items that cannot be mechanically translated
    this._manualAliases = {
      // "GeoJSONName": "ElectionName",
      // Add more aliases as needed
  
      // "Ashton under Lyne": "Ashton-under-Lyne",
      // "Surrey South West": "South West Surrey",
      "Kingston upon Hull West and Hessle": "Hull West and Hessle",
      "Kingston upon Hull East": "Hull East",
      "Kingston upon Hull North": "Hull North",
      "South Basildon and East Thurrock": "Basildon South and East Thurrock",
      "Richmond (Yorks)": "Richmond",
    };

    var remaining = new Set(this.electionDataRegionNames);
    var electionResultsRegionNameByMapRegionName = {};
    var mapRegionNameByElectionResultsRegionName = {};
    function saveMapping(mapRegionName, electionRegionName) {
      electionResultsRegionNameByMapRegionName[mapRegionName] = electionRegionName;
      mapRegionNameByElectionResultsRegionName[electionRegionName] = mapRegionName;
      remaining.delete(electionRegionName);
    }

    for (const mapRegionName of this.mapRegionNames) {
      if (remaining.has(mapRegionName)) {
        saveMapping(mapRegionName, mapRegionName);
        continue;
      }

      let potentialAliases = this.getMapRegionNamePotentialAliases(mapRegionName);
      var found = false;
      for (const alias of potentialAliases) {
        if (remaining.has(alias)) {
          saveMapping(mapRegionName, alias);
          found = true;
          break;
        }
      }

      if (!found)
      {
        throw new Error("No matching region name found in election data for map region '" + mapRegionName + "'");
      }
    }

    if (remaining.size != 0) {
      console.log("WARNING: No matching region name found in map for election data regions: " + new Array(...remaining).join(', '));
    }

    this._electionResultsRegionNameByMapRegionName = electionResultsRegionNameByMapRegionName;
    this._mapRegionNameByElectionResultsRegionName = mapRegionNameByElectionResultsRegionName;

    this.missingMapRegions = remaining;
  }

  getElectionDataRegionNameByMapRegionName(mapRegionName) {
    return this._electionResultsRegionNameByMapRegionName[mapRegionName];
  }

  getMapRegionNameByElectionDataRegionName(electionDataRegionName) {
    return this._mapRegionNameByElectionResultsRegionName[electionDataRegionName];
  }

  // Aliases between election data name and GeoJSON name
  // The GeoJSON name appears to be better so go with that normally for display
  getMapRegionNamePotentialAliases(name) {
    var aliases = [name.replaceAll("-", " ").replaceAll(",", "")];

    if (name in this._manualAliases) {
      aliases.push(this._manualAliases[name]);
    }

    const swappedEndings = [
      { "name": "North West", "has_comma": false },
      { "name": "North East", "has_comma": false },
      { "name": "South East", "has_comma": false },
      { "name": "South West", "has_comma": false },
      { "name": "Central", "has_comma": false },
      { "name": "North", "has_comma": false },
      { "name": "East", "has_comma": false },
      { "name": "South", "has_comma": false },
      { "name": "West", "has_comma": false },
      { "name": "Mid", "has_comma": false }, // Pretty mid
      { "name": "City of", "has_comma": true },
      { "name": "The", "has_comma": true },
    ];

    function swapEndings(namePart) {
      let foundAlias = null;
      for (const special of swappedEndings) {
        let specialName = special["name"]
        if (namePart.startsWith(specialName + " ")) {
          foundAlias = namePart.substring(specialName.length + 1, namePart.length) + (special["has_comma"] ? "," : "") + " " + specialName;
          break;
        }
      }
      return foundAlias;
    }

    if (name.includes("and")) {
      let partAliases = [];
      for (const part of name.split(" and ")) {
        let swapped = swapEndings(part);
        if (swapped == null) {
          partAliases.push(part);
        }
        else {
          partAliases.push(swapped);
        }
      }
      aliases.push(partAliases.join(" and "));
      aliases.push(partAliases.reverse().join(" and "));
    }
    else {
      aliases.push(swapEndings(name))
    }

    return aliases;
  }
}

export { ElectionResults, MapRegion, Map, Timeline, RegionNameAliasMap };