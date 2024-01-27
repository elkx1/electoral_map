const electionDataModule = require('../src/electionDataModule.js');

const fs = require('fs');
const path = require('path');

// Load GeoJSON from file
const geoJSONFilePath = path.join(__dirname, '../data/topo_westminster_parliamentary_constituencies_2014.json');
const geoJSONFileContent = fs.readFileSync(geoJSONFilePath, 'utf8');
const geoJSON = JSON.parse(geoJSONFileContent);

describe('Map and MapRegion classes', () => {
    let map;

    beforeAll(() => {
        map = new electionDataModule.Map(2022, geoJSON);
    });

    test('should have correct date in Map class', () => {
        expect(map.date).toBe(2022);
    });

    test('should have an array of MapRegion instances in Map class', () => {
        const regions = map.regions;
        expect(regions).toBeInstanceOf(Array);
        expect(regions.length).toBeGreaterThan(0);
        expect(regions[0]).toBeInstanceOf(electionDataModule.MapRegion);
    });

    test('should have correct name in MapRegion class', () => {
        expect(map.regions[0].name()).toBe('Aldershot');
        expect(map.regions[1].name()).toBe('Aldridge-Brownhills');
        expect(map.regions.length).toBe(533);
    });

    test('should have non-empty polygons', () => {
        for (const region of map.regions) {
            expect(region.area()).toBeGreaterThan(0.0);
        }
    });
});