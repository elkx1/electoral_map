import { Observable } from "../util/Observable.js";
import { MapRegion } from "./MapRegion.js";

const EventType = {
    None: 0,
    Added: 1,
    Removed: 2,
}

// This class models the selection of regions within the map
//
export class ElectionMapSelectionModel {

    constructor() {
        this._observable = new Observable();
        this._selected = {};
    }

    onChanged(func) {
        this._observable.subscribe(func);
    }

    _isRegion(region) {
        if (!(region instanceof MapRegion)) {
            return false;
        }

        var id = region.id();
        if (!(typeof id === 'string' || id instanceof String)) {
            return false;
        }

        return true;
    }

    addRegion(region) {
        if (!this._isRegion(region)) {
            throw new Error('Expected a MapRegion');
        }

        if (region.id() in this._selected) {
            return;
        }

        this._selected[region.id()] = region;
        this._notifyListeners(EventType.Added, [region]);
    }

    removeRegion(region) {
        if (!this._isRegion(region)) {
            throw new Error('Expected a MapRegion');
        }

        if (!(region.id() in this._selected)) {
            return;
        }

        delete this._selected[region.id()];
        this._notifyListeners(EventType.Removed, [region]);
    }

    setSelectedRegion(region) {
        if (region === null || region === undefined) {
            this.clear();
            return;
        }

        if (!this._isRegion(region)) {
            throw new Error('Expected a MapRegion');
        }

        var added = false;
        if (!(region.id() in this._selected)) {
            added = true;
        }

        var removedDict = {};
        Object.assign(removedDict, this._selected);
        delete removedDict[region.id()];

        this._selected = {};
        this._selected[region.id()] = region;

        var removed = Object.values(removedDict);
        if (removed.length > 0) {
            this._notifyListeners(EventType.Removed, removed);
        }

        if (added) {
            this._notifyListeners(EventType.Added, [region]);
        }
    }

    // Private; do not call externally or from tests
    _notifyListeners(type, items) {
        this._observable.notify({source: this, type: type, items: items});
    }

    getSelectedCount() {
        return Object.keys(this._selected).length;
    }

    getSelectedRegions() {
        return Object.values(this._selected);
    }

    isSelectedRegion(region) {
        if (!this._isRegion(region)) {
            throw new Error('Expected a MapRegion');
        }

        return this.isSelectedID(region.id());
    }

    isSelectedID(id) {
        return id in this._selected;
    }

    clear() {
        var removed = Object.values(this._selected);
        this._selected = {};
        this._notifyListeners(EventType.Removed, removed);
    }
}

Object.defineProperty(
    ElectionMapSelectionModel,
    'EventType',
    {
        value: EventType,
        writable: false,
    }
);
