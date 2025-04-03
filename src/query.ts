import { useState, useEffect, useCallback } from "react";
import type { SetState, QueryConfig, QueryHook } from "./types";

export function createQueryHook<TData, TVariables, TState>(
  setState: SetState<TState>,
  queryConfig: QueryConfig<TData, TVariables, TState>
): QueryHook<TData, TVariables> {
  return ({
    fnVariables,
    enabled = queryConfig.enabled ?? true,
    dependencies = queryConfig.dependencies || [],
    onStart: optOnStart,
    onSuccess: optOnSuccess,
    onError: optOnError,
    onFinish: optOnFinish,
  } = {}) => {
    const [successAt, setSuccessAt] = useState<number | undefined>(undefined);
    const [status, setStatus] = useState<"success" | "error" | "pending">(
      "pending"
    );
    const [isPending, setIsPending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState<unknown | null>(null);
    const [errorAt, setErrorAt] = useState<number | undefined>(undefined);

    const { queryFn, onStore, onStart, onSuccess, onError, onFinish } =
      queryConfig;

    const executeQuery = useCallback(async () => {
      let data: TData | undefined;
      try {
        setStatus("pending");
        setIsPending(true);
        setIsSuccess(false);
        setIsError(false);
        onStart?.();
        optOnStart?.();
        data = await queryFn(fnVariables!);
        onStore(data, setState);
        setSuccessAt(Date.now());
        setStatus("success");
        setIsSuccess(true);
        onSuccess?.(data);
        optOnSuccess?.(data);
        return {
          successAt: Date.now(),
          errorAt: undefined,
          error: null,
          status: "success" as const,
          isPending: false,
          isSuccess: true,
          isError: false,
        };
      } catch (err) {
        setStatus("error");
        setIsError(true);
        setError(err);
        setErrorAt(Date.now());
        onError?.(err);
        optOnError?.(err);
        return {
          successAt: undefined,
          errorAt: Date.now(),
          error: err,
          status: "error" as const,
          isPending: false,
          isSuccess: false,
          isError: true,
        };
      } finally {
        setIsPending(false);
        onFinish?.(data, error);
        optOnFinish?.(data, error);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fnVariables]);

    useEffect(() => {
      if (enabled) {
        executeQuery();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, ...dependencies]);

    return {
      successAt,
      errorAt,
      status,
      isPending,
      isSuccess,
      isError,
      error,
      refetch: executeQuery,
    };
  };
}
