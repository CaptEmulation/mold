import chai, { assert, expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import factory from '../lib/factory';

chai.use(chaiAsPromised);
chai.config.includeStack = true;

const DEFAULT_STRING = 'string';
describe.only('#types', () => {
  describe('car factory', () => {
    it('has type', async () => {
      type Wheels = 'soft' | 'hard';
      type Cylinders = 2 | 4 | 6 | 8;
      type Engine = { cylinders: Cylinders };
      type Car = { wheels: Wheels; engine: Engine };

      type CarBlueprint = {
        car: Car;
        engine: Engine;
        cylinders: Cylinders;
        wheels: Wheels;
      };
      const { func: carBlueprint } = factory<CarBlueprint, keyof CarBlueprint>({
        car: [({ engine, wheels }) => ({ engine, wheels }), 'engine', 'wheels'],
        engine: [({ cylinders }) => ({ cylinders }), 'cylinders'],
        cylinders: [() => 6],
        wheels: [() => 'hard'],
      });
      await carBlueprint(
        ({ cylinders }) => {
          expect(cylinders).to.eq(6);
        },
        ['cylinders']
      );
      await carBlueprint(
        ({ car }) => {
          expect(car).to.deep.eq({
            engine: {
              cylinders: 6,
            },
            wheels: 'hard',
          });
        },
        ['car']
      );
    });
  });

  describe('Breakfast club', () => {
    it('obtain deps', () => {
      type Blueprint = {
        meat: string;
        egg: string;
        juice: 'orange';
        breakfast: string;
      };
      const { func, get, spread, props } = factory<Blueprint, keyof Blueprint>({
        meat: [() => 'ham'],
        egg: [() => 'scrambled'],
        juice: [() => 'orange'],
        breakfast: [
          ({ meat, egg, juice }) => `${meat} ${egg} eggs ${juice} juice`,
          'meat',
          'egg',
          'juice',
        ],
      });
      expect(func(({ breakfast }) => breakfast, ['breakfast'])).to.equal(
        'ham scrambled eggs orange juice'
      );
      expect(get('breakfast')).to.equal('ham scrambled eggs orange juice');
      const [a] = spread(['juice']);
    });
  });
});
