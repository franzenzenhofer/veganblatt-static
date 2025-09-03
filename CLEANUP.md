# Codebase Cleanup Plan

Status: Proposal only (no code changes). Each item has clear steps, rationale, and suggested ownership.

## 1) Lint Rules: Right‑size max-lines and any
- Problem: Dozens of warnings (max-lines, `any`) clutter CI output; rules are unrealistically strict for generators.
- Why it matters: Noise hides real issues; contributors ignore lint.
- Steps:
  - Reduce `max-lines` threshold to 300 or disable for generators and scripts.
  - Allow `any` in template/generator boundaries via `overrides` in `eslint.config.js`.
  - Enforce meaningful rules (no-unused-vars, no-undef) remain on.
- Deliverable: Updated `eslint.config.js` with overrides + a “lint policy” blurb in README.

## 2) Post‑deploy script portability
- Problem: `post-deploy-check.sh` uses `date +%s%N` math; on macOS/BSD this yields non‑portable values (we saw arithmetic errors).
- Why: Flaky CI signal; misleading “slow!” output.
- Steps:
  - Replace nanosecond timing with `python - <<PY` or `node -e` high‑res timer, or use `curl -w %{time_total}`.
  - Keep logic simple: record float ms, compare against thresholds.
- Deliverable: Portable timing; remove arithmetic errors; keep same output format.

## 3) Redirects as code
- Problem: Extensionless redirects are currently handled at Cloudflare edge implicitly; policy lives outside repo.
- Why: Hard to reason/port. New environments may miss rules.
- Steps:
  - Add a `_redirects` file in `public/` to map `/*.html  /:splat  308` plus specific legacy routes.
  - Ensure `scripts/add-cache-busting.ts` preserves `_redirects` on deploy.
- Deliverable: Versioned, repo‑backed redirect rules; keep Worker for apex→www.

## 4) Secrets and tokens hygiene
- Problem: `SECRET_ACCESS.md` exists locally with live tokens (good it’s ignored, but risk persists).
- Why: Accidental disclosure risk; rotation policy unclear.
- Steps:
  - Move to `.env` with `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`; document setup in README.
  - Rotate and scope tokens: Pages Edit, Workers Edit, Routes Edit, DNS Read for veganblatt.com only.
  - Add a minimal script to validate token scopes before deploy.
- Deliverable: `.env.example` + docs; token scope checker.

## 5) Build pipeline structure
- Problem: Many scripts in `src/scripts` and `scripts/` intermix concerns; tests live in two trees.
- Why: Discoverability and maintenance friction.
- Steps:
  - Consolidate runtime scripts under `scripts/` (bash) and `src/tools/` (TS/Node).
  - Move tests under `tests/` with subfolders: `unit/`, `integration/`, `e2e/`.
  - Add a single `npm run validate` that shells out to the right places (already present; rewire to new layout).
- Deliverable: Clear folder topology; updated package scripts.

## 6) Site generator refactor planning
- Problem: Generators and processors are large single files (100–200+ lines) with repeated patterns (HTML assembly, image handling).
- Why: Hard to read, test, and extend.
- Steps:
  - Extract shared helpers: HTML tag builders, canonical URL builder, meta tag factory, image path resolver.
  - Introduce small, typed interfaces for content nodes; eliminate ad‑hoc `any` at boundaries.
  - Add unit tests for helpers before moving generators.
- Deliverable: `src/lib/` with helpers + tests; generators slimmed without behavior change.

## 7) Caching and assets
- Problem: `_headers` is auto‑generated but cache rules are embedded in TS; images outside `i/assets/` use short caching.
- Why: Harder to tweak in ops; potential over/under‑caching.
- Steps:
  - Externalize cache policy to a small JSON/YAML consumed by `add-cache-busting.ts`.
  - Audit large images; add size checks and optional compression step.
  - Consider immutable caching for versioned HTML assets if safe.
- Deliverable: `config/cache-rules.json`; documented knobs.

## 8) Wrangler config sanity
- Problem: `wrangler.toml` has a future `compatibility_date` (2025-09-02) and minimal Pages config.
- Why: Future dates can surprise; missing explicit `pages_build_output_dir` is set but no envs.
- Steps:
  - Pin `compatibility_date` to a known good recent date; document bump policy.
  - Add `[env.production]` and `[env.preview]` stanzas if we later need functions/secrets.
- Deliverable: Stable wrangler config; changelog note.

## 9) CI/CD and “stop when green” guards
- Problem: Past deploys continued while prod was healthy, causing regressions.
- Why: Lacked preflight checks and an explicit “abort if prod healthy and no diff” option.
- Steps:
  - Add a preflight: compare `version.json` and git diff; if no content diffs, skip deploy (with override flag).
  - Add domain binding assertion (already added) as a hard gate.
  - Record deployment URL and alias in artifacts/log.
- Deliverable: Safer deployment with skip‑when‑no‑changes.

## 10) Documentation and contributor guide
- Problem: Scattered docs; `.md` files mostly ignored via `.gitignore`.
- Why: Contributors don’t see process; docs changes blocked by ignore rules.
- Steps:
  - Create `docs/` directory; adjust `.gitignore` to allow `docs/**/*.md`.
  - Move DEPLOY.md, MAINTENANCE.md, etc. into `docs/` (or whitelist explicitly).
  - Add quickstart: build, test, deploy, token setup.
- Deliverable: Organized docs; easier onboarding.

## 11) Redirect policy as tests
- Problem: No automated verification of redirect matrix.
- Why: Regressions are silent.
- Steps:
  - Add `scripts/check-redirects.sh` to assert expected chains (http→https, apex→www, .html→extensionless 308→200).
  - Wire into `npm run test:live` and CI (non‑blocking).
- Deliverable: One‑command redirect checks; surfaced in CI output.

## 12) Data hygiene for content
- Problem: Detected absolute image URLs and mixed http/https.
- Why: Potential mixed content; redirect hops; SEO.
- Steps:
  - Add a content linter pass to normalize image links to https and local `/i/` where possible.
  - Emit a report of external assets still referenced.
- Deliverable: Stable content transform; report file under `logs/`.

---

### Sequencing Proposal (2–3 days work in small PRs)
1. Lint/CI right‑sizing (1,2,9,11)
2. Docs + tokens hygiene (4,10)
3. Redirects as code (3) and tests (11)
4. Post‑deploy portability fix (2)
5. Refactor helpers groundwork (6,7)
6. Wrangler/infra tidy (8)
7. Content linter (12)

