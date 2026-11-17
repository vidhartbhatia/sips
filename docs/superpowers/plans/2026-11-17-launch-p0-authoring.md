# Launch P0: Authoring and Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** L. can log in on her phone and capture real review drafts (photos, cafe, drinks with optional scores, verdict) tomorrow, while the public site never shows placeholder data.

**Architecture:**
- Migration 008 extends the schema (verdict, per-visit cover, drink photos, nullable draft scores with a publish check, private wish list), and DB tests in PGlite pin it.
- Server actions validate publishing.
- Public queries list only reviewed cafes.
- One merged capture form replaces quick-add and review/new. It uploads resized photos one per request.
- The login page gains a 6-digit-code fallback.

**Tech Stack:** Next.js 16 App Router, Server Actions, Supabase (Postgres RLS, Storage, Auth), Tailwind 4, Vitest + PGlite (new, dev-only), Playwright smoke.

**Spec:** `docs/superpowers/specs/2026-11-17-launch-design.md`

## Global Constraints

- Every Server Action calls `requireAuth()` before mutating. Public reads use the anon client; RLS is the guardrail.
- Photos: private bucket and signed URLs through `lib/storage.ts` only. `photos.photo_url` holds an object path.
- No form pre-fills a score. Unscored is `null`, never `3` or `0`.
- Images are resized client-side with `lib/image-utils.ts` (max 2000px, JPEG 0.85), one photo per upload request.
- Commits use the noreply identity. Never use `--no-verify`. CI (typecheck, lint, build, smoke, secrets) must pass.
- Repo docs use initials (L./V.). Site content shows "Lea" / "Vids" from `profiles.display_name`.
- Coffee and matcha scope, but no coffee-only assumptions in names, routes or code.

## Review Focus

1. **A photo straight off an iPhone** (HEIC or a large JPEG, over 4.5 MB) uploads without a request-size error. Resize happens before upload, and HEIC goes through the browser canvas or fails with a clear message. *Owner: Task 6 test `resizes before upload`.*
2. **Publishing a draft with an unscored drink or no overall score** is rejected with a clear message, and the draft stays a draft. *Owner: Task 3 test `rejects publish without scores`, plus the DB check in Task 2.*
3. **A cafe with only draft reviews** is invisible on `/`, `/cafes`, `/cafes/[slug]` (404) and `/map`. *Owner: Task 4 smoke and query tests.*
4. **The magic link opened in a different browser** still lets her in through the 6-digit code. *Owner: Task 7 test.*
5. **Unpublishing the latest visit** moves the cafe cover to the previous published visit's cover, or to null, never to a draft photo. *Owner: Task 3 `syncCoverPhoto` tests.*

---

### Task 1: Repeatable DB and unit test harness

**Files:**
- Modify: `package.json` (devDependencies `vitest`, `@electric-sql/pglite`; script `"test": "vitest run"`)
- Create: `vitest.config.ts`, `tests/db/harness.ts`, `tests/db/migrations.test.ts`
- Modify: `.github/workflows/ci.yml` (run `npm test` in the `check` job before build)

**Interfaces:**
- Produces: `createTestDb(): Promise<{ db: PGlite; as(role: 'anon' | 'authenticated', userId?: string): Promise<void> }>`. It applies `supabase/migrations/*.sql` in order onto PGlite, with stubbed `auth` (`auth.users`, `auth.uid()`), `storage` (`storage.buckets`, `storage.objects`) and roles `anon` and `authenticated`.

- [ ] **Step 1: Failing test** `tests/db/migrations.test.ts`: `it('applies 001-007 cleanly and anon cannot read draft items')`. Insert a published cafe, a draft review and an item as superuser, switch to `as('anon')`, `select count(*) from public.items`, and expect `0`.
- [ ] **Step 2:** `npm test`. Expected: FAIL (no harness).
- [ ] **Step 3:** Implement `createTestDb`. Stubs: `auth.uid()` returns `current_setting('test.uid', true)::uuid`; `as()` runs `set role` plus `set test.uid`.
- [ ] **Step 4:** `npm test`. Expected: PASS. Run `npm run typecheck && npm run lint`: 0 errors.
- [ ] **Step 5:** Commit `test: PGlite migration harness + vitest`.

### Task 2: Migration 008

**Files:**
- Create: `supabase/migrations/008_launch_authoring.sql`, `tests/db/008.test.ts`

**Interfaces:**
- Produces:
  - Columns: `reviews.verdict text null`; `reviews.cover_photo_id uuid null references photos(id) on delete set null`; `photos.item_id uuid null references items(id) on delete set null`.
  - Nullable: `reviews.overall_rating`, `reviews.note`, `items.rating`.
  - Constraint `reviews_published_needs_rating check (status <> 'published' or overall_rating is not null)`.
  - Policy: `want_to_go` select allowed for admins only.
  - The migration is idempotent and runs in one transaction.

- [ ] **Step 1: Failing tests** in `tests/db/008.test.ts`:
  - `draft review with null overall_rating, note and item rating inserts`
  - `publishing a review with null overall_rating violates reviews_published_needs_rating`
  - `anon cannot select want_to_go; admin can`
  - `deleting a photo nulls reviews.cover_photo_id`
  - `re-applying 008 is a no-op`
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Write `008_launch_authoring.sql`.
- [ ] **Step 4:** `npm test`. Expected: PASS.
- [ ] **Step 5:** Commit `feat(db): migration 008 — verdict, per-visit cover, drink photos, draft-nullable scores`.

### Task 3: Types and server actions

**Files:**
- Modify: `lib/supabase/types.ts`, `lib/actions/reviews.ts`, `lib/actions/cafes.ts`, `lib/actions/photos.ts`, `lib/cover-photo.ts`
- Create: `lib/review-rules.ts`, `tests/unit/review-rules.test.ts`, `tests/unit/cover-photo.test.ts`

**Interfaces:**
- Consumes: the Task 2 schema.
- Produces:
  - `canPublish(review: { overall_rating: number | null }, items: { rating: number | null }[]): { ok: true } | { ok: false; reason: string }` in `lib/review-rules.ts`.
  - `createReviewDraft(input: { cafe_id: string; date_visited: string; overall_rating: number | null; verdict: string | null; note: string | null; items: DraftItem[] }): Promise<{ error: string | null; reviewId?: string }>`. It always creates `status: 'draft'` and sets `author_id` from `requireAuth()`.
  - `DraftItem = { name: string; category: 'drink' | 'food'; type: string | null; rating: number | null; is_favorite: boolean; notes: string | null }`.
  - `addReviewPhoto(reviewId: string, formData: FormData /* one file */, opts?: { itemId?: string }): Promise<{ error: string | null; photoId?: string }>`. One file per call.
  - `setReviewCover(reviewId: string, photoId: string): Promise<{ error: string | null }>`.
  - `publishReview(reviewId: string)`. It runs `canPublish`, then sets the status, then `recalculateCafeRating` and `syncCoverPhoto`.
  - `syncCoverPhoto(supabase, cafeId)`: the cover becomes the `cover_photo_id` photo of the latest published visit (by `date_visited`, then `created_at`). Its fallback is the oldest photo of that visit; otherwise null.
  - `createCafe` stops writing `overall_rating: 0` (null) and `status` stays `'published'` (listing is gated on reviews in Task 4).

- [ ] **Step 1: Failing tests:**
  - `review-rules.test.ts`: `rejects publish without overall` (reason mentions "overall"), `rejects publish when any drink unscored`, `allows publish with all scores`.
  - `cover-photo.test.ts` (fake client, as in the PR #5 harness): `uses latest published visit cover_photo_id`, `ignores draft visits`, `falls back to previous published visit when latest is unpublished`, `null when no published photos`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement the signatures above. Keep `updateReview`'s field whitelist and add `verdict`.
- [ ] **Step 4:** `npm test && npm run typecheck && npm run lint`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: draft-first review actions, publish rules, per-visit cover`.

**PR A = Tasks 1–3.** The coordinator applies 008 to production after a read-only pre-check, then merges.

### Task 4: Public gating and honest empty states

**Files:**
- Modify: `lib/supabase/queries.ts` (`getCafes`, `getCafeBySlug`, `getCafesForMap`, the home "recent" query), `components/home/HomeContent.tsx`, `components/cafes/CafeGrid.tsx`, `components/cafes/CafeDetail.tsx`, the score label component (remove the `3` fallback), `proxy.ts` (admin-only `/want-to-go`, `/design-system`, `/design-preview`), `e2e/smoke.spec.ts`

**Interfaces:**
- Consumes: Task 3 types.
- Produces: public queries return only `published` cafes with at least one `published` review. `getCafeBySlug` returns `null` (404) otherwise.

- [ ] **Step 1: Failing tests:**
  - `tests/db/gating.test.ts`, as anon through RLS: a cafe with only a draft review is excluded by the listing SQL used in `queries.ts`. Extract the filter into a SQL view or a shared query function the test can call.
  - `e2e/smoke.spec.ts`:
    - `cafes index shows only reviewed cafes or the empty state`
    - `no "3 sips" placeholder text anywhere`
    - `/want-to-go redirects to /login when logged out`
    - `/design-system redirects to /login`
- [ ] **Step 2:** Run `npm test` and `npm run test:e2e`. Expected: FAIL.
- [ ] **Step 3:** Implement.
  - Empty state copy: home and `/cafes` show "First reviews soon." with the existing coffee-cup illustration.
  - Unreviewed cafes show no score and no empty dividers.
  - Remove the "Explore the Map" home CTAs and the `/map` nav link (keep the route).
- [ ] **Step 4:** Run `npm test`, `npm run test:e2e` and `npm run build`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: list only reviewed cafes; empty states; gate private pages`.

**PR B = Task 4.** After it's live, the coordinator runs the data cleanup (Task 5) and re-runs smoke on production.

### Task 5: Data cleanup (coordinator, production)

- [ ] **Step 1:** Read-only pre-check: the three seed reviews, their 9 items, and the cafes `Oat & Sage` and `Bricks & Mortar Coffee` exist, with 0 other reviews on them.
- [ ] **Step 2:** In one transaction:
  - delete items where `review_id` is one of the 3 seed reviews;
  - delete those reviews;
  - delete the 2 seed cafes;
  - set `vibe_tags = '{}'` on `elm-coffee-roasters`;
  - set `display_name` to `'Lea'` / `'Vids'` on the admin profiles.
- [ ] **Step 3:** Verify that `reviews`, `items` and `photos` are 0, that there are 11 cafes, and that the anon REST listing is empty. Re-run CI smoke on `main`.

### Task 6: Merged capture form

**Files:**
- Create: `app/admin/capture/page.tsx`, `components/admin/capture/{CafePicker,DrinkList,PhotoPicker,ScoreInput}.tsx`, `tests/unit/upload-queue.test.ts`, `lib/upload-queue.ts`
- Modify: `app/admin/quick-add/page.tsx` and `app/admin/review/new/page.tsx` become `redirect('/admin/capture')`; the admin nav and dashboard links point to `/admin/capture`.

**Interfaces:**
- Consumes: `createReviewDraft`, `addReviewPhoto`, `setReviewCover`, `searchCafes`, `createCafe`.
- Produces: `uploadQueue(files: File[], upload: (f: Blob) => Promise<{ photoId?: string; error: string | null }>, resize: (f: File) => Promise<Blob>): Promise<{ photoIds: string[]; failures: { name: string; error: string }[] }>`. It runs sequentially, one request per photo.

- [ ] **Step 1: Failing tests** `upload-queue.test.ts`:
  - `resizes before upload` (the `resize` spy is called before `upload` for each file);
  - `uploads one file per call, in order`;
  - `continues after a failure and reports it`.
- [ ] **Step 2:** `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement the form on one mobile-first page.
  - Sections, in order: photos (several, from the library or camera, with no `capture` attribute), cafe, drinks, overall score, verdict, optional note.
  - "Save draft" creates the draft, then runs `uploadQueue`, sets the first photo as cover, and links photos chosen per drink via `itemId`.
  - Scores are optional (`ScoreInput` has an unset state).
  - After saving, go to the review's edit page.
- [ ] **Step 4:** Run `npm test`, `npm run build` and `npm run typecheck`.
  - Then test manually on the PR's Vercel preview: as an admin, capture a throwaway draft on a draft cafe with one real large iPhone photo, confirm the photo stored and signed, then delete the draft.
  - Expected: PASS, with the upload under the limit.
- [ ] **Step 5:** Commit `feat: merged mobile capture form with resized one-per-request uploads`.

### Task 7: Login code fallback

**Files:**
- Modify: `app/login/page.tsx`
- Create: `e2e/login.spec.ts`

**Interfaces:**
- Consumes: `supabase.auth.verifyOtp({ email, token, type: 'email' })`.

- [ ] **Step 1: Failing e2e** `login page offers a 6-digit code field after sending`. Mock the network: route `**/auth/v1/otp` to `200 {}`. After submitting an email, the page shows "Enter the 6-digit code" with an `inputmode="numeric"` field.
- [ ] **Step 2:** `npm run test:e2e -- e2e/login.spec.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement the code entry. On success go to `/admin`; on failure show "That code didn't work. Request a new link."
- [ ] **Step 4:** `npm run test:e2e`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: login code fallback for in-app mail browsers`.
- [ ] **Step 6 (coordinator, dashboard):** in the Supabase Auth email template "Magic Link", add `Or enter this code: {{ .Token }}`. Verify with a real email to V.

### Task 8: L.'s skills

**Files:**
- Modify: `.agents/skills/sips-design-loop/SKILL.md`, `.agents/skills/publish-post/SKILL.md`

- [ ] **Step 1:** Document the capture flow at `/admin/capture` and the photo guidance from the spec (hero 3:2 landscape, drinks 4:5 at about 45°, window light, three or more photos). Claude helps write the verdict and story, which she pastes into the form. Stories stay MDX with `publish-post`.
- [ ] **Step 2:** Commit `docs(skills): capture flow + photo guidance`.

### Follow-up wave (separate plan, within 1–2 days)

These come after L. is capturing: the full `ReviewEditForm` (drinks, photos, cover, verdict, publish or unpublish), the admin draft preview, then P1 (the layout-A review page, visual system, illustrations, Stories). Each gets its own plan from the spec.
