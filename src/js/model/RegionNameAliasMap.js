
export class RegionNameAliasMap {
    constructor(mapsArray, electionResultsArray) {
      if (!Array.isArray(mapsArray)) {
        throw new Error("maps must be an array");
      }
  
      if (!Array.isArray(electionResultsArray)) {
        throw new Error("election results must be an array");
      }
      
      function getAllRegionNames(collection) {
        const superSet = new Set();
        collection.map(item => item.getRegionNames().forEach(v => superSet.add(v)));
        return superSet;
      }
  
      this.mapRegionNames = getAllRegionNames(mapsArray);
      this.electionDataRegionNames = getAllRegionNames(electionResultsArray);
  
      // Alias mapping between constituency names in election data and GeoJSON data, 
      // for items that cannot be mechanically translated
      let manualAliases = {
        // "GeoJSONName": "ElectionName",
        // Add more aliases as needed
    
        // "Ashton under Lyne": "Ashton-under-Lyne",
        // "Surrey South West": "South West Surrey",
        "Kingston upon Hull West and Hessle": "Hull West and Hessle",
        "Kingston upon Hull East": "Hull East",
        "Kingston upon Hull North": "Hull North",
        "South Basildon and East Thurrock": "Basildon South and East Thurrock",
        "Richmond (Yorks)": "Richmond",
        "Na h-Eileanan An Iar": "Na h-Eileanan An Iar (Western Isles)",
      };
  
      // Convert all the keys to lowercase, so they can later be processed quickly
      this._manualAliases = {};
      for (const [key, value] of Object.entries(manualAliases)) {
        this._manualAliases[key.toLowerCase()] = value.toLowerCase();
      }
  
      var remaining = new Set(this.electionDataRegionNames);
      var electionResultsRegionNameByMapRegionName = {};
      var mapRegionNameByElectionResultsRegionName = {};
      function saveMapping(mapRegionName, electionRegionName) {
        electionResultsRegionNameByMapRegionName[mapRegionName] = electionRegionName;
        mapRegionNameByElectionResultsRegionName[electionRegionName] = mapRegionName;
        remaining.delete(electionRegionName);
      }
  
      function anyRemainingMatch(alias) {
        for (const remainingItem of remaining) {
          if (remainingItem.toLowerCase() === alias) {
            return remainingItem;
          }
        }
        return null;
      }
  
      for (const mapRegionName of this.mapRegionNames) {
        if (remaining.has(mapRegionName)) {
          saveMapping(mapRegionName, mapRegionName);
          continue;
        }
  
        let potentialAliases = this.getMapRegionNamePotentialAliases(mapRegionName);
        var found = false;
        for (const alias of potentialAliases) {
          // console.log(mapRegionName, "alias: " + alias)
          let match = anyRemainingMatch(alias);
          if (match) {
            saveMapping(mapRegionName, match);
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
      name = name.toLowerCase();
  
      var aliases = [name.replaceAll("-", " ").replaceAll(",", "")];
      function pushAlias(alias) {
        if (!alias) {
          throw new Error("Invalid alias generated");
        }
  
        aliases.push(alias);
      }
  
      if (name in this._manualAliases) {
        pushAlias(this._manualAliases[name]);
      }
  
      const swappedEndings = [
        { "name": "north west", "has_comma": false },
        { "name": "north east", "has_comma": false },
        { "name": "south east", "has_comma": false },
        { "name": "south west", "has_comma": false },
        { "name": "central", "has_comma": false },
        { "name": "north", "has_comma": false },
        { "name": "east", "has_comma": false },
        { "name": "south", "has_comma": false },
        { "name": "west", "has_comma": false },
        { "name": "mid", "has_comma": false }, // Pretty mid
        { "name": "city of", "has_comma": true },
        { "name": "the", "has_comma": true },
      ];
  
      function swapEndings(namePart) {
        let foundAlias = namePart;
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
        pushAlias(partAliases.join(" and "));
        pushAlias(partAliases.reverse().join(" and "));
      }
      else {
        pushAlias(swapEndings(name))
      }
  
      return aliases;
    }
}