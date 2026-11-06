# CodeSentinel Frontend Context Manifest

This document is the frontend's working context manifest for developers and AI
assistants. Treat the coordinate rules and architectural guardrails below as
requirements. Items marked **Planned** describe intended behavior that is not
implemented in the current checkout.

## 1. Project Overview & Architecture

### Core stack

- Node.js 22
- Vite
- React with TypeScript
- Tailwind CSS v4
- Monaco Editor via `@monaco-editor/react`
- Vitest
- FastAPI backend, run with `uv`

### Architectural guardrails

- The frontend does not parse Mini-C++ and does not implement lexer, parser, or
  AST logic. It renders analysis output from the backend.
- The analysis API contract is `POST /api/analyze`, with source code sent as
  `{ "code": "..." }` and an `AnalysisReport` returned.
- Keep analysis and parsing behavior in the FastAPI backend. Do not duplicate
  backend logic in React components or browser utilities.
- **Planned:** fully decoupled development through `VITE_USE_MOCKS=true` in
  `.env.local`, backed by golden mock reports in `src/mocks/`. The current
  `src/api/client.ts` does not yet read this flag or provide golden reports.
- The current API client posts to `http://localhost:8000/api/analyze` by
  default. Set `VITE_API_BASE_URL` to override the base URL.

## 2. Critical Coordinate Rules (Prevent Coordinate Drift)

- Backend positions use **1-based line numbers** and **1-based Unicode code
  point columns**.
- Monaco positions use **1-based line numbers** and **1-based UTF-16 code unit
  columns**.
- A non-BMP character such as an emoji counts as one backend code point but two
  Monaco UTF-16 code units.
- Always use `src/lib/positions.ts`'s `codePointColumnToMonaco` when mapping
  backend columns to Monaco markers or editor jumps. Do not add independent
  conversions at call sites.

## 3. Current Implementation Status

### Implemented

- `src/lib/verdict.ts`: `deriveVerdict` implements lexical, syntax, and valid
  verdicts. Its Vitest suite is run by `npm run test`.
- `src/components/EditorPane.tsx` and `src/hooks/useTheme.ts`: persisted light
  and dark parchment themes are synchronized between Tailwind CSS variables
  and Monaco themes `parchment-light` and `parchment-dark`.
- `src/pages/AnalyzerPage.tsx`: resizable split-pane layout supports dragging
  and double-click reset.
- `src/lib/markers.ts`: maps report diagnostics to Monaco marker data.
  `EditorPane` synchronizes these markers to the active editor model.
- `src/api/client.ts`: sends analysis requests to the configured backend URL
  and checks the basic report shape.
- `Errors`, `Tokens`, `Tree`, `Automaton`, and `Security` tabs are present.
  Current tab rendering is generic; it is not yet a set of specialized views.

### Pending / Next

- Add specialized `TokensTab`, `TreeTab`, `AutomatonTab`, and `SecurityTab`
  components.
- Add `VITE_USE_MOCKS=true` support and golden reports under `src/mocks/`.
- Verify the live API request/response contract against a running FastAPI
  backend. The backend source in this checkout does not currently expose a
  verifiable schema.
- Generate and adopt backend-derived TypeScript types instead of relying on
  the current minimal frontend report type.

## 4. Data Contracts & Interfaces

These interfaces describe the frontend/backend contract. The source type file
`src/types/api.ts` is currently a minimal implementation and does not yet
define all of these structures. Keep it aligned with the FastAPI OpenAPI schema
when the backend contract is available.

```ts
export interface Position {
  line: number
  column: number
}

export interface Span {
  start: Position
  end: Position
}

export interface Token {
  kind: string
  lexeme: string
  span: Span
}

export interface Diagnostic {
  message: string
  span: Span
}

export interface SecurityFinding extends Diagnostic {
  ruleId: string
  category: string
}

export interface ParseNode {
  name: string
  children: ParseNode[]
  span?: Span
}

export interface AnalysisReport {
  tokens: Token[]
  lexical: {
    errors: Diagnostic[]
  }
  syntax: {
    status: 'ok' | 'errors'
    errors: Diagnostic[]
    tree?: ParseNode
  }
  security: {
    findings: SecurityFinding[]
  }
}

export interface DfaDefinition {
  states: string[]
  alphabet: string[]
  startState: string
  acceptingStates: string[]
  transitions: Record<string, Record<string, string>>
}
```

`DfaDefinition` is static analyzer/reference data, not part of
`AnalysisReport`. Its planned source is `src/mocks/dfa.json` or
`GET /api/automata`.

## 5. Scripts & Validation

Run commands from the `frontend/` directory:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run test` | Run the Vitest suite once. |
| `npm run lint` | Run ESLint across the frontend. |
| `npm run build` | Type-check and create a production build. |
| `npm run gen:types` | Fetch FastAPI's `/openapi.json` and generate `src/types/generated-api.ts`. Start the backend first. |

The backend is run from `backend/` with `uv`; the repository root README
documents the backend startup command. Type generation requires the FastAPI
OpenAPI endpoint to be reachable at `http://localhost:8000/openapi.json`.
