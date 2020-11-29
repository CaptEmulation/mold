const { assert } = require('chai');
const chai = require('chai');
const builder = require('../lib');

const { expect } = chai;

chai.use(require('chai-as-promised'));

chai.config.includeStack = true;

describe('builder test suite', () => {
  describe('the shape of a builder', () => {
    let f; let
      d;

    beforeEach(() => {
      f = builder({
        breakfast(meat, egg, juice) {
          return `${meat} ${egg} eggs ${juice} juice`;
        },
      });
      d = f.dsl();
    });

    it('make a builder', () => {
      expect(d).to.have.keys('withMeat', 'withEgg', 'withJuice', 'getBreakfast', 'breakfast');
    });

    it('is a function', () => {
      expect(d.withMeat).to.be.a('function');
    });

    it('builder makes more builder', () => {
      expect(d.withMeat()).to.have.keys('withEgg', 'withJuice', 'getBreakfast', 'breakfast');
    });

    it('eventually exposes a service', () => {
      expect(d.withMeat().withEgg().withJuice()).to.have.keys('getBreakfast', 'breakfast');
    });

    it('which returns a value', () => {
      const dsl = d.withMeat('bacon').withEgg('scrambled').withJuice('orange');
      expect(dsl.getBreakfast()).to.equal('bacon scrambled eggs orange juice');
      expect(dsl.breakfast).to.equal('bacon scrambled eggs orange juice');
    });
  });

  describe('no dep services', () => {
    let f; let
      d;

    beforeEach(() => {
      f = builder({
        foo: () => 'bar',
      });
      d = f.dsl();
    });

    it('exists', () => {
      expect(d.getFoo()).to.equal('bar');
    });
  });

  describe('$ is implicit', () => {
    it('won\'t allow $ as a dependency', () => {
      expect(() => builder({
        $: () => 'foo',
      })).to.throw(Error);
    });

    it('$ is available as a dependency', () => {
      expect(builder({
        foo: $ => $(bar => bar),
        bar: () => 'bar',
      }).dsl().getFoo()).to.equal('bar');
    });

    it('$ ran resolve new deps', () => {
      const b = builder({
        foo: $ => $(bar => bar),
      });
      const f = b.dsl();
      b.define({
        bar: 'bar',
      });
      expect(f.foo).to.equal('bar');
    });
  });

  describe('no dsl', () => {
    it('Returns a resolver', () => {
      const b = builder({
        foo: 'foo',
      });
      expect(b.factory()(foo => foo)).to.equal('foo');
    });

    it('can still use a resolver', () => {
      const b = builder({
        foo: $ => $(bar => bar),
        bar: () => 'bar',
      });
      expect(b.factory()(foo => foo)).to.equal('bar');
    });
  });

  describe('extending', () => {
    it('can define new deps', () => {
      const b = builder({
        foo: 'foo',
      });
      const f = b.dsl();
      b.define({
        bar: foo => foo,
      });
      expect(f.$(bar => bar)).to.equal('foo');
    });
  });

  describe('multiple services', () => {
    let f;
    let d;

    beforeEach(() => {
      f = builder({
        breakfast(meat, egg, juice) {
          return `${meat} ${egg} eggs ${juice} juice`;
        },
        solids: (meat, egg) => `${meat} ${egg}`,
      });
      d = f.dsl();
    });

    it('exposing services', () => {
      let b = d.withMeat();
      expect(b).to.have.keys('withEgg', 'withJuice', 'getBreakfast', 'getSolids', 'breakfast', 'solids');
      b = b.withEgg();
      expect(b).to.have.keys('getSolids', 'withJuice', 'getBreakfast', 'breakfast', 'solids');
      b = b.withJuice();
      expect(b).to.have.keys('getBreakfast', 'getSolids', 'breakfast', 'solids');
    });

    it('inject deps', () => {
      d = f.dsl({
        meat: 'ham',
        egg: 'scrambled',
        juice: 'orange',
      });
      expect(d).to.have.keys('getBreakfast', 'getSolids', 'breakfast', 'solids');
      expect(d.getBreakfast()).to.equal('ham scrambled eggs orange juice');
    });

    it('obtain deps', () => {
      d = f.dsl({
        meat: 'ham',
        egg: 'scrambled',
        juice: 'orange',
      });
      expect(d.$(breakfast => breakfast)).to.equal('ham scrambled eggs orange juice');
    });
  });

  describe('bling', () => {
    it('obtain deps', () => {
      const f = builder({
        breakfast(meat, egg, juice) {
          return `${meat} ${egg} eggs ${juice} juice`;
        },
      }).dsl({
        meat: 'ham',
        egg: 'scrambled',
        juice: 'orange',
      });
      expect(f.$(breakfast => breakfast)).to.equal('ham scrambled eggs orange juice');
    });

    it('obtain construct instance', () => {
      const f = builder().dsl({
        meat: 'ham',
      });
      expect(f.$(meat => meat)).to.equal('ham');
    });

    it('multiple deps', () => {
      const f = builder().factory({
        meat: 'ham',
        egg: 'scrambled',
        juice: 'orange',
      });
      expect(f((meat, egg, juice) => meat + egg + juice)).to.equal('hamscrambledorange');
    });

    it('async', () => {
      const f = builder().factory({
        meat: Promise.resolve('ham'),
      });
      return expect(f(meat => meat)).to.eventually.equal('ham');
    });

    it('async failure', () => {
      const f = builder().factory({
        meat: Promise.reject(new Error('ham')),
      });
      return expect(f(meat => meat)).to.rejectedWith(Error);
    });
  });

  describe('multiple services as $inject', () => {
    let f; let d;

    beforeEach(() => {
      const breakfast = function breakfast(meat, egg, juice) {
        return `${meat} ${egg} eggs ${juice} juice`;
      };
      breakfast.$inject = ['meat', 'egg', 'juice'];
      const solids = function solids(meat, egg) {
        return `${meat} ${egg}`;
      };
      solids.$inject = ['meat', 'egg'];
      f = builder({
        breakfast,
        solids,
      });
      d = f.dsl();
    });

    it('exposing services', () => {
      let b = d.withMeat();
      expect(b).to.have.keys('withEgg', 'withJuice', 'getBreakfast', 'getSolids', 'breakfast', 'solids');
      b = b.withEgg();
      expect(b).to.have.keys('getSolids', 'withJuice', 'getBreakfast', 'breakfast', 'solids');
      b = b.withJuice();
      expect(b).to.have.keys('getBreakfast', 'getSolids', 'breakfast', 'solids');
    });

    it('inject deps', () => {
      d = f.dsl({
        meat: 'ham',
        egg: 'scrambled',
        juice: 'orange',
      });
      expect(d).to.have.keys('getBreakfast', 'getSolids', 'breakfast', 'solids');
      expect(d.getBreakfast()).to.equal('ham scrambled eggs orange juice');
    });

    it('$ ran resolve new deps', () => {
      const barProvider = bar => bar;
      barProvider.$inject = ['bar'];
      const foo = $ => $(barProvider);
      foo.$inject = ['$'];
      const b = builder({
        foo,
      });
      const g = b.dsl();
      b.define({
        bar: 'bar',
      });
      expect(g.foo).to.equal('bar');
    });
  });

  describe('multiple services as array', () => {
    let f; let d;

    beforeEach(() => {
      f = builder({
        breakfast: ['meat', 'egg', 'juice', function breakfast(meat, egg, juice) {
          return `${meat} ${egg} eggs ${juice} juice`;
        }],
        solids: ['meat', 'egg', function solids(meat, egg) {
          return `${meat} ${egg}`;
        }],
      });
      d = f.dsl();
    });

    it('exposing services', () => {
      let b = d.withMeat();
      expect(b).to.have.keys('withEgg', 'withJuice', 'getBreakfast', 'getSolids', 'breakfast', 'solids');
      b = b.withEgg();
      expect(b).to.have.keys('getSolids', 'withJuice', 'getBreakfast', 'breakfast', 'solids');
      b = b.withJuice();
      expect(b).to.have.keys('getBreakfast', 'getSolids', 'breakfast', 'solids');
    });

    it('inject deps', () => {
      d = f.dsl({
        meat: 'ham',
        egg: 'scrambled',
        juice: 'orange',
      });
      expect(d).to.have.keys('getBreakfast', 'getSolids', 'breakfast', 'solids');
      expect(d.getBreakfast()).to.equal('ham scrambled eggs orange juice');
    });

    it('$ ran resolve new deps', () => {
      const b = builder({
        foo: ['$', $ => $(['bar', bar => bar])],
      });
      const g = b.dsl();
      b.define({
        bar: 'bar',
      });
      expect(g.foo).to.equal('bar');
    });
  });

  describe('lazy dependency init', () => {
    let d;

    beforeEach(() => {
      d = builder({
        meal: (meat, veggie) => `${meat} and ${veggie}`,
        meat: (meatStyle, meatCut) => `${meatStyle} ${meatCut}`,
        veggie: (veggieStyle, vegatable) => `${veggieStyle} ${vegatable}`,
      }).dsl();
    });

    it('loads a dependency', () => {
      expect(d.withVeggieStyle('steamed')
        .withVegatable('beans')
        .withMeatCut('steak')
        .withMeatStyle('grilled')
        .getMeal())
        .to.equal('grilled steak and steamed beans');
    });
  });

  describe('async dependencies', () => {
    it('loads a dependency with all promises', () => {
      const d = builder({
        meal: (meat, veggie) => Promise.resolve(`${meat} and ${veggie}`),
        meat: (meatStyle, meatCut) => Promise.resolve(`${meatStyle} ${meatCut}`),
        veggie: (veggieStyle, vegatable) => Promise.resolve(`${veggieStyle} ${vegatable}`),
      }).dsl();
      return expect(d.withVeggieStyle('steamed')
        .withVegatable('beans')
        .withMeatCut('steak')
        .withMeatStyle('grilled')
        .getMeal())
        .to.eventually.equal('grilled steak and steamed beans');
    });

    it('loads a dependency with some promises', () => {
      const d = builder({
        meal: (meat, veggie) => `${meat} and ${veggie}`,
        meat: (meatStyle, meatCut) => Promise.resolve(`${meatStyle} ${meatCut}`),
        veggie: (veggieStyle, vegatable) => Promise.resolve(`${veggieStyle} ${vegatable}`),
      }).dsl();
      return expect(d.withVeggieStyle('steamed')
        .withVegatable('beans')
        .withMeatCut('steak')
        .withMeatStyle('grilled')
        .getMeal())
        .to.eventually.equal('grilled steak and steamed beans');
    });
  });

  describe('Errors', () => {
    it('Returns error with all missing dependencies', () => {
      const d = builder({
        breakfast(meat, egg, juice) {
          return `${meat} ${egg} eggs ${juice} juice`;
        },
        solids: (meat, egg) => `${meat} ${egg}`,
      }).dsl();
      try {
        d.getBreakfast();
        assert(true, "should not end up here")
      } catch (error) {
        expect(error).instanceof(builder.UnresolvedDependencyError)
        expect(error.missingDeps).to.deep.eq(['meat', 'egg', 'juice'])
      }
    });

    it('disallows circular dependency', () => {
      const d = builder({
        a: b => b,
        b: c => c,
        c: a => a,
      }).dsl();
      expect(d.getA).to.throw('Circular dependency error with a at a => c => b');
    })
  });
});
