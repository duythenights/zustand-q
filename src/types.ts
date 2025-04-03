/* eslint-disable @typescript-eslint/no-explicit-any */
import { StoreApi } from "zustand";

export type LifecycleHooks<TData> = {
  onStart?: () => void;
  onSuccess?: (data: TData) => void;
  onError?: (error: unknown) => void;
  onFinish?: (data?: TData, error?: unknown) => void;
};

export type SetState<TState> = (
  partial:
    | TState
    | Partial<TState>
    | ((state: TState) => TState | Partial<TState>),
  replace?: boolean
) => void;

export type QueryConfig<TData, TVariables, TState> = {
  queryFn: (variables: TVariables) => Promise<TData>;
  onStore: (data: TData, set: SetState<TState>) => void;
  enabled?: boolean;
  dependencies?: unknown[];
} & LifecycleHooks<TData>;

export type MutationConfig<TData, TVariables, TState> = {
  mutationFn: (variables: TVariables) => Promise<TData>;
  onStore: (data: TData, set: SetState<TState>) => void;
} & LifecycleHooks<TData>;

export type QueryHook<TData, TVariables> = (
  options?: {
    fnVariables?: TVariables;
    enabled?: boolean;
    dependencies?: unknown[];
  } & LifecycleHooks<TData>
) => {
  successAt: number | undefined;
  errorAt: number | undefined;
  status: "success" | "error" | "pending";
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: unknown | null;
  refetch: () => Promise<
    | {
        successAt: number | undefined;
        errorAt: number | undefined;
        error: unknown | null;
        status: "success" | "error" | "pending";
        isPending: boolean;
        isSuccess: boolean;
        isError: boolean;
      }
    | undefined
  >;
};

export type MutationHook<TData, TVariables> = (
  options?: LifecycleHooks<TData>
) => {
  mutate: (variables: TVariables) => Promise<TData>;
  successAt: number | undefined;
  errorAt: number | undefined;
  status: "success" | "error" | "pending";
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: unknown | null;
};

// Cải thiện QueryHookExtends để giữ nguyên TData và TVariables
export type QueryHookExtends<TQuery> = TQuery extends QueryConfig<
  infer TData,
  infer TVariables,
  any
>
  ? QueryHook<TData, TVariables>
  : QueryHook<unknown, unknown>;

export type MutationHookExtends<TMutation> = TMutation extends MutationConfig<
  infer TData,
  infer TVariables,
  any
>
  ? MutationHook<TData, TVariables>
  : never;

export type StoreConfig<TState, TActions, TQueries, TMutations> = {
  initialData: TState;
  actions?: (
    set: SetState<TState>,
    get: () => TState,
    api: StoreApi<TState>
  ) => TActions;
  queries?: TQueries;
  mutations?: TMutations;
  persistName?: string;
  devtoolsName?: string;
};
