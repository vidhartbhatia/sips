# Gotchas

Known quirks for Sips. Add new ones at the bottom: date, the symptom, the rule, and why.

## 2026-04 — Duplicated rating-recalc logic

`lib/actions/admin.ts::deleteReview` originally had its own inline rating average that returned `0` when the last review was deleted, while the then-canonical `recalculateRating()` in `lib/actions/reviews.ts` correctly returned `null`.

**Rule:** Any rating-mutating path MUST produce `null` for zero reviews so the UI can distinguish "no data" from a literal 0 rating. Call `recalculateCafeRating()` from `lib/ratings.ts`; don't write another average.

**Fix:** the logic now lives once in `lib/ratings.ts` (`averageRating()` + `recalculateCafeRating()`: published reviews only, rounded to 0.5, zero reviews → `null`), and both `reviews.ts` and `admin.ts` import it. It's a plain module on purpose: exporting a helper from a `"use server"` file would turn it into a public Server Action endpoint.

## 2026-04 — CSP header invisible on first-hit curl

Setting `Content-Security-Policy` via Next.js middleware + `next.config.ts` works correctly, but `curl -I https://oursips.com/` may not show the header on the very first hit because Vercel routes through CDN edge first. The response is dynamic SSR (`cache-control: private, no-cache, no-store, max-age=0, must-revalidate`) so the header is set by the runtime, not the edge cache.

**Verification pattern:** Wait 20-30s after deploy, then re-curl. If still missing, hit a deeper path like `/cafes` which forces middleware execution.

## 2026-04 — Vercel env vars default to Production scope only

Adding an env var with `npx vercel env add VARNAME` defaults to Production. Preview deploys will throw `MIDDLEWARE_INVOCATION_FAILED` because the var is missing.

**Fix:** Always add to Preview scope explicitly: `npx vercel env add VARNAME preview --value "..." -y`.

## 2026-11 — Merging on GitHub leaks the account email

`gh pr merge` and the web UI's merge button write the merge commit with the GitHub *account*
email, not the noreply address. In a public repo that email is then permanent: a history rewrite
doesn't purge it, because GitHub keeps orphaned commits reachable by SHA.

**Rule:** merge locally (`git merge --no-ff`), run `npm run verify`, then push. Keep GitHub email
privacy and "block pushes that expose my email" on.

## 2026-11 — A phone photo failed after every check passed

Unit tests, CI and Codex all passed, but the first real upload from an Android phone failed: the
browser couldn't decode the camera JPEG for resizing, so the photo never left the phone. Fixed
with a second decoder and an "upload the original if it's small" fallback. The root cause on
that phone was never confirmed.

**Rule:** for anything that handles real devices or real files (uploads, login on a phone), a
passing test suite isn't done. Do one real end-to-end try on a phone (preview or production with
a throwaway draft, then delete it) before calling it shipped. iPhone HEIC is still unconfirmed
until L.'s first upload.

## 2026-11 — Typecheck errors after a route rename, pushed anyway

After `/blog` became `/stories`, `tsc` reported errors from stale generated route types in
`.next/types`. The build regenerated them and the push went out on "the build passed".

**Rule:** use `npm run verify` (runs `next typegen` first, then tsc, lint, tests and build, and
stops on the first failure). The pre-push hook runs it on every push to `main`.

## 2026-11 — Reviews that review the wrong thing, or never finish

- A Codex review covered a commit older than the PR head, so the last change went unreviewed.
- `codex exec` waited on stdin for hours with no CPU use.
- A `while pgrep -f "codex exec"` wait loop never exited, because its own command line matched.

**Rule:** run Codex through `scripts/with-timeout.sh` (closes stdin, kills the whole process tree
on timeout), pin the head SHA, and wait on the background task, never on `pgrep`. Details are in
`.agents/skills/cross-model-review/SKILL.md`.

## 2026-11 — What the test setup can't see

- **PGlite DB tests run the SQL but not PostgREST.** An ambiguous embed (two foreign keys between
  `reviews` and `photos` after migration 008) or a missing grant on a view only shows up through
  the real API. The `signed-in` CI job now runs the real API on a local Supabase stack for the
  golden path (login, capture with a photo, publish, public page). For queries outside that
  path, check them against the API too, not just in PGlite.
- **Signed-in flows beyond the golden path** (editing drinks, photo removal, draft preview,
  unpublish) have unit tests only. Extend `e2e/signed-in/` when one of them breaks or changes
  shape, rather than all at once.
- **Real phones are still a human check.** CI uses a canvas-made JPEG, not a camera file, so the
  first iPhone HEIC upload still gets a look.
- **Some smoke tests skip until a cafe is published.** They first run for real on L.'s first
  publish, so watch CI on that day.
- **If production breaks after a merge,** roll back first (`vercel rollback`, or promote the
  previous deployment in the Vercel dashboard), then fix forward on a branch. A rollback doesn't
  undo a database migration, so migrations stay additive.
