# Gotchas

Known quirks for Sips. Add new ones at the bottom: date, the symptom, the rule, and why.

## 2026-04 — Duplicated rating-recalc logic

`lib/actions/admin.ts::deleteReview` originally had its own inline rating average that returned `0` when the last review was deleted, while the then-canonical `recalculateRating()` in `lib/actions/reviews.ts` correctly returned `null`.

**Rule:** Any rating-mutating path MUST produce `null` for zero reviews so the UI can distinguish "no data" from a literal 0 rating. Call `recalculateCafeRating()` from `lib/ratings.ts`; don't write another average.

**Fix:** the logic now lives once in `lib/ratings.ts` (`averageRating()` + `recalculateCafeRating()`: published reviews only, rounded to 0.5, zero reviews → `null`), and both `reviews.ts` and `admin.ts` import it. It's a plain module on purpose: exporting a helper from a `"use server"` file would turn it into a public Server Action endpoint.

## 2026-04 — CSP header invisible on first-hit curl

Setting `Content-Security-Policy` via Next.js middleware + `next.config.ts` works correctly, but `curl -I https://oursips.com/` may not show the header on the very first hit because Vercel routes through CDN edge first. The response is dynamic SSR (`cache-control: private, no-cache, no-store, max-age=0, must-revalidate`) so the header is set by the runtime, not the edge cache.

**Verification pattern:** Wait 20-30s after deploy, then re-curl. If still missing, hit a deeper path like `/cafes` which forces middleware execution.

## 2026-04 — `gh pr merge` clobbers dirty working tree

When the PR branch is checked out locally AND has uncommitted changes, `gh pr merge --squash --delete-branch` succeeds on GitHub but fails the local branch-switch cleanup with `error: Your local changes to the following files would be overwritten by checkout`. Merge still happens — only the local cleanup fails.

**Recovery pattern:**
```bash
git stash push -m "pre-merge" -- <specific files>
git checkout main && git pull --rebase origin main
git stash pop
# now resolve any local-only changes that weren't in the PR
```

## 2026-04 — Vercel env vars default to Production scope only

Adding an env var with `npx vercel env add VARNAME` defaults to Production. Preview deploys will throw `MIDDLEWARE_INVOCATION_FAILED` because the var is missing.

**Fix:** Always add to Preview scope explicitly: `npx vercel env add VARNAME preview --value "..." -y`.
