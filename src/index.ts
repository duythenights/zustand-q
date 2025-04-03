/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { useEffect } from "react";

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

  // @ts-expect-error: any
  let stateCreator = (set, get, api) => {
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

  // Định nghĩa queryHooks với kiểu chính xác
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

  // Định nghĩa mutationHooks với kiểu chính xác
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

  // Overload cho useStore
  function useStore(): TStore;
  function useStore<U>(selector: (state: TState & TActions) => U): U;
  function useStore<U>(selector: string): U;

  // Implementation
  function useStore<U>(selector?: ((state: TState & TActions) => U) | string) {
    // Gọi useZustandStore với selector hoặc lấy toàn bộ store
    const state = useZustandStore(
      selector
        ? typeof selector === "string"
          ? (s: TState & TActions) => get(s, selector)
          : selector
        : (s: TState & TActions) => s
    );

    // Nếu không có selector, trả về TStore
    if (!selector) {
      return {
        ...(state as TState & TActions),
        ...queryHooks,
        ...mutationHooks,
      } as TStore;
    }

    // Nếu có selector, trả về U
    return state;
  }

  return useStore;
}

// Tạo store chung (useStore)

const globalStore = createStore({
  initialData: {} as Record<string, any>,
  actions: (set) => ({
    setState: (fn: (prev: Record<string, any>) => Record<string, any>) =>
      set(fn),
  }),
});

// Hook useStore toàn cục với kiểu generic
export function useStore<T>(
  key: string,
  initialData?: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Lấy giá trị từ store, dùng initialData nếu chưa có
  const value = globalStore((state) => get(state, key, initialData) as T);
  const setState = globalStore((state) => state.setState);

  // Khởi tạo giá trị ban đầu nếu chưa tồn tại
  useEffect(() => {
    setState((prev) => {
      if (get(prev, key) === undefined) {
        return { ...prev, [key]: initialData };
      }
      return prev;
    });
  }, [key, initialData, setState]); // Thêm dependencies để đảm bảo chạy lại khi cần

  // Hàm setValue hỗ trợ cả giá trị trực tiếp và callback
  const setValue = (newValue: T | ((prev: T) => T)) => {
    setState((prev) => {
      const currentValue = get(prev, key, initialData) as T;
      const updatedValue =
        typeof newValue === "function"
          ? (newValue as (prev: T) => T)(currentValue)
          : newValue;
      return { ...prev, [key]: updatedValue };
    });
  };

  return [value, setValue];
}
