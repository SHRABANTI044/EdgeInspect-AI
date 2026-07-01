# EdgeInspect AI — Real-Time Aircraft Defect Detection

This project is a Next.js + Postgres (Drizzle ORM) web application that performs aircraft defect detection using an ONNX/YOLO pipeline, stores inspection results, and serves reports + analytics.

## Features

- Authentication (session cookie)
- Live image inspection (upload → YOLO inference → store defects)
- Dashboard analytics (stats + recent inspections)
- Inspection reports and history
- Maintenance task endpoints
- YOLO model download / warmup / training utilities (scripts)

## Project structure (current)

- `src/app/`: Next.js App Router pages + API routes
- `src/components/`: UI components
- `src/lib/`: detection/inference + queries + auth helpers
- `src/db/`: Drizzle schema + DB connection
- `scripts/`: DB setup, seeding, model utilities
- `public/`: static assets (uploaded images)
- `models/`: ONNX model artifacts
- `runs/`: training/detection artifacts (local)

## Requirements

- Node.js 18+ (recommended)
- Postgres

## Environment variables

Create `.env.local` in the project root.

Required (based on code):

- `DATABASE_URL` — Postgres connection string
- `JWT_SECRET` — used by middleware JWT cookie verification

Example:

```bash
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/app_db
JWT_SECRET=change-me-to-a-32+chars-secret
```

## Database setup

Run the provided scripts:

```bash
node scripts/create-db.mjs
node scripts/seed.mjs
node scripts/verify-db.mjs
```

(If your deployment expects migrations, ensure they match the current `src/db/schema.ts`.)

## Run the app locally

```bash
npm install
npm run dev
```

Then open the URL shown by `next dev`.

## Build / lint / typecheck

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

## Model / inference notes

- `scripts/download-model.mjs` and `scripts/prewarm.mjs` help ensure inference assets are available.
- Inference is executed server-side in the API route(s) using the detection engine in `src/lib/`.

## Deploy notes

This is a server-side Next.js app with Postgres. Typical deployment options:

- Vercel/Render/Railway/Fly.io (ensure Node runtime + Postgres connectivity)

Ensure:

- `DATABASE_URL` and `JWT_SECRET` are set in the deployment environment
- model artifact files exist under `models/` (and any required weights exist)

## License

Add your license information here.
