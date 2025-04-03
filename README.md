# zustand-q

A Zustand extension for managing async state with queries and mutations.

## Installation

```bash
npm install zustand-q
```

## Usage

```typescript
import { createStore } from "zustand-q";

const useMyStore = createStore({
  initialData: { count: 0 },
  actions: (set) => ({
    increment: () => set((state) => ({ count: state.count + 1 })),
  }),
  queries: {
    fetchData: {
      queryFn: async () => ({ data: "example" }),
      onStore: (data, set) => set({ fetchedData: data }),
    },
  },
});

export default useMyStore;
```

## License

MIT
