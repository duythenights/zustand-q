import { useState } from "react";
import type { SetState, MutationConfig, MutationHook } from "./types";

export function createMutationHook<TData, TVariables, TState>(
  setState: SetState<TState>,
  mutationConfig: MutationConfig<TData, TVariables, TState>
): MutationHook<TData, TVariables> {
  return ({
    onStart: optOnStart,
    onSuccess: optOnSuccess,
    onError: optOnError,
    onFinish: optOnFinish,
  } = {}) => {
    const [status, setStatus] = useState<"success" | "error" | "pending">(
      "pending"
    );
    const [isPending, setIsPending] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isError, setIsError] = useState(false);
    const [error, setError] = useState<unknown | null>(null);
    const [successAt, setSuccessAt] = useState<number | undefined>(undefined);
    const [errorAt, setErrorAt] = useState<number | undefined>(undefined);

    const { mutationFn, onStore, onStart, onSuccess, onError, onFinish } =
      mutationConfig;

    const mutate = async (variables: TVariables) => {
      let data: TData | undefined;
      try {
        setStatus("pending");
        setIsPending(true);
        setIsSuccess(false);
        setIsError(false);
        onStart?.();
        optOnStart?.();
        data = await mutationFn(variables);
        onStore(data, setState);
        setSuccessAt(Date.now());
        setStatus("success");
        setIsSuccess(true);
        onSuccess?.(data);
        optOnSuccess?.(data);
        return data;
      } catch (err) {
        setStatus("error");
        setIsError(true);
        setError(err);
        setErrorAt(Date.now());
        onError?.(err);
        optOnError?.(err);
        throw err;
      } finally {
        setIsPending(false);
        onFinish?.(data, error);
        optOnFinish?.(data, error);
      }
    };

    return {
      mutate,
      successAt,
      errorAt,
      status,
      isPending,
      isSuccess,
      isError,
      error,
    };
  };
}
