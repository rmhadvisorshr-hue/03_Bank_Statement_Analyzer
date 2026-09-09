# AI Bank Statement Analyzer

Full-stack bank statement analysis app: React UI and API run together on one dev server.

## Project Structure

-   `frontend/`: React UI (TanStack Start SSR) — `frontend/src/`. Depends on `backend` as an npm workspace package.
-   `backend/`: API — PDF parsing, analysis, Excel/PDF export. Its own `package.json`; no build step of its own — its TypeScript source is imported directly into the frontend's Vite/SSR bundle at build time (same single deployed process, just a separate package).
-   `backend/scripts/`: Dev-only debug/benchmark scripts, run via `npm run <script> --workspace backend`.

## Prerequisites

-   [Node.js](https://nodejs.org/) (v22, see `engines` in `package.json`)
-   [npm](https://www.npmjs.com/) (comes with Node.js)
-   Chrome or Edge (for master PDF export, via `puppeteer-core`)

## Getting Started

### 1. Install Dependencies

From the repository root (this installs the `frontend` and `backend` workspaces too — do not run `npm install` inside either directly):

```bash
npm install
```

### 2. Running the Application

One command starts the UI and API on the same port:

```bash
npm run dev
```

Open `http://localhost:5173/upload` (Vite may use the next free port, e.g. `5174`, if `5173` is busy). API routes are same-origin: `/api/*` and `/health`.

Production build and preview:

```bash
npm run build
npm run start
```

### PowerShell Execution Policy

If you are using PowerShell and encounter an error message like "running scripts is disabled on this system," you'll need to set the execution policy for the current process. Run this command in your PowerShell terminal before running `npm run dev`:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
```

## Available Scripts

Root (`package.json`):

-   `npm run dev`: Starts the Vite dev server (UI + API).
-   `npm run build`: Builds the frontend for production.
-   `npm run start`: Serves the production build.
-   `npm run typecheck`: Runs the TypeScript compiler across the backend and frontend workspaces.
-   `npm run lint`: Lints the frontend workspace.
-   `npm run benchmark:pdfs`, `npm run debug:pdf`, `npm run compare:namdar`: Delegate to the same-named scripts in `backend/package.json` (under `backend/scripts/`).

`frontend/package.json` and `backend/package.json` each expose their own scripts (`dev`/`build`/`preview`/`lint`/`format` for frontend, `typecheck`/`benchmark:pdfs`/`debug:pdf`/`compare:namdar` for backend) if you need to run either workspace on its own.
