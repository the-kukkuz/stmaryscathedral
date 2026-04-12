# AGENTS.md

## Purpose
This file guides agentic coding tools working in this repository.

Repository: `stmaryscathedral`  
Type: JavaScript monorepo (React + Vite frontend, Node + Express + Mongoose backend)

## Project Layout
- `tnp-proj/` - frontend app (React 19 + Vite)
- `backend/` - API server (Express 5 + Mongoose)
- root `package.json` - convenience scripts to build frontend and start backend

## Runtime & Tooling
- Node.js + npm (package-lock files are present)
- Frontend linting: ESLint flat config in `tnp-proj/eslint.config.js`
- No test framework is currently configured in package scripts (frontend or backend)

## Install Commands
From repo root:
- `npm run install-all` - install both frontend and backend deps
- or install separately:
  - `npm install --prefix tnp-proj`
  - `npm install --prefix backend`

## Build Commands
From repo root:
- `npm run build` - builds frontend (`tnp-proj/dist`)

From frontend folder:
- `npm run build --prefix tnp-proj`
- `npm run preview --prefix tnp-proj` - preview production frontend build

## Dev/Run Commands
From frontend folder:
- `npm run dev --prefix tnp-proj` - run Vite dev server

From backend folder:
- `npm run dev --prefix backend` - run server with nodemon
- `npm run start --prefix backend` - run server with node

From repo root:
- `npm run start` - starts backend only

## Lint Commands
- `npm run lint --prefix tnp-proj`

Notes:
- There is no backend lint script yet.
- Frontend lint scope is `**/*.{js,jsx}` under `tnp-proj`.

## Test Commands
Current state:
- No dedicated test runner or test scripts are configured.
- No project tests detected outside `node_modules`.

Implication for agents:
- Do not claim tests passed.
- If validation is needed, use lint + build + focused manual checks.

Single test command (currently unavailable):
- There is no working "single test" command until a test runner is added.

If tests are added later, document exact single-test patterns here, e.g.:
- Vitest example: `npx vitest run src/path/file.test.jsx -t "case name"`
- Jest example: `npx jest src/path/file.test.js -t "case name"`

## Environment & Config
Frontend:
- Uses `import.meta.env.VITE_API_URL` (see `tnp-proj/src/api.js`)
- Local file present: `tnp-proj/.env.development`

Backend:
- Loads `.env` using absolute path join from `backend/server.js`
- Requires `MONGO_URI` at minimum
- Port defaults to `3000` if `PORT` is unset

Security note:
- `backend/scripts/seed.js` currently contains a hardcoded MongoDB URI.
- Treat this as sensitive; avoid copying credentials to commits, logs, or docs.

## API/Serving Behavior
- Backend mounts API under `/api/*`
- Backend serves frontend static build from `../tnp-proj/dist`
- Non-API routes are redirected to frontend `index.html` for React Router

## Code Style - Source of Truth
When instructions conflict, follow in this order:
1. Existing patterns in nearby code
2. Linter-configured rules
3. This AGENTS guide

## JavaScript/React Style
- Use ES modules (`import`/`export`) everywhere.
- Prefer functional components and hooks.
- Keep components focused; move reusable logic to `src/utils`.
- Use `className` in JSX (never `class`).
- Keep route components under `src/pages`, shared UI under `src/components`.
- Prefer explicit imports over wildcard imports.
- Remove unused imports/variables (frontend lint enforces this).

## Import Conventions
- Group imports in this order:
  1) external packages
  2) internal absolute/relative modules
  3) styles/assets
- Keep one import per line for clarity when lists are long.
- Use file extensions consistently with local conventions (`.js` on backend local imports, `.jsx` often explicit on frontend entry imports).

## Formatting Conventions
Observed code is mixed; normalize toward:
- Semicolons: choose one style per file and keep it consistent.
- Quotes: prefer single quotes on frontend; backend currently uses double quotes heavily - preserve file-local style unless touching many lines.
- Trailing commas in multiline literals/objects when valid.
- Keep line length readable; split large object literals and function calls across lines.
- Avoid excessive vertical whitespace.

## Naming Conventions
- React components: `PascalCase` filenames and identifiers.
- Hooks/utils/helpers: `camelCase`.
- Mongoose model names: `PascalCase`.
- Route files: `<domain>Routes.js`.
- Schema field names currently use `snake_case` in many DB fields; preserve existing API contract unless doing coordinated migration.

## Data & Types Discipline (JS project)
Since TypeScript is not enabled:
- Validate inputs at route boundaries.
- Guard against `undefined`/`null` before DB writes.
- Parse and normalize request values explicitly (`Number`, `Boolean`, date parsing).
- Avoid implicit coercion in conditionals for critical logic.

## Error Handling
Backend:
- Wrap async route handlers in `try/catch`.
- Return consistent JSON error shape: `{ error: "message" }`.
- Use appropriate status codes:
  - `400` bad request/validation
  - `404` not found
  - `409` conflicts/duplicates
  - `500` unexpected server errors
- Do not leak stack traces in production responses.

Frontend:
- Handle API errors with safe fallbacks:
  - `err.response?.data?.error || err.message`
- Show user-friendly messages; avoid dumping raw objects.

## Database & Mongoose Practices
- Use `runValidators: true` for update operations.
- Use `.lean()` for read-only list/detail endpoints when Mongoose documents are unnecessary.
- Add indexes for frequent query paths (as seen in `Subscription` model).
- Keep model schema names and route payload keys aligned to avoid silent data drift.

## Agent Working Rules
- Make minimal, focused changes.
- Do not refactor unrelated files.
- Preserve existing API paths and payload shapes unless explicitly asked.
- Avoid introducing new dependencies unless necessary.
- Prefer updating scripts/config only when needed by the requested task.
- For new commands, wire them into the relevant `package.json` scripts.

## Validation Checklist Before Finishing
For frontend changes:
- `npm run lint --prefix tnp-proj`
- `npm run build --prefix tnp-proj`

For backend changes:
- Start server and verify affected endpoint(s):
  - `npm run dev --prefix backend` (or `npm run start --prefix backend`)
- Hit updated API routes and confirm status codes + response shapes

For cross-stack changes:
- Build frontend and run backend together
- Confirm SPA routing still works for non-API paths

## Cursor/Copilot Rule Files
Checked locations:
- `.cursor/rules/` - not present
- `.cursorrules` - not present
- `.github/copilot-instructions.md` - not present

Therefore:
- No repository-specific Cursor/Copilot instruction files are currently defined.

## Suggested Future Improvements (Optional)
- Add backend lint script (ESLint) and apply to `backend/**/*.js`
- Add a test runner (Vitest or Jest) with:
  - `npm test`
  - `npm run test:watch`
  - `npm run test:single -- <file> -t <name>`
- Move secrets from `backend/scripts/seed.js` into environment variables
- Add root-level README section documenting full dev workflow
