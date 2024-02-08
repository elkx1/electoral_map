import { Timeline } from "../src/js/electionDataModule";

describe('Timeline class', () => {
  let timeline;

  beforeEach(() => {
    timeline = new Timeline();
  });

  test('should add objects to the timeline in a monotonic order', () => {
    const object1 = { date: new Date('2022-01-01') };
    const object2 = { date: new Date('2022-02-01') };
    const object3 = { date: new Date('2022-03-01') };

    timeline.addObject(object1);
    timeline.addObject(object2);
    timeline.addObject(object3);

    expect(timeline.objects).toEqual([object1, object2, object3]);
  });

  test('should throw an error for non-monotonic object addition', () => {
    const object1 = { date: new Date('2022-01-01') };
    const object2 = { date: new Date('2021-02-01') };

    timeline.addObject(object1);

    // Adding an object with a non-monotonic date should throw an error
    expect(() => timeline.addObject(object2)).toThrowError('Non-monotonic object added to Timeline');
  });

  test('should only accept Date objects', () => {
    const invalidObject = { date: '2022-01-01' }; // Not a Date object

    // Adding an invalid object should throw an error
    expect(() => timeline.addObject(invalidObject)).toThrowError('Expected an instance of Date');
  });

  test('should return the newest object whose date is less than the given date', () => {
    const object1 = { date: new Date('2022-01-01') };
    const object2 = { date: new Date('2022-02-01') };
    const object3 = { date: new Date('2022-03-01') };

    timeline.addObject(object1);
    timeline.addObject(object2);
    timeline.addObject(object3);

    expect(timeline.getObjectByDate(new Date('2021-02-15'))).toEqual(null);
    expect(timeline.getObjectByDate(new Date('2022-01-01'))).toEqual(object1);
    expect(timeline.getObjectByDate(new Date('2022-02-15'))).toEqual(object2);
    expect(timeline.getObjectByDate(new Date('2022-03-01'))).toEqual(object3);
    expect(timeline.getObjectByDate(new Date('2092-03-01'))).toEqual(object3);
  });

  test('should return dates', () => {
    timeline.addObject({ date: new Date('2022-01-01') });
    timeline.addObject({ date: new Date('2022-02-01') });
    timeline.addObject({ date: new Date('2022-03-01') });

    expect(timeline.getDates()).toEqual([
      new Date('2022-01-01'),
      new Date('2022-02-01'),
      new Date('2022-03-01'),
    ])
  });
});