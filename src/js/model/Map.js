import * as topojson from 'topojson-client'
import { MapRegion } from './MapRegion.js';

export class Map {
    constructor(date, geoJSONs) {
      this.date = date;
  
      this._regions = {};
      this._topoJSONFeatures = [];
  
      for (const geoJSON of geoJSONs) {
        const mapFeatures = topojson.feature(geoJSON, geoJSON.objects.wpc).features;
        this._topoJSONFeatures = this._topoJSONFeatures.concat(mapFeatures);
        for (const feature of mapFeatures) {
          this._regions[feature.id] = new MapRegion(feature);
        }
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