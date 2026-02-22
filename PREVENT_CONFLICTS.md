# Preventing Merge Conflicts

## Analysis

The current codebase structure presents significant risks for merge conflicts, especially when multiple agents or developers are working in parallel. The primary issues are:

1.  **Monolithic `src/index.ts`:** This file acts as a "God Class", containing logic for Sessions, Sources, Activities, and utilities. Any feature addition or bug fix likely touches this file, creating a high probability of collision.
2.  **Centralized `src/types.ts`:** All interfaces are defined in a single file. Adding new types for different features simultaneously will cause conflicts here.
3.  **Implicit Dependencies:** The code relies on a shared `Client` object in `src/client.ts`, which might become a bottleneck if state management becomes more complex.
4.  **Lack of strict boundaries:** It's easy to accidentally couple different domains (e.g., Sessions depending on specific Activity logic) because they reside in the same file.

## Action Items

To mitigate these risks and enable parallel development, we will refactor the codebase into a domain-driven structure.

### 1. Vertical Slicing

Break down `src/index.ts` into smaller, feature-focused modules. Each module should contain its own logic and types (or co-located types).

**Proposed Structure:**

```
src/
├── client.ts           # HTTP Client & Auth (Shared Infrastructure)
├── sessions/           # Session Domain
│   ├── index.ts        # Public API for Sessions (facade, NOT barrel)
│   ├── api.ts          # Session API calls (listSessions, createSession, etc.)
│   └── types.ts        # Session-specific interfaces
├── activities/         # Activity Domain
│   ├── index.ts
│   ├── api.ts
│   └── types.ts
├── sources/            # Source Domain
│   ├── index.ts
│   ├── api.ts
│   └── types.ts
├── utils/              # Shared Utilities
│   ├── monitor.ts      # Polling logic
│   └── formatting.ts   # ID normalization
└── index.ts            # Main Entry Point (Minimal aggregation)
```

**Note on "Barrel Files":**
While we use `index.ts` files to expose the public API of a module, they should **not** just be a list of `export * from ...`. Instead, they should explicitly export only what is necessary, and the implementation should live in `api.ts` or similar files. The main `src/index.ts` will essentially just be an aggregator for the library's public surface area, but no logic should live there.

### 2. Type Segregation

Move interfaces from `src/types.ts` to their respective domain folders.
- `Session`, `CreateSessionRequest` -> `src/sessions/types.ts`
- `Activity`, `Artifact` -> `src/activities/types.ts`
- `Source`, `SourceContext` -> `src/sources/types.ts`

Shared types (like `ListResponse<T>`) can remain in a `src/common/types.ts` or similar.

### 3. Explicit Imports

Avoid `import * as ...`. Use named imports to make dependencies clear and reduce the chance of importing the wrong thing or causing circular dependencies.

## Guidelines for Future Development

1.  **One Feature, One File (or Folder):** When adding a new feature, try to encapsulate it in a new file or folder. Do not add it to an existing large file unless it strictly belongs there.
2.  **Co-locate Tests:** Tests for `src/sessions/api.ts` should live in `src/sessions/api.test.ts` (or `test/sessions/api.test.ts`), not in a giant `test/all.test.ts`.
3.  **Strict Typing:** Always define return types and parameter types. Avoid `any`. This catches integration errors early, which is crucial when working in parallel.
4.  **Immutable Patterns:** Prefer pure functions and immutable data structures where possible to avoid side-effects that can cause hard-to-debug conflicts in shared state (like `Client`).

## Migration Plan

1.  **Phase 1:** Create the directory structure.
2.  **Phase 2:** Move `types.ts` content to new locations. Update imports.
3.  **Phase 3:** Move `index.ts` functions to new locations. Update `index.ts` to export them.
4.  **Phase 4:** Verify tests pass at each step.

By following this structure, multiple agents can work on "Sessions", "Activities", and "Sources" completely independently with zero risk of merge conflicts in the logic files. The only potential conflict point is the main `index.ts` exports, which is easy to resolve.
