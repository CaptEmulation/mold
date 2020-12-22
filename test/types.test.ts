import { expect } from 'chai'
import factory from '../lib/factory'


const DEFAULT_STRING = 'string'
describe('#types', () => {
  it('has type', async () => {
  const f = await factory({
      string: [() => DEFAULT_STRING, 'foo'],
      number: [() => 0],
      foo: [async () => ({ bar: 'foobar' }), 'number'],

    })
  });

  describe.only('car factory', () => {
    it('has type', async () => {
      type Wheels = 'soft' | 'hard'
      type Cylinders = 2 | 4 | 6 | 8
      type Engine = { cylinders: Cylinders }
      type Car = { wheels: Wheels; engine: Engine }
      
      type CarBlueprint = {
        car: Car;
        engine: Engine;
        cylinders: Cylinders;
        wheels: Wheels;
      }
      const carBlueprint = await factory<CarBlueprint, keyof CarBlueprint>({
        car: [({ engine, wheels }) => ({ engine, wheels }), 'engine', 'wheels'],
        engine: [({ cylinders }) => ({ cylinders }), 'cylinders'],
        cylinders: [() => 6],
        wheels: [() => 'hard']
      });
      carBlueprint(({ cylinders }) => {
        expect(cylinders).to.eq(6)
      }, ['cylinders'])
      carBlueprint(({ car }) => {
        expect(car).to.deep.eq({
          engine: {
            cylinders: 6
          },
          wheels: 'hard'
        })
      }, ['car'])
    })
  })
})
