# CodeSentinel

A Theory of Computation-based source code analyzer for Mini-C++ (DFA/NFA lexer, CFG-based parser, parse trees, Unicode security analysis).

Team: Shreyansh Srivastava, Kaustubh Mishra, Abhigya Narayan Awasthi

## Setup

Requirements: Git, [uv](https://docs.astral.sh/uv/), Node.js 22 + npm. Python 3.14 is installed by uv automatically.

```bash
git clone https://github.com/sshreyanshh/CodeSentinel.git
cd CodeSentinel
```
a
### Backend

```bash
cd backend
uv sync
uv run uvicorn app.api.main:app --reload   # http://localhost:8000/api/health
```

### Frontend

```bash
cd frontend
npm ci
npm run dev                                # http://localhost:5173
```

## Checks (run before opening a PR)

```bash
cd backend && uv run pytest && uv run ruff check .
cd frontend && npm test && npm run lint && npm run build
```

## Working on the repo

- Never push to `main`. Branch from fresh `main` (`git switch main && git pull && git switch -c feature/<name>`), open a PR, get one review.
- Add dependencies with `uv add <pkg>` / `npm install <pkg>` and commit the lockfile with them.