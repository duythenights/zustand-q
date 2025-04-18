import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type {
  SetState,
  QueryConfig,
  MutationConfig,
  QueryHookExtends,
  MutationHookExtends,
  StoreConfig,
} from "./types";
import { createQueryHook } from "./query";
import { createMutationHook } from "./mutation";
import { get } from "./utils";

// Type guard functions
function isQueryConfig<TData, TVariables, TState>(
  config: any
): config is QueryConfig<TData, TVariables, TState> {
  return config && typeof config.queryFn === "function";
}

function isMutationConfig<TData, TVariables, TState>(
  config: any
): config is MutationConfig<TData, TVariables, TState> {
  return config && typeof config.mutationFn === "function";
}

export function createStore<
  TState extends object,
  TActions extends object,
  TQueries extends Record<string, QueryConfig<any, any, TState>>,
  TMutations extends Record<string, MutationConfig<any, any, TState>>
>(config: StoreConfig<TState, TActions, TQueries, TMutations>) {
  const {
    initialData,
    actions,
    queries = {} as TQueries,
    mutations = {} as TMutations,
    persistName,
    devtoolsName,
  } = config;

  let stateCreator = (set: any, get: any, api: any) => {
    const stateActions = actions ? actions(set, get, api) : ({} as TActions);
    return { ...initialData, ...stateActions };
  };

  if (devtoolsName) {
    stateCreator = devtools(stateCreator, { name: devtoolsName });
  }
  if (persistName) {
    stateCreator = persist(stateCreator, { name: persistName });
  }

  const useZustandStore = create<TState & TActions>()(stateCreator);
  const setState = useZustandStore.setState as SetState<TState>;

  const queryHooks = Object.keys(queries).reduce((acc, key) => {
    const queryConfig = queries[key];
    if (!isQueryConfig(queryConfig)) {
      throw new Error(`Invalid query config for key: ${key}`);
    }
    acc[key as keyof TQueries] = createQueryHook(
      setState,
      queryConfig
    ) as QueryHookExtends<TQueries[keyof TQueries]>;
    return acc;
  }, {} as { [K in keyof TQueries]: QueryHookExtends<TQueries[K]> });

  const mutationHooks = Object.keys(mutations).reduce((acc, key) => {
    const mutationConfig = mutations[key];
    if (!isMutationConfig(mutationConfig)) {
      throw new Error(`Invalid mutation config for key: ${key}`);
    }
    acc[key as keyof TMutations] = createMutationHook(
      setState,
      mutationConfig
    ) as MutationHookExtends<TMutations[keyof TMutations]>;
    return acc;
  }, {} as { [K in keyof TMutations]: MutationHookExtends<TMutations[K]> });

  type TStore = TState & TActions & typeof queryHooks & typeof mutationHooks;

  function useStore(): TStore;
  function useStore<U>(selector: (state: TState & TActions) => U): U;
  function useStore<U>(selector: string): U;

  function useStore<U>(selector?: ((state: TState & TActions) => U) | string) {
    const state = useZustandStore(
      selector
        ? typeof selector === "string"
          ? (s: TState & TActions) => get(s, selector)
          : selector
        : (s: TState & TActions) => s
    );

    if (!selector) {
      return {
        ...(state as TState & TActions),
        ...queryHooks,
        ...mutationHooks,
      } as TStore;
    }

    return state;
  }

  return useStore;
}
