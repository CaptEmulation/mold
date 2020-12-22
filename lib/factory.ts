
type Dependencies<O extends {}, I extends keyof O> = { [key in I]: O[key] }
type MaybeAsyncDependencies<O extends {}, I extends keyof O> = { [key in I]: O[key] | Promise<O[key]> }
type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T
type ArrayProvider<R, O extends {}, I extends keyof O> = [(deps: Dependencies<O, I>) => R | Promise<R>, ...I[]]
export type InputDeps<O extends {}, I extends keyof O> = { [key in I]: ArrayProvider<O[key], O, I> }
export type Factory<R, O extends {}, I extends keyof O> = (dep: Dependencies<O, I>) => R
export type FactoryFunction<R, O extends {}, I extends keyof O> = (func: Factory<R, O, I>) => void
interface Service<R, O extends {}, I extends keyof O> {
  provider(deps: Dependencies<O, I>): R | Promise<R>;
  loading: boolean;
  singleton?: R | Promise<R>
  dependencies: I[] 
}
export function isPromise<R>(p: R | Promise<R>): p is Promise<R> {
  return typeof (p as Promise<R>)?.then === 'function'
}
export function hasPromiseValue<O extends {}, I extends keyof O>(p: { [key in I]: O[key] | Promise<O[key]> }): p is { [key in I]: O[key] } {
  const values: O[I][] = Object.values(p)
  return !!values.some(
    v => v instanceof Promise || (v && isPromise(v)),
  );
}
export class UnresolvedDependencyError extends Error {
  public missingDeps: string[];

  constructor(message: string, missingDeps: string[]) {
    super(message);
    this.missingDeps = missingDeps;
  }
}

function constructFactories<O extends {}, I extends keyof O>(deps: { [key in I]: Service<O[key], O, I> }) {
  /**
   * Looks at the passed in arg object. If the object has any values 
   * that are promises, resolve them. Call the callback with either 
   * the original object or a new object with all values resolved.
   * 
   * @param arg On object with values that may be promises
   * @param callback Will be called back with all promises resolved
   */
  function resolveOrReturn<R>(arg: Required<MaybeAsyncDependencies<O, I>>, callback: Factory<R, O, I>): R | Promise<R> {
    const keys = Object.keys(arg) as I[]
    const values: O[I][] = Object.values(arg)
    if (hasPromiseValue(arg)) {
      return Promise.all(values).then(async (resolvedValues) => {
        const res: Partial<Dependencies<O, I>> = {};
        for (let i = 0; i < resolvedValues.length; i += 1) {
          res[keys[i]] = resolvedValues[i];
        }
        return callback(res as Required<Dependencies<O,I>>);
      });
    } else {
      return callback(arg as Required<Dependencies<O,I>>);
    }
  }
  /**
   * For the list of dependencies, look them up and create an object with all of
   * the dependencies. 
   * @param requestDeps dependency list
   * @throws UnresolvedDependencyError if a dependency cannot be resolved
   */
  function resolveDependencies<R>(requestDeps: I[]) {
    // Resolved dependencies
    const arg: Partial<MaybeAsyncDependencies<O, I>> = {};
    // Unresolved dependencies
    const unresolvedArgs: I[] = [];

    // Iterate through dependencies
    requestDeps.forEach((dep) => {
      // If not defined but has a service provider, then resolve that
      if (
        !Object.prototype.hasOwnProperty.call(deps[dep], 'singleton')
      ) {
        // Recursively resolve the dependency and save
        deps[dep].singleton = resolver(dep, [], deps[dep])();
      }
      
      if (Object.prototype.hasOwnProperty.call(deps, dep)) {
        arg[dep] = deps[dep]?.singleton
      } else {
        // uh-oh... unresolved dependency
        unresolvedArgs.push(dep);
      }
    });
    
    if (unresolvedArgs.length) {
      throw new UnresolvedDependencyError(`Failed to resolve ${unresolvedArgs.join(', ')} from ${Object.keys(deps)} at $`, unresolvedArgs as string[]);
    }

    return arg as Required<MaybeAsyncDependencies<O, I>>
  }
  /**
   * Returns a function with attempts to load a service.
   *  - cached value of service will be used if already resolved
   *  - unitialized dependencies will be loaded
   *  - circular dependencies will cause error
   */
  function resolver(name: I | '$', loading: I[], service?: Service<O[I], O, I>) {
    return function serviceResolve(): O[I] | Promise<O[I]> {
      if (!service?.singleton) {
        if (!service) {
          throw new Error('Service not defined')
        }
        if (service.loading) {
          throw new Error(`Circular dependency error with ${name} at ${loading.join(' => ')}`);
        }
        service.loading = true;
        
       
        // Resolved dependencies
        const arg = resolveDependencies(service.dependencies)
        return resolveOrReturn(arg, (res) => {
          service.loading = false
          service.singleton = service.provider(res)
          // Casting to O[I] to prevent Typescript from complaining about Promise<O[I] | Promise<O[I]>>, which is the same thing
          return service.singleton as O[I]
        })
      }

      return service.singleton;
    };
  }

  const $ = <R>(func: Factory<R, O, I>, requestDeps: I[]) => {
    const arg = resolveDependencies(requestDeps)
    return resolveOrReturn(arg, func)
  }
  return [$, resolver] as [typeof $, typeof resolver];
}

export default async function create<O extends {}, I extends keyof O>(deps: InputDeps<O, I>) {
  const keys = Object.keys(deps) as I[]
  const serviceHash: Partial<{ [key in I]: Service<O[key], O, I> }> = {}
  for (let name of keys) {
    const [provider, ...names] = deps[name]
    serviceHash[name] = {
      loading: false,
      dependencies: names as I[],
      provider
    }
  }
  const resolvedServiceHash = serviceHash as Required<{ [key in I]: Service<O[key], O, I> }>
  const [$] = constructFactories(resolvedServiceHash)
  return $
}
