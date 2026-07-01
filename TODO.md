# TODO — File organization + README (no code changes)

## Step 1: Inventory & mapping
- [x] Identified current top-level structure (src/, scripts/, public/, models/, runs/).
- [x] Reviewed key files for routing/db usage: middleware, db schema/index, inspect API route, dashboard page, root layout.
- [ ] Review remaining route files to ensure no path assumptions beyond existing `src/app/**` layout.

## Step 2: Decide target folder structure
- [ ] Create a conventional layout plan:
  - Keep Next route paths intact (do not change code), but reorganize files within `src/app`, `src/lib`, `src/components` using moves that do NOT affect import paths.
  - If moves would change import paths, limit reorg to creating subfolders and moving only files that are imported via relative paths or alias-stable paths.

## Step 3: Implement reorganization (safe moves)
- [ ] Move components into feature subfolders only if import paths remain valid.
- [ ] Move lib utilities into more specific folders only if imports remain valid.
- [ ] Move scripts/models/artifacts into structured directories (e.g., `scripts/` subfolders) only if scripts don’t rely on relative paths.
- [ ] Organize `public/uploads/` into subfolders (only if no code depends on exact filenames/paths).

## Step 4: Add/Update README
- [ ] Create root `README.md` describing:
  - What this app does
  - Requirements (Node/Postgres)
  - Environment variables
  - DB setup (create-db/seed)
  - How to run the app
  - Model/artifact download & warmup
  - Deployment notes

## Step 5: Validation
- [ ] Run `npm run lint`
- [ ] Run `npm run typecheck`
- [ ] Run `npm run build`


