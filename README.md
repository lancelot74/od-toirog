# ОД ТОЙРОГ

Mongolian-first astrology web application. Next.js static frontend + authenticated FastAPI backend + Supabase/PostgreSQL.

## Run locally

Node 22+, pnpm 10.15.1, Python 3.12.

```bash
corepack pnpm install
python3 -m venv .venv
.venv/bin/pip install -r apps/api/requirements.txt
```

Create `.env.local` using `.env.example`. Follow **[docs/SETUP.md](docs/SETUP.md)** to configure Supabase, Google OAuth, and the backend.

Frontend:

```bash
corepack pnpm dev
```

Backend (separate terminal at the repository root):

```bash
.venv/bin/uvicorn apps.api.main:app --host 0.0.0.0 --port 8000
```

Frontend: `http://localhost:3001`. Backend health: `http://localhost:8000/health`. API docs: `http://localhost:8000/docs`.

Port 3001 is the local default because port 3000's loopback connection resets on this Windows/WSL installation. The same static site was verified with HTTP 200 from both Ubuntu and Windows on port 3001.

Without Supabase configuration, public pages work and private screens explain the missing connection. No sample personal charts or invented predictions are substituted.

## Verify

```bash
corepack pnpm lint
corepack pnpm build
corepack pnpm typecheck
.venv/bin/python -m pytest tests -q
node --test tests/rls.test.mjs
corepack pnpm exec playwright test
```

Run type checking **after**, not concurrently with, a build because Next regenerates `.next/types`.

## Deployment

- GitHub Pages serves `out/` using the included workflow. Add the three public configuration values as GitHub Actions repository variables. Public asset and OAuth paths respect `/od-toirog`.
- The Python backend needs a separate HTTPS host. Build its container from the repo root: `docker build -f apps/api/Dockerfile .`.
- This project uses static export. `pnpm start` serves the built `out/` locally using Python on port 3001; use Pages or another HTTPS static host for production.

See [docs/PRD_STATUS.md](docs/PRD_STATUS.md) for implementation coverage and external launch gates. Tests do not substitute for live Google OAuth, RLS, language, and astronomical reference validation.
