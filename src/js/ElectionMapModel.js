import { Observable } from "./Observable";

const EventFlags = {
    MapChanged: 1,
    ElectionResultsChanged: 2,
    DateChanged: 4,
}

export class ElectionMapModel {
    constructor(mapTimeline, electionResultsTimeline) {
        this._mapTimeline = mapTimeline;
        this._electionResultsTimeline = electionResultsTimeline;
        
        this._map = null;
        this._electionResults = null;
        this._observable = new Observable();
        this._date = null;

        var dates = electionResultsTimeline.getDates();
        if (!dates) {
            throw new Error("Election results timeline empty");
        }
        this.setDataByDate(dates[dates.length - 1]);
    }

    onChanged(func) {
        this._observable.subscribe(func);
    }

    setDataByDate(date) {
        var mapData = this._mapTimeline.getObjectByDate(date);
        var electionResults = this._electionResultsTimeline.getObjectByDate(date);
        this._setData(date, mapData, electionResults)
    }

    getMap() {
        return this._map;
    }

    getElectionResults() {
        return this._electionResults;
    }

    _setData(date, mapData, electionResults) {
        var flags = 0;

        if (this._date?.getTime() != date?.getTime()) {
            flags |= EventFlags.DateChanged;
        }

        if (this._map !== mapData) {
            flags |= EventFlags.MapChanged;
        }

        if (this._electionResults !== electionResults) {
            flags |= EventFlags.ElectionResultsChanged;
        }
        
        if (flags == 0) {
            return;
        }

        this._date = date;
        this._map = mapData;
        this._electionResults = electionResults;

        var event = {source: this, flags: flags};
        this._observable.notify(event);
    }
}

Object.defineProperty(
    ElectionMapModel,
    'EventFlags',
    {
        value: EventFlags,
        writable: false,
    }
);
