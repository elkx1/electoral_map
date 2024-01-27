const electionDataModule = require('../src/js/electionDataModule.js');

// Sample election data
const sampleData = [
    { Name: 'Aldershot', MP: 'Leo Docherty', Area: 12, County: 'Hampshire', Electorate: 72617, CON: 27980, LAB: 11282, LIB: 6920, Brexit: 0, Green: 1750, NAT: 0, MIN: 0, OTH: 0 },
    { Name: 'Aldridge-Brownhills', MP: 'Wendy Morton', Area: 7, County: 'Black Country', Electorate: 60138, CON: 27850, LAB: 8014, LIB: 2371, Brexit: 0, Green: 771, NAT: 0, MIN: 0, OTH: 336 },
    { Name: 'Altrincham and Sale West', MP: 'Graham Brady', Area: 4, County: 'Central Manchester', Electorate: 73107, CON: 26311, LAB: 20172, LIB: 6036, Brexit: 0, Green: 1566, NAT: 0, MIN: 0, OTH: 678 },
    { Name: 'Amber Valley', MP: 'Nigel Mills', Area: 8, County: 'Derbyshire', Electorate: 69976, CON: 29096, LAB: 12210, LIB: 2873, Brexit: 0, Green: 1388, NAT: 0, MIN: 0, OTH: 0 },
    { Name: 'Arundel and South Downs', MP: 'Andrew Griffith', Area: 12, County: 'West Sussex', Electorate: 81726, CON: 35566, LAB: 9722, LIB: 13045, Brexit: 0, Green: 2519, NAT: 0, MIN: 0, OTH: 556 },
];

describe('ElectionData', () => {
  let electionData;

  beforeAll(() => {
    electionData = new electionDataModule.ElectionResults(2015, sampleData);
  });

  test('should return an array of party names', () => {
    const partyNames = electionData.getPartyNames();
    expect(partyNames).toEqual(['CON', 'LAB', 'LIB', 'Brexit', 'Green', 'NAT', 'MIN', 'OTH']);
  });

  test('should return an array of region names', () => {
    const regionNames = electionData.getRegionNames();
    expect(regionNames).toEqual([
      'Aldershot',
      'Aldridge-Brownhills',
      'Altrincham and Sale West',
      'Amber Valley',
      'Arundel and South Downs',
    ]);
  });

  test('should return the winning party for a given region', () => {
    const winningParty = electionData.getWinningParty('Aldershot');
    expect(winningParty).toBe('CON');
  });

  test('should return the percentage of the vote obtained by a given party in a given region', () => {
    const percentages = electionData.getVotePercentages('Amber Valley');

    // 45497 Total
    expect(percentages[0].score).toBeCloseTo(64, 0);
    expect(percentages[1].score).toBeCloseTo(27, 0);
    expect(percentages[2].score).toBeCloseTo(6, 0);
    expect(percentages[3].score).toBeCloseTo(0, 0);
    expect(percentages[4].score).toBeCloseTo(3, 0);
    expect(percentages[5].score).toBeCloseTo(0, 0);
    expect(percentages[6].score).toBeCloseTo(0, 0);
    expect(percentages[7].score).toBeCloseTo(0, 0);
    
    expect(percentages[0].party).toBe('CON')
    expect(percentages[1].party).toBe('LAB')
  });
});