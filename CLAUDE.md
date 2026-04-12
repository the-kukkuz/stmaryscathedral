# CLAUDE.md

## Project Overview
- Repository: `stmaryscathedral`
- Stack: JavaScript monorepo
  - Frontend: React 19 + Vite (`tnp-proj/`)
  - Backend: Node.js + Express 5 + Mongoose (`backend/`)

## Working Conventions
- Make minimal, focused changes only.
- Preserve existing API paths and payload shapes unless explicitly requested.
- Match local file style (quotes/semicolons) rather than forcing global reformatting.
- Do not introduce new dependencies unless required.
- Validate input at route boundaries and handle backend errors with `{ error: "message" }`.

## Common Commands
- Install all dependencies: `npm run install-all`
- Frontend dev: `npm run dev --prefix tnp-proj`
- Backend dev: `npm run dev --prefix backend`
- Root start (backend): `npm run start`
- Frontend lint: `npm run lint --prefix tnp-proj`
- Frontend build: `npm run build --prefix tnp-proj`
- Root build: `npm run build`

## Environment Notes
- Frontend API base uses `import.meta.env.VITE_API_URL`.
- Backend loads env from `backend/.env` and requires `MONGO_URI`.
- Treat credentials as sensitive; do not commit secrets.

## Validation Checklist
- Frontend changes: run lint + build in `tnp-proj`.
- Backend changes: run backend and verify affected endpoints/status codes.
- Cross-stack changes: verify frontend build and backend SPA fallback behavior.
