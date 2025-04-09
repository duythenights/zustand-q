![Zustand Q Social Card](https://zustand-q.vercel.app/img/social-card.webp)

[![NPM Version](https://img.shields.io/npm/v/zustand-q.svg)](https://www.npmjs.com/package/zustand-q)
[![Build Size](https://img.shields.io/bundlephobia/minzip/zustand-q)](https://bundlephobia.com/package/zustand-q)
[![License](https://img.shields.io/npm/l/zustand-q.svg)](https://github.com/ngnhutrung25/zustand-q/blob/main/LICENSE)

Zustand Q is a modern, enhanced state management library built on top of [Zustand](https://github.com/pmndrs/zustand), tailored for **React** and **React Native** applications. It preserves Zustand’s lightweight and minimalist philosophy while introducing powerful asynchronous state management features inspired by [Tanstack React Query](https://tanstack.com/query). Whether you’re fetching data from an API, performing CRUD operations, or persisting user settings, Zustand Q offers a simple, type-safe, and scalable solution that eliminates boilerplate and complexity.

**Visit [zustand-q.vercel.app](https://zustand-q.vercel.app) for docs, guides, API, and more!**

---

## Features

Zustand Q stands out with the following features:

- **Asynchronous State Management**:

  - **Queries**: Fetch data seamlessly and update the store (e.g., `getCatList` to load a list of cats).
  - **Mutations**: Perform updates like adding or deleting items with type-safe async logic.
  - _Example_: `mutate({ name: "Mimi" })` to add a cat, with automatic store updates.

- **Developer Tools**:

  - Integrate with Redux DevTools using a single `devtoolsName` option.
  - _Example_: `devtoolsName: "MyStore"` lets you inspect state changes in your browser.

- **Persistence Made Simple**:

  - Save state to local storage with `persistName`—no extra setup required.
  - _Example_: `persistName: "app-theme"` keeps your theme setting across reloads.

- **Flexible Selectors**:

  - Access state with concise string selectors (`useStore<number>("count")`) or powerful function selectors (`(state) => state.count`).
  - Optimized for performance with Zustand’s memoization.

- **Type Safety**:
  - Enhanced TypeScript support with generics for state, actions, queries, and mutations.
  - _Example_: Define `interface Cat { id: string; name: string }` and get full type checking throughout your store.

These benefits make Zustand Q a lightweight yet feature-rich alternative, ideal for both prototyping and production-grade apps.

---

## Installation

Install `zustand-q` via Yarn or npm:

```bash
yarn add zustand-q
```

or

```bash
npm install zustand-q
```

> This will also install `zustand` (version 5.0.3 or higher) as a dependency automatically.

### Requirements

- **React**: >= 16.8.0 (uses hooks)
- **Zustand**: >= 5.0.0 (included as a dependency)

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
    addCatOffline: (name: string) =>
      set((state) => ({
        cats: [...state.cats, { id: Date.now().toString(), name }],
      })),
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

## License

This project is licensed under the [MIT License](LICENSE).
