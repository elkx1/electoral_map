import * as fs from 'fs'
import { ElectionResults } from './ElectionResults.js';
import { Map } from './Map.js';

function readFile(path, readFileFunction = null) {
  if (!readFileFunction) {
    readFileFunction = fs.promises.readFile;
    if (!readFileFunction) {
      throw new Error("fs module not loaded");
    }
  }

  return readFileFunction(path);
}

export class Timeline {
  constructor(objects = []) {
    this.objects = [];
    objects.forEach(o => this.addObject(o));
  }

  // Adds an object to the timeline; if the object's date is non-monotonic, an exception is thrown
  addObject(object) {
    if (!object) {
      throw new Error('Invalid object');
    }

    const date = object.date;
    if (!(date instanceof Date)) {
      throw new TypeError('Expected an instance of Date');
    }

    if (this.objects.length != 0) {
      if (object.date <= this.objects[this.objects.length - 1].date) {
        throw new Error('Non-monotonic object added to Timeline (date: ' + object.date + 
          "; last object's date: " + this.objects[this.objects.length - 1].date + ')');
      }
    }
    this.objects.push(object);
  }

  getDates() {
    return this.objects.map(o => o.date);
  }

  // Returns the newest object whose date is less than the given date
  getObjectByDate(date) {
    var index = this.getObjectIndexByDate(date);
    return index < 0 ? null : this.objects[index];
  }

  getObjectByIndex(index) {
    return this.objects[index];
  }

  getObjectIndexByDate(date) {
    if (!(date instanceof Date)) {
      throw new TypeError('Expected an instance of Date');
    }

    // todo binary search

    var i = -1;
    for (const object of this.objects) {
      if (object.date > date) {
        break;
      }
      ++i;
    }

    return i;
  }

  // dataSets is an array of {date: Date, path: String} objects listing paths to 
  // map files.
  // returns a promise that will result in a new Timeline of Map objects.
  static async loadMaps(dataSets, readFileFunction = null) {
    const promises = [];
    for (const dataSet of dataSets) {
        var thisDataSetPromises = []
        for (const path of dataSet.paths) {
            var promise = readFile(path, readFileFunction)
                .then(json => JSON.parse(json.toString()));
            thisDataSetPromises.push(promise);
        }
        var promise = Promise.all(thisDataSetPromises)
            .then(mapDataItems => new Map(dataSet.date, mapDataItems));
        promises.push(promise);
    }

    return Promise.all(promises).then(objs => new Timeline(objs));
  }

  // dataSets is an array of {date: Date, path: String} objects listing paths to 
  // election results files.
  // returns a promise that will result in a new Timeline of ElectionResults objects.
  static async loadElectionResults(dataSets, readFileFunction = null) {
    var promises = []
    for (const dataSet of dataSets) {
        var promise = readFile(dataSet.path, readFileFunction)
            .then(data => ElectionResults.parse(dataSet.date, new String(data)));
        promises.push(promise);
    }

    return Promise.all(promises).then(objs => new Timeline(objs));
  }
}