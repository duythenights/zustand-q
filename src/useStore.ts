import { useEffect, useRef } from "react";
import { createStore } from "./createStore";
import { get } from "./utils";

const initGlobalStore = () =>
  createStore({
    initialData: {} as Record<string, any>,
    actions: (set) => ({
      setState: (fn: (prev: Record<string, any>) => Record<string, any>) =>
        set(fn),
    }),
  });

let globalStoreInstance: ReturnType<typeof initGlobalStore> | null = null;

function getGlobalStore() {
  if (!globalStoreInstance) {
    globalStoreInstance = initGlobalStore();
  }
  return globalStoreInstance;
}

export function useStore<T>(
  key: string,
  initialData?: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const globalStore = getGlobalStore();
  const value = globalStore((state) => get(state, key, initialData) as T);
  const setState = globalStore((state) => state.setState);

  const initializedRef = useRef(false);

  useEffect(() => {
    if (!initializedRef.current) {
      setState((prev) => {
        if (get(prev, key) === undefined) {
          return { ...prev, [key]: initialData };
        }
        return prev;
      });
      initializedRef.current = true;
    }
  }, [key, initialData, setState]);

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
