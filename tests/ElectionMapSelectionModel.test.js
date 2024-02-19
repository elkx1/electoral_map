import { ElectionMapSelectionModel } from "../src/js/ElectionMapSelectionModel.js";
import { Map, MapRegion } from "../src/js/electionDataModule.js";
import * as fs from 'fs'
import * as path from 'path'
import jest from 'jest-mock'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const geoJSONFilePath = path.join(__dirname, '../src/data/topo_westminster_parliamentary_constituencies_england_2014.json');
const geoJSONFileContent = fs.readFileSync(geoJSONFilePath, 'utf8');
const geoJSON = JSON.parse(geoJSONFileContent);
const map = new Map(2022, [geoJSON]);
const regions = map.getRegions();

describe('ElectionMapSelectionModel', () => {
    let electionMapSelectionModel;

    beforeEach(() => {
        electionMapSelectionModel = new ElectionMapSelectionModel();
    });

    it('should initialize with an empty selection', () => {
        expect(electionMapSelectionModel.getSelectedCount()).toBe(0);
    });

    it('should add a region by instance', () => {
        var region = regions[0];

        electionMapSelectionModel.addRegion(region);

        expect(electionMapSelectionModel.getSelectedCount()).toBe(1);
        expect(electionMapSelectionModel.isSelectedRegion(region)).toBe(true);
    });

    it('should have a working isSelected function', () => {
        var region = regions[0];

        expect(electionMapSelectionModel.isSelectedRegion(region)).toBe(false);
        electionMapSelectionModel.addRegion(region);
        expect(electionMapSelectionModel.isSelectedRegion(region)).toBe(true);
    });
    
    it('should have a working isSelected function after setSelected', () => {
        var region = regions[0];

        expect(electionMapSelectionModel.isSelectedRegion(region)).toBe(false);
        electionMapSelectionModel.setSelectedRegion(region);
        expect(electionMapSelectionModel.isSelectedRegion(region)).toBe(true);
    });

    it('should not add a region if not a MapRegion instance', () => {
        const invalidRegion = {};

        expect(() => {
            electionMapSelectionModel.addRegion(invalidRegion);
        }).toThrow('Expected a MapRegion');

        expect(electionMapSelectionModel.getSelectedCount()).toBe(0);
    });

    it('should notify listeners when a region is added', () => {
        const listenerMock = jest.fn();

        const region = regions[0];
        electionMapSelectionModel.onChanged(listenerMock);
        electionMapSelectionModel.addRegion(region);

        expect(listenerMock).toHaveBeenCalledWith({
            source: electionMapSelectionModel,
            type: ElectionMapSelectionModel.EventType.Added,
            items: [region]
        });
    });

    it('should not notify listeners when adding an existing region', () => {
        const listenerMock = jest.fn();

        const region = regions[0];
        electionMapSelectionModel.onChanged(listenerMock);
        electionMapSelectionModel.addRegion(region);
        electionMapSelectionModel.addRegion(region);

        expect(listenerMock).toHaveBeenCalledTimes(1);
    });

    it('should remove a region', () => {
        const region = regions[0];

        electionMapSelectionModel.addRegion(region);
        electionMapSelectionModel.removeRegion(region);

        expect(electionMapSelectionModel.getSelectedCount()).toBe(0);
        expect(electionMapSelectionModel.isSelectedRegion(region)).toBe(false);
    });

    it('should not remove a region if not a MapRegion instance', () => {
        const invalidRegion = {};

        expect(() => {
            electionMapSelectionModel.removeRegion(invalidRegion);
        }).toThrow('Expected a MapRegion');
    });

    it('should notify listeners when a region is removed', () => {
        const listenerMock = jest.fn();

        const region = regions[0];
        electionMapSelectionModel.addRegion(region);
        electionMapSelectionModel.onChanged(listenerMock);
        electionMapSelectionModel.removeRegion(region);

        expect(listenerMock).toHaveBeenCalledWith({
            source: electionMapSelectionModel,
            type: ElectionMapSelectionModel.EventType.Removed,
            items: [region]
        });
    });

    it('should not notify listeners when removing a non-existing region', () => {
        const listenerMock = jest.fn();

        const nonExistingRegion = regions[0];
        electionMapSelectionModel.onChanged(listenerMock);
        electionMapSelectionModel.removeRegion(nonExistingRegion);

        expect(listenerMock).not.toHaveBeenCalled();
    });

    it('should clear items and notify of all removals', () => {
        const listenerMock = jest.fn();

        const region = regions[0];
        const region2 = regions[1];
        electionMapSelectionModel.addRegion(region);
        electionMapSelectionModel.addRegion(region2);

        electionMapSelectionModel.onChanged(listenerMock);
        electionMapSelectionModel.clear();
        expect(electionMapSelectionModel.getSelectedCount()).toBe(0);

        expect(listenerMock).toHaveBeenCalledWith({
            source: electionMapSelectionModel,
            type: ElectionMapSelectionModel.EventType.Removed,
            items: [region, region2]
        });
    });

    it('should allow setting of a single region', () => {
        const listenerMock = jest.fn();

        const region = regions[0];
        const region2 = regions[1];
        electionMapSelectionModel.addRegion(region);
        
        electionMapSelectionModel.onChanged(listenerMock);
        electionMapSelectionModel.setSelectedRegion(region2);

        expect(listenerMock).toHaveBeenCalledWith({
            source: electionMapSelectionModel,
            type: ElectionMapSelectionModel.EventType.Removed,
            items: [region]
        });

        expect(listenerMock).toHaveBeenCalledWith({
            source: electionMapSelectionModel,
            type: ElectionMapSelectionModel.EventType.Added,
            items: [region2]
        });
    });

    it('should allow setting of a single region and only notify of delta', () => {
        const listenerMock = jest.fn();

        const region = regions[0];
        const region2 = regions[1];
        electionMapSelectionModel.addRegion(region);
        electionMapSelectionModel.addRegion(region2);

        electionMapSelectionModel.onChanged(listenerMock);
        electionMapSelectionModel.setSelectedRegion(region);
        expect(electionMapSelectionModel.getSelectedCount()).toBe(1);

        expect(listenerMock).toHaveBeenCalledWith({
            source: electionMapSelectionModel,
            type: ElectionMapSelectionModel.EventType.Removed,
            items: [region2]
        });
    });

    it('setting same as current does nothing', () => {
        const listenerMock = jest.fn();

        const region = regions[0];
        electionMapSelectionModel.addRegion(region);

        electionMapSelectionModel.onChanged(listenerMock);
        electionMapSelectionModel.setSelectedRegion(region);
        expect(electionMapSelectionModel.getSelectedCount()).toBe(1);

        expect(listenerMock).not.toHaveBeenCalled();
    });

    it('setting selected to null is allowed', () => {
        const listenerMock = jest.fn();

        const region = regions[0];
        electionMapSelectionModel.addRegion(region);

        electionMapSelectionModel.onChanged(listenerMock);
        electionMapSelectionModel.setSelectedRegion(null);
        expect(electionMapSelectionModel.getSelectedCount()).toBe(0);

        expect(listenerMock).toHaveBeenCalledWith({
            source: electionMapSelectionModel,
            type: ElectionMapSelectionModel.EventType.Removed,
            items: [region]
        });
    });
});