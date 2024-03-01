import { Timeline } from '../src/js/model/Timeline';
import * as path from 'path'
import { fileURLToPath } from 'url';
import { ElectionMapModel } from '../src/js/model/ElectionMapModel';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mapDataSets = [
    {
        date: new Date("2014-01-01"),
        paths: [
            path.join(__dirname, '../src/data/topo_westminster_parliamentary_constituencies_england_2014.json'),
            path.join(__dirname, '../src/data/topo_westminster_parliamentary_constituencies_wales_2014.json'),
            path.join(__dirname, '../src/data/topo_westminster_parliamentary_constituencies_scotland_2014.json'),
            path.join(__dirname, '../src/data/topo_westminster_parliamentary_constituencies_ni_2014.json'),
        ]
    },
    {
        date: new Date("2017-01-01"),
        paths: [
            path.join(__dirname, '../src/data/topo_westminster_parliamentary_constituencies_england_2014.json'),
            path.join(__dirname, '../src/data/topo_westminster_parliamentary_constituencies_wales_2014.json'),
            path.join(__dirname, '../src/data/topo_westminster_parliamentary_constituencies_scotland_2014.json'),
            path.join(__dirname, '../src/data/topo_westminster_parliamentary_constituencies_ni_2014.json'),
        ]
    }
];

const electionResultsDataSets = [
    { date: new Date("2010-01-01"), path: path.join(__dirname, '../src/data/electdata_2010ug.txt') },
    { date: new Date("2015-01-01"), path: path.join(__dirname, '../src/data/electdata_2015.txt') },
    { date: new Date("2017-01-01"), path: path.join(__dirname, '../src/data/electdata_2017.txt') },
    { date: new Date("2019-01-01"), path: path.join(__dirname, '../src/data/electdata_2019.txt') },
];

describe('ElectionMapModel class', () => {
    var mapTimeline = null;
    var electionResultsTimeline = null;
    var model = null;
    var raisedEvents = [];

    beforeAll(async () => {
        const promises = [
            Timeline.loadMaps(mapDataSets).then(t => mapTimeline = t),
            Timeline.loadElectionResults(electionResultsDataSets).then(t => electionResultsTimeline = t),
        ];

        await Promise.all(promises);

        model = new ElectionMapModel(mapTimeline, electionResultsTimeline);
        model.onChanged(e => raisedEvents.push(e));
    });

    function expectDataOfDates(electionResultsIndex, electionResultsDate, mapDate) {
        expect(model.getMap()?.date).toStrictEqual(mapDate);
        expect(model.getElectionResultsIndex()).toStrictEqual(electionResultsIndex);
        expect(model.getElectionResults()?.date).toStrictEqual(electionResultsDate);
    }

    test('getElectinResultsDates', () => {
        expect(model.getElectionResultsDates()).toEqual([
            new Date("2010-01-01"),
            new Date("2015-01-01"),
            new Date("2017-01-01"),
            new Date("2019-01-01"),
        ])
    });

    test('model initially has latest data', () => {
        expectDataOfDates(3, new Date("2019-01-01"), new Date("2017-01-01"));
    });

    test('set model date selects correct map and election results', () => {
        model.setDataByDate(new Date("2005-01-01"));
        expectDataOfDates(-1, undefined, undefined);

        model.setDataByDate(new Date("2010-01-01"));
        expectDataOfDates(0, new Date("2010-01-01"), undefined);

        model.setDataByDate(new Date("2015-01-01"));
        expectDataOfDates(1, new Date("2015-01-01"), new Date("2014-01-01"));

        model.setDataByDate(new Date("2020-01-01"));
        expectDataOfDates(3, new Date("2019-01-01"), new Date("2017-01-01"));
    });

    test('events when set same as current settings', () => {
        model.setDataByDate(new Date("2015-01-01"))
        raisedEvents = [];
        model.setDataByDate(new Date("2015-01-01"));
        expect(raisedEvents.length).toBe(0);
    });

    test('events when set date only', () => {
        model.setDataByDate(new Date("2015-01-01"))
        raisedEvents = [];
        model.setDataByDate(new Date("2015-01-02"));
        expect(raisedEvents[0].flags).toBe(ElectionMapModel.EventFlags.DateChanged);
    });

    test('events when set date and election results', () => {
        model.setDataByDate(new Date("2017-01-01"))
        raisedEvents = [];
        model.setDataByDate(new Date("2019-01-01"));
        expect(raisedEvents[0].flags).toBe(
            ElectionMapModel.EventFlags.DateChanged | ElectionMapModel.EventFlags.ElectionResultsChanged
        );
    });

    test('events when set date, election results and map', () => {
        model.setDataByDate(new Date("2017-01-01"))
        raisedEvents = [];
        model.setDataByDate(new Date("2015-01-01"));
        expect(raisedEvents[0].flags).toBe(
            ElectionMapModel.EventFlags.DateChanged | ElectionMapModel.EventFlags.ElectionResultsChanged | ElectionMapModel.EventFlags.MapChanged
        );
    });
});