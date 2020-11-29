import union from 'lodash.union'
import difference from 'lodash.difference'
import getParameterNames from '@captemulation/get-parameter-names'

type AngularFunctionProvider<D extends string> = Function & {
  $inject: D[]
}
type MinifiableProvider<D extends string, T extends D[] = D[]> = [...T, Function]
type Provider<D extends string> = MinifiableProvider<D> | AngularFunctionProvider<D> | Function

type InputDeps<D extends string> = { [key in D]: Provider<D> }
type Service<D extends string>  = { loading?: boolean, dependencies: D[], provider: Function }
type ServiceDeps<D extends string>  = { [key in D]: Service<D> }
type ServiceDeps2<D extends {}>  = { [key in Extract<keyof D, string>]: D[key] extends () => any ? ReturnType<D[key]> : D[key] }

type Factory<D extends string, R> = (deps: Provider<D>) => R

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

function getDeps<D extends string>(_provider: Provider<D>) {
  let provider = isFunction(_provider) ? _provider : () => _provider;
  let dependencies: D[];

  if (Array.isArray(_provider)) { // Array style
    provider = _provider.pop() as Function;
    dependencies = _provider as D[];
  } else if ((_provider as AngularFunctionProvider<D>).$inject) {
    dependencies = (_provider as AngularFunctionProvider<D>).$inject; // $inject Angular style
  } else { // Code parse only style
    dependencies = getParameterNames(provider) as D[];
  }
  return {
    dependencies,
    provider,
  };
}

function createFactory<D extends string>(services: InputDeps<D>) {
  const serviceMap = {} as ServiceDeps<D | any>;

  function decorateWithSetters<I extends string>(
    $: Factory<D | I, any>,
    dsl: (input?: InputDeps<I | D>) => any,
    deps: InputDeps<I | D>,
    resolver: Resolver<D | I>,
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
        } as InputDeps<D | I>);
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

  function constructFactories<I extends string>(input: InputDeps<I | D>) {
    let $: Factory<D | I, any>;
    const deps = input || {};
    /**
     * Returns a function with attempts to load a service.
     *  - cached value of service will be used if already resolved
     *  - unitialized dependencies will be loaded
     *  - circular dependencies will cause error
     */
    function resolver(name: string, loading: (I | D | '$')[], service: ServiceDeps<D | I>[D | I]) {
      let singleton: any;
      return function serviceResolve() {
        if (!singleton) {
          if (service.loading) {
            throw new Error(`Circular dependency error with ${name} at ${loading.join(' => ')}`);
          }
          service.loading = true;
          
          // Resolved dependencies
          const args: any[] = [];
          // Unresolved dependencies
          const unresolvedArgs: (D | I)[] = [];

          // Iterate through dependencies
          service.dependencies.forEach((dep) => {
            // If not defined but has a service provider, then resolve that
            if (
              isUndefined(deps[dep])
              && serviceMap[dep]
              && isFunction(serviceMap[dep].provider)
            ) {
              const newflattenedDeps = [dep, ...loading]
              // Recursively resolve the dependency and save
              deps[dep] = resolver(dep, newflattenedDeps, serviceMap[dep])();
            }
            if (dep === '$' && !deps[dep]) {
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

    $ = provider => resolver('$', ['$'], getDeps(provider))();
    return [$, resolver] as [Factory<D | I, any>, typeof resolver];
  }

  const factory = {
    define<I extends string>(moreServices: InputDeps<I>) {
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
    dsl<I extends string>(input: InputDeps<I | D> = {} as InputDeps<I | D>): any {
      const [$, resolver] = constructFactories(input);
      return decorateWithSetters(
        $,
        factory.dsl,
        input,
        resolver,
      );
    },
    factory<I extends string>(deps: InputDeps<I | D> = {} as InputDeps<I | D>) {
      return constructFactories(deps)[0];
    },
  };
  return factory.define(services || {});
}

export default createFactory;
