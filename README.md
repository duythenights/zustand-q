# zustand-q

![NPM Version](https://img.shields.io/npm/v/zustand-q.svg)
![License](https://img.shields.io/npm/l/zustand-q.svg)

`zustand-q` is an extension library for [Zustand](https://github.com/pmndrs/zustand), designed to simplify async state management in React applications. It provides powerful hooks for handling queries and mutations, seamlessly integrating with Zustand's global state management.

## Features

- **Query Hooks**: Automatically manage loading states (pending, success, error) with refetch capabilities.
- **Mutation Hooks**: Perform data modifications (POST, PUT, DELETE) and update state effortlessly.
- **TypeScript Support**: Fully written in TypeScript with strong typing and safety.
- **Lightweight**: Minimal dependencies, leveraging Zustand's efficiency.

---

## Installation

Install `zustand-q` via Yarn or npm:

```bash
yarn add zustand-q zustand
```

or

```bash
npm install zustand-q zustand
```

### Requirements

- **React**: >= 16.8.0 (uses hooks)
- **Zustand**: >= 5.0.0

---

## Usage

Here’s an example of using `zustand-q` to manage a list of cats:

### Example: Cat Store

#### 1. Create a Store

Create a file `catStore.ts`:

```tsx
import { createStore } from "zustand-q";
import axios from "axios";

export interface Cat {
  id: string;
  name: string;
}

interface CatState {
  cats: Cat[];
}

export const useCatStore = createStore({
  initialData: { cats: [] } as CatState,
  actions: (set) => ({
    clearCats: () => set({ cats: [] }),
    addCats: (name: string) => set({ cats: [{ id: "123", name }] }),
  }),
  queries: {
    getCatList: {
      queryFn: async () => {
        const response = await axios.get<{ data: Cat[] }>(
          "https://api.example.com/cats"
        );
        return response.data;
      },
      onStore: (data, set) => set({ cats: data.data }),
      onStart: () => console.log("Fetching cat list..."),
      onSuccess: (data) => console.log("Cat list fetched successfully!", data),
      onError: (error) => console.log("Error fetching cat list:", error),
    },
  },
  mutations: {
    addCat: {
      mutationFn: async (variables: { name: string }) => {
        const response = await axios.post<Cat>(
          "https://api.example.com/cats",
          variables
        );
        return response.data;
      },
      onStore: (data, set) => set((state) => ({ cats: [...state.cats, data] })),
      onSuccess: (data) => console.log("Cat added successfully!", data),
    },
  },
});
```

#### 2. Use in a Component

Create a file `App.tsx`:

```tsx
import React, { useState } from "react";
import { useCatStore } from "./catStore";
import { useStore } from "zustand-q";

const App: React.FC = () => {
  const [name, setName] = useState("");
  const { getCatList, addCat } = useCatStore();
  const cats = useCatStore((state) => state.cats);
  const [count, setCount] = useStore<number>("count", 0);

  const { isPending, refetch } = getCatList({ enabled: true });
  const { mutate: createCat, isPending: isCreating } = addCat();

  const handleAddCat = () => {
    if (name) {
      createCat({ name });
      setName("");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Cat Manager</h1>
      <p>Count: {count}</p>
      <button onClick={() => setCount((prev) => prev + 1)}>Increment</button>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Cat name"
      />
      <button onClick={handleAddCat} disabled={isCreating}>
        {isCreating ? "Adding..." : "Add Cat"}
      </button>
      <button onClick={() => refetch()} disabled={isPending}>
        {isPending ? "Loading..." : "Fetch Cats"}
      </button>
      <h2>Cats List ({cats.length})</h2>
      {isPending ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {cats.map((cat) => (
            <li key={cat.id}>
              {cat.name} (ID: {cat.id})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default App;
```

---

## API

### `createStore(config)`

Creates a Zustand store with async capabilities.

- **initialData**: Initial state object.
- **actions**: Functions to modify state.
- **queries**: Async data fetching with lifecycle hooks.
- **mutations**: Async data mutations with lifecycle hooks.

### `useStore(key, initialData)`

A global hook to manage simple key-value state.

- Returns: `[value, setValue]`

### Query Hook

Returned by `queries`:

- `isPending`, `isSuccess`, `isError`, `status`, `error`, `refetch`

### Mutation Hook

Returned by `mutations`:

- `mutate`, `isPending`, `isSuccess`, `isError`, `status`, `error`

---

## Project Structure

```
zustand-q/
├── src/
│   ├── index.ts        # Main entry point
│   ├── mutation.ts     # Mutation hook implementation
│   ├── query.ts        # Query hook implementation
│   ├── types.ts        # TypeScript definitions
│   ├── utils.ts        # Utility functions
├── package.json        # Package configuration
├── tsconfig.json       # TypeScript configuration
├── rollup.config.js    # Rollup build configuration
└── LICENSE             # MIT License
```

---

## Building the Library

To build the library locally:

```bash
yarn build
```

This runs TypeScript compilation (`tsc`) and Rollup bundling.

---

## Contributing

We welcome contributions! To get started:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m "Add your feature"`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

Please ensure your code follows the existing style and includes tests where applicable.

---

## License

This project is licensed under the [MIT License](LICENSE).

---

## Acknowledgments

- Built with inspiration from [Zustand](https://github.com/pmndrs/zustand) and modern state management patterns.
- Thanks to the open-source community for continuous support!
