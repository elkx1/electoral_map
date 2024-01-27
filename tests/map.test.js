import { Map, MapRegion } from '../src/js/electionDataModule.js';
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load GeoJSON from file
const geoJSONFilePath = path.join(__dirname, '../src/data/topo_westminster_parliamentary_constituencies_2014.json');
const geoJSONFileContent = fs.readFileSync(geoJSONFilePath, 'utf8');
const geoJSON = JSON.parse(geoJSONFileContent);

describe('Map and MapRegion classes', () => {
    let map;

    beforeAll(() => {
        map = new Map(2022, geoJSON);
    });

    test('should have correct date in Map class', () => {
        expect(map.date).toBe(2022);
    });

    test('should have an array of MapRegion instances in Map class', () => {
        const regions = map.regions;
        expect(regions).toBeInstanceOf(Array);
        expect(regions.length).toBeGreaterThan(0);
        expect(regions[0]).toBeInstanceOf(MapRegion);
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