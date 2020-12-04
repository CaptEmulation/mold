import union from 'lodash.union'
import difference from 'lodash.difference'
import getParameterNames from '@captemulation/get-parameter-names'

type CallableFactory<R,
  T0 = any,
  T1 = any,
  T2 = any,
  T3 = any,
  T4 = any,
  T5 = any,
  T6 = any,
  T7 = any,
  T8 = any,
  T9 = any,
> = (
  a0?: T0, 
  a1?: T1,
  a2?: T2, 
  a3?: T3,
  a4?: T4, 
  a5?: T5,
  a6?: T6, 
  a7?: T7,
  a8?: T8, 
  a9?: T9,
) => R


type AngularFunctionProvider<R,
  O extends { [key: string]: any }, D extends Extract<keyof O, string>,
  D0 extends D = never, T0 = void,
  D1 extends D = never, T1 = void,
  D2 extends D = never, T2 = void,
  D3 extends D = never, T3 = void,
  D4 extends D = never, T4 = void,
  D5 extends D = never, T5 = void,
  D6 extends D = never, T6 = void,
  D7 extends D = never, T7 = void,
  D8 extends D = never, T8 = void,
  D9 extends D = never, T9 = void,
> = CallableFactory<R, T0, T1, T2, T3, T4, T5, T6, T7, T8, T9> & {
  $inject: Exclude<D0 | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9, never>[]
}
type MinifiableProvider<R,
  O extends { [key: string]: any }, D extends Extract<keyof O, string>,
  T0 = any,
  T1 = any,
  T2 = any,
  T3 = any,
  T4 = any,
  T5 = any,
  T6 = any,
  T7 = any,
  T8 = any,
  T9 = any,
  T extends D[] = D[]
> = [...T, (
  a0?: T0, 
  a1?: T1,
  a2?: T2, 
  a3?: T3,
  a4?: T4, 
  a5?: T5,
  a6?: T6, 
  a7?: T7,
  a8?: T8, 
  a9?: T9,
) => R ]

export type Provider<
  R,
  O extends { [key: string]: any }, D extends Extract<keyof O, string>,
  D0 extends D = never,
  D1 extends D = never,
  D2 extends D = never,
  D3 extends D = never,
  D4 extends D = never,
  D5 extends D = never,
  D6 extends D = never,
  D7 extends D = never,
  D8 extends D = never,
  D9 extends D = never,
  T0 = O[D0],
  T1 = O[D1],
  T2 = O[D2],
  T3 = O[D3],
  T4 = O[D4],
  T5 = O[D5],
  T6 = O[D6],
  T7 = O[D7],
  T8 = O[D8],
  T9 = O[D9]
> = MinifiableProvider<R, O, D, T0, T1, T2, T3, T4, T5, T6, T7, T8, T9> | AngularFunctionProvider<R, O, D, D0, T0, D1, T1, D2, T2, D3, T3, D4, T4, D5, T5, D6, T6, D7, T7, D8, T8, D9, T9> | ((
  a0?: T0, 
  a1?: T1,
  a2?: T2, 
  a3?: T3,
  a4?: T4, 
  a5?: T5,
  a6?: T6, 
  a7?: T7,
  a8?: T8, 
  a9?: T9,
) => R)

export type InputDeps<O extends { [key: string]: any}, I extends Extract<keyof O, string>> = { [key: string]: Provider<O[I], O, I> }
type Service<D extends string>  = { loading?: boolean, dependencies: D[], provider: Function }
type ServiceDeps<D extends string>  = { [key in D]: Service<D> }
type ServiceDeps2<D extends {}>  = { [key in Extract<keyof D, string>]: D[key] extends () => any ? ReturnType<D[key]> : D[key] }

type Factory<
  R,
  O extends { [key: string]: any }, D extends Extract<keyof O, string>,
  D0 extends D = never,
  D1 extends D = never,
  D2 extends D = never,
  D3 extends D = never,
  D4 extends D = never,
  D5 extends D = never,
  D6 extends D = never,
  D7 extends D = never,
  D8 extends D = never,
  D9 extends D = never,
  T0 = O[D0],
  T1 = O[D1],
  T2 = O[D2],
  T3 = O[D3],
  T4 = O[D4],
  T5 = O[D5],
  T6 = O[D6],
  T7 = O[D7],
  T8 = O[D8],
  T9 = O[D9]
> = (
  a0?: T0, 
  a1?: T1,
  a2?: T2, 
  a3?: T3,
  a4?: T4, 
  a5?: T5,
  a6?: T6, 
  a7?: T7,
  a8?: T8, 
  a9?: T9,
) => R

// type Factory<D extends string, R = any, 
//   D0 extends D = never, T0 = void,
//   D1 extends D = never, T1 = void,
//   D2 extends D = never, T2 = void,
//   D3 extends D = never, T3 = void,
//   D4 extends D = never, T4 = void,
//   D5 extends D = never, T5 = void,
//   D6 extends D = never, T6 = void,
//   D7 extends D = never, T7 = void,
//   D8 extends D = never, T8 = void,
//   D9 extends D = never, T9 = void,
// > = (deps: Provider<Exclude<D0 | D1 | D2 | D3 | D4 | D5 | D6 | D7 | D8 | D9, never>, R>) => R

type Resolver<D extends string> = (name: string, loading: D[], service: ServiceDeps<D>[D]) => () => any

export class UnresolvedDependencyError extends Error {
  public missingDeps: string[];

  constructor(message: string, missingDeps: string[]) {
    super(message);
    this.missingDeps = missingDeps;
  }
}

function upperFirst(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function camelPrepend(prefix: string, name: string) {
  const ret = `${prefix}${upperFirst(name)}`;
  return ret;
}

function isFunction(func: any): func is Function{
  return typeof func === 'function';
}

function isUndefined(t: any): t is undefined {
  return typeof t === 'undefined';
}

function getDeps<R, O extends { [key: string]: any }, D extends Extract<keyof O, string>>(_provider: Provider<R, O, D>) {
  let provider = isFunction(_provider) ? _provider : () => _provider;
  let dependencies: D[];

  if (Array.isArray(_provider)) { // Array style
    provider = _provider.pop() as CallableFactory<any>;
    dependencies = _provider as D[];
  } else if ((_provider as AngularFunctionProvider<R, O, D>).$inject) {
    dependencies = (_provider as AngularFunctionProvider<R, O, D>).$inject; // $inject Angular style
  } else { // Code parse only style
    dependencies = getParameterNames(provider) as D[];
  }
  return {
    dependencies,
    provider,
  };
}

function constructFactories<T extends { [key: string]: any}, D extends Extract<keyof T, string>, T1 extends { [key: string]: any}, D1 extends Extract<keyof T1, string>>(input: InputDeps<T, D>, serviceMap: ServiceDeps<D1>) {
  let $: <R>(provider: Provider<R, T | T1, D | D1>) => any;
  const deps: InputDeps<T, D> = input || {};
  /**
   * Returns a function with attempts to load a service.
   *  - cached value of service will be used if already resolved
   *  - unitialized dependencies will be loaded
   *  - circular dependencies will cause error
   */
  function resolver(name: string, loading: (D | D1 | '$')[], service: ServiceDeps<D | D1>[D | D1]) {
    let singleton: any;
    return function serviceResolve() {
      if (!singleton) {
        if (!service) {
          throw new Error('Service not defined')
        }
        if (service.loading) {
          throw new Error(`Circular dependency error with ${name} at ${loading.join(' => ')}`);
        }
        service.loading = true;
        
        // Resolved dependencies
        const args: any[] = [];
        // Unresolved dependencies
        const unresolvedArgs: (D | D1)[] = [];

        // Iterate through dependencies
        service.dependencies.forEach((dep) => {
          // If not defined but has a service provider, then resolve that
          if (
            isUndefined(deps[dep])
            // @ts-ignore
            && serviceMap[dep]
            // @ts-ignore
            && isFunction(serviceMap[dep].provider)
          ) {
            const newflattenedDeps = [dep, ...loading]
            // Recursively resolve the dependency and save
            // @ts-ignore
            deps[dep] = resolver(dep, newflattenedDeps, serviceMap[dep])();
          }
          if (dep === '$' && !deps[dep]) {
            // @ts-ignore for now....
            deps[dep] = $;
          }
          
          if (Object.prototype.hasOwnProperty.call(deps, dep)) {
            args.push(deps[dep]);
          } else {
            // uh-oh... unresolved dependency
            unresolvedArgs.push(dep);
          }
        });
        
        if (unresolvedArgs.length) {
          throw new UnresolvedDependencyError(`Failed to resolve ${unresolvedArgs.join(', ')} from ${Object.keys(deps)} at ${loading.join(' => ')}`, unresolvedArgs);
        }

        const isAsync = !!args.filter(
          arg => arg instanceof Promise || (arg && isFunction(arg.then)),
        ).length;
        if (isAsync) {
          singleton = Promise.all(args).then((resolvedArgs) => {
            service.loading = false;
            return service.provider.apply(null, resolvedArgs);
          });
        } else {
          service.loading = false;
          singleton = service.provider.apply(null, args);
        }
      }

      return singleton;
    };
  }

  $ = <R>(provider: Provider<R, T | T1, D>) => resolver('$', ['$'], getDeps(provider))();
  return [$, resolver] as [typeof $, typeof resolver];
}

function createFactory<T extends Provider<string, any>, D extends Extract<keyof T, string>>(services: InputDeps<T, D>) {
  const serviceMap = {} as ServiceDeps<D>;

  function decorateWithSetters(
    $: (provider: Provider<D, any>) => any,
    dsl: (input?: InputDeps<T, D>) => any,
    deps: InputDeps<T, D>,
    resolver: Resolver<D>,
  ) {
    // Find the dependencies not yet defined in deps
    // Find the union set of all dependencies
    // Get an array of all dependency arrays
    const flattenedDeps = union(...Object.values<{ dependencies: D[] }>(serviceMap).map(v => v.dependencies));
    const serviceKeys = Object.keys(serviceMap) as D[];
    const remaining = difference(flattenedDeps, Object.keys(deps)) as D[];

    // Create an object to satify the remaining dependencies
    const retFactory = remaining.reduce((prev: any, dep: string) => {
      prev[camelPrepend('with', dep)] = (param: any) => {
        return dsl({
          ...deps,
          [dep]: param
        } as InputDeps<T, D>);
      };
      return prev;
    }, {} as any);

    // Append services
    Object.defineProperties(retFactory,
      serviceKeys
        .reduce((memo, serviceName) => {
          const service = serviceMap[serviceName];

          const getter = resolver(serviceName, [serviceName], service);
          memo[serviceName] = {
            get() {
              return getter();
            },
            enumerable: serviceName !== '$',
            configurable: false,
          };
          if (serviceName !== '$') {
            // @ts-ignore Not sure if this is possible in Typescript....
            memo[camelPrepend('get', serviceName)] = {
              value: getter,
              enumerable: true,
              configurable: false,
            };
          }
          return memo;
        }, {} as { [key in D]: any }));
    Object.defineProperties(retFactory, {
      $: {
        value: $,
        enumerable: false,
        configurable: false,
      },
    });
    return retFactory;
  }

  const factory = {
    define<T1 extends { [key: string]: any}, D1 extends Extract<keyof T1, string>>(moreServices: InputDeps<T1, D1>) {
      // eslint-disable-next-line no-restricted-syntax
      for (const [key, service] of Object.entries<any>(moreServices)) {
        if (key === '$') {
          throw new Error('$ is a reserved internal dependency for factory functions');
        }
        const name: D = key as any;
        factory.service({
          ... getDeps(service),
          name
        })
      }
      return factory;
    },
    service(deps: Service<D> & { name: D }) {
      const { name, dependencies } = deps;
      const provider = isFunction(deps.provider) ? deps.provider : () => deps.provider;

      if (serviceMap[name]) {
        throw new Error(`Already have ${name} registered`);
      }

      serviceMap[name] = {
        dependencies,
        provider,
      };

      return factory;
    },
    dsl<T1 extends { [key: string]: any}, D1 extends Extract<keyof T1, string>>(input: InputDeps<T1, D1> = {} as InputDeps<T1, D1>): any {
      const [$, resolver] = constructFactories(input, serviceMap);
      return decorateWithSetters(
        $,
        factory.dsl,
        // @ts-ignore
        input,
        resolver,
      );
    },
    factory<T1 extends { [key: string]: any}, D1 extends Extract<keyof T1, string>>(deps: InputDeps<T1, D1> = {} as InputDeps<T1, D1>) {
      return constructFactories(deps, serviceMap)[0];
    },
  };
  return factory.define(services || {});
}

export default createFactory;
