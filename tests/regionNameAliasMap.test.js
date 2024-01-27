import { RegionNameAliasMap, ElectionResults, Map } from '../src/js/electionDataModule.js';
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const geoJSONDataSets = [
    { date: new Date("2014-01-01"), path: path.join(__dirname, '../src/data/topo_westminster_parliamentary_constituencies_2014.json') },
];

const electionResultsDataSets = [
    { date: new Date("2010-01-01"), path: path.join(__dirname, '../src/data/electdata_2010ug.txt') },
    { date: new Date("2015-01-01"), path: path.join(__dirname, '../src/data/electdata_2015.txt') },
];

describe('Map and MapRegion classes', () => {
    var regionNameAliasMap = null;

    beforeAll(async () => {
        var mapData = []
        var electionResultsData = []
        const promises = [];
        for (const dataSet of geoJSONDataSets) {
            var promise = fs.promises
                .readFile(dataSet.path)
                .then(json => JSON.parse(json.toString()))
                .then(obj => mapData.push(new Map(dataSet.date, obj)));
            promises.push(promise);
        }

        for (const dataSet of electionResultsDataSets) {
            var promise = fs.promises
                .readFile(dataSet.path)
                .then(data => electionResultsData.push(ElectionResults.parse(dataSet.date, new String(data))));
            promises.push(promise);
        }

        await Promise.all(promises);

        regionNameAliasMap = new RegionNameAliasMap(mapData, electionResultsData);
    });

    test('all loaded regions should have a bidirectional mapping', () => {
        for (const mapRegion of regionNameAliasMap.mapRegionNames) {
            const result = regionNameAliasMap.getElectionDataRegionNameByMapRegionName(mapRegion);
            expect(typeof result).toBe("string");
            expect(result.length).toBeGreaterThan(0);
            expect(regionNameAliasMap.electionDataRegionNames.has(result)).toBe(true);
        }

        for (const electionDataRegion of regionNameAliasMap.electionDataRegionNames) {
            const result = regionNameAliasMap.getMapRegionNameByElectionDataRegionName(electionDataRegion);
            if (regionNameAliasMap.missingMapRegions.has(electionDataRegion)) {
                expect(result).toBe(undefined);
            }
            else {
                expect(typeof result).toBe("string");
                expect(result.length).toBeGreaterThan(0);
                expect(regionNameAliasMap.mapRegionNames.has(result)).toBe(true);
            }
        }

        expect(regionNameAliasMap.missingMapRegions.size).toBeLessThan(regionNameAliasMap.mapRegionNames.size);
    })
});