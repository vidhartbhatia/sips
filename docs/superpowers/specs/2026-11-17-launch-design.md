# Sips launch design (2026-11-17)

## Intent

Sips is a cafe journal by V. and L. L., a UX designer, is the main author. She starts writing her
review backlog **tomorrow**. Launch means a public site with ~5 real, polished reviews and a look
that holds together. Until 10+ real reviews exist, every change serves writing or reading
reviews. Nothing speculative.

## Goals

- L. can capture a review from her phone at the cafe in about a minute, then finish it on her
  laptop.
- A published review reads like a short, beautiful blog post about one cafe visit.
- The site looks cohesive: one illustration pen, readable scores, no placeholder content.
- L. can write free-form **Stories** (blog posts) at her laptop with Claude Code.

## Non-goals (for now)

- Cocktail bars or dessert spots: they come later, so nothing coffee-only gets baked into the
  name, layout or code.
- A discovery map. It becomes a "where we've been" tracker after 10+ reviews.
- A rich-text editor, search, comments, accounts beyond the two authors.

## Anti-goals

- Placeholder data or fake scores visible publicly (for example the "3 sips" fallback).
- Blocking L. on polish work: drafts are private, so she writes in the current look.
- Claude writing to the production database directly.

## Approaches considered

1. **Content first** (chosen): fix the writing flow first so L. can start drafting, and build
   the review page, visual cleanup and illustrations in parallel. Launch at ~5 polished reviews.
   The design is checked against real content.
2. Polish first, then the writing flow: rejected, because real writing starts later and the
   design gets built around placeholders.
3. One big release: rejected, because it's the riskiest and hardest to review.

Writing format: **hybrid**. Structured reviews (layout A) come from the phone or admin form. Free-form
Stories (layout B) are MDX files in `content/blog/`, written at the laptop with Claude Code
(`publish-post` skill).

## Decisions made

- **Scope:** coffee and matcha cafes. Listing only reviewed cafes publicly already hides the
  bar and dessert places, so none are set to draft (a hidden cafe would also disappear from
  the capture form's cafe search).
- **Public at launch:** home, `/cafes`, `/cafes/[slug]` (the review page), `/about`, and
  `/stories` (the renamed `/blog`) once the first story is published.
- **Hidden:** `/map` (route kept; no nav link or home CTA). `/want-to-go`, `/design-system`
  and `/design-preview` require admin auth.
- **Only cafes with at least one published review are listed publicly.** With zero reviews,
  home and `/cafes` show a graceful empty state ("First reviews soon"), never placeholder cards.
- **Data cleanup** (owner approved permanent deletion): delete the 3 seed reviews and their items.
  Delete the seed cafes "Oat & Sage" and "Bricks & Mortar Coffee". Keep Elm Coffee Roasters, but
  clear its seeded vibe tags.
- **Names** (owner decision): the authors appear publicly by first name, as **Lea** and
  **Vids**.
  - Set `profiles.display_name` to "Lea" and "Vids". Bylines read "by Lea".
  - About names them, with no photos.
  - Repo docs and agent files keep using initials (L./V.). Only site content uses the names.
- **Rating:** each drink is a whole number 1–5. Each visit gets one overall 1–5 from its author.
  The cafe score is the mean of published visits rounded to 0.5 (`lib/ratings.ts`). It's shown
  as an IBM Plex Mono numeral in espresso, with a muted "/5". No pink cups, hearts or "yum!".
  The scale is explained on About: 5 go out of your way, 4 we'd return, 3 fine, 2 skip, 1 no.
- **Review page = `/cafes/[slug]`, layout A.**
  - Hero photo (3:2), then a metadata line (NEIGHBOURHOOD · MONTH YEAR · BY LEA).
  - Cafe name in Caveat, verdict in Instrument Serif italic, large score.
  - "What we tried": drink photo (4:5), name, category, one-line note, score; ♥ for favourites.
  - The story (1–4 paragraphs) and a photo strip.
  - Byline, tags, address with a Maps link, and earlier visits.
  - The mobile layout is one column in the same order.
  - **Several visits:** the latest published visit leads the page (hero, verdict, byline,
    drinks, story). Earlier visits appear below as compact cards (date, author, verdict, score,
    drinks), expanding in place. No per-visit route at launch. The header score is always the
    cafe score; at one visit it equals that visit's score, and from two visits it shows a count
    ("4.5 · 2 visits").
- **Schema (migration 008, applied before the code that needs it):**
  - `reviews.verdict text` (nullable).
  - `reviews.cover_photo_id uuid`, a nullable reference to `photos(id)`. **The hero is per
    visit.** The cafe's public cover is the latest published visit's cover. `syncCoverPhoto`
    changes from "oldest published photo" to "latest published visit's cover", still through
    the public cover gate in `queries.ts`.
  - `photos.item_id uuid`, a nullable reference to `items(id)`, so drink photos are ordinary
    `photos` rows, signed and cleaned up like the rest. `items.photo_url` stays unused.
  - **Scores and note are optional while drafting:** `reviews.overall_rating`, `reviews.note`
    and `items.rating` become nullable. A check constraint requires `overall_rating` when
    `status = 'published'`. Publishing also requires a score on every drink (checked in the
    server action). No form pre-fills a score, and `createCafe` stops writing
    `overall_rating: 0`.
  - The `want_to_go` select policy is admin-only (private data, not only a hidden page).
- **Authoring:**
  - One merged **capture form** for phone and desktop: several photos, cafe (search or create),
    drinks (name, category, score, favourite, optional note, optional photo), overall score,
    verdict, optional note. It always saves a **draft**.
  - Finish `ReviewEditForm`: add, edit or remove drinks, add or remove photos, attach a photo
    to a drink, pick the cover, edit verdict and prose, publish or unpublish.
  - Admin **draft preview** renders the review page for a draft.
  - Delete `quick-add` and `review/new` once the merged form works (or redirect them to it).
  - The upload input must allow the photo library as well as the camera (no forced `capture`).
  - **Photo uploads:** resize every photo client-side (`lib/image-utils.ts`, max 2000px,
    JPEG 0.85) and upload one photo per request, to stay under Vercel's request-body limit.
    Production has never stored a review photo, so this path gets an end-to-end test on a
    throwaway draft.
- **Login from the phone:** the magic link only completes in the browser that requested it, so
  tapping it in a mail app's in-app browser can fail. Add a fallback: the login page accepts
  the 6-digit email code (`verifyOtp`), and the Supabase magic-link email template includes
  `{{ .Token }}`.
- **Visual system:** keep "Ink & Paper".
  - Caveat for names and titles only. Instrument Serif for verdicts. Mono for scores and
    metadata, 11px minimum.
  - Contrast: terracotta only at 24px and up; buttons and small links use a darker terracotta
    (≥4.5:1 on cream); sage and pink are never used for text.
  - Remove every entrance fade and stagger animation; content renders visible from the server.
    Keep short hovers. Use `useMotionSafe`.
  - Remove double frames, and use one divider per page.
- **Illustrations:**
  - Regenerate one cohesive set of 4 on a single sheet with Codex image generation (gpt-image),
    so they share one pen: logo cup, cafe table scene, cat with cup, stacked cups.
  - Pipeline: crop, threshold, potrace, colour `#2C2420`, no background, SVGO, then check on
    cream at 64px and 240px.
  - The rating glyph is hand-coded SVG.
  - Delete the unused illustration files and the dead `InkIllustrations.tsx`.
  - Style prompt: "Four separate spot illustrations on one sheet, pure white background, pure
    black ink. One felt-tip pen of uniform medium line weight, round ends, smooth confident
    continuous contours, no shading, no hatching, no fills, no texture, no text. Three-quarter
    view from slightly above, minimal detail, generous spacing."
  - The owner picks from the candidates before anything ships.
- **Illustration direction (owner decision, 2026-11-17, after comparing samples):**
  - Style B: espresso ink (`#2C2420`) in **clean, smooth, confident fineliner lines** (round-1
    sample B; the rougher round-2 line was rejected), with a subtle hand-drawn quality but no
    sketchy strokes. Accents are flat and sparing: **sage green `#8BAA8F` and terracotta
    `#C4735B`**. The theme is coffee **and** matcha: matcha is sage, coffee is espresso or
    terracotta.
  - **Signature hero:** an ink-and-watercolour scene (rainy Seattle window, cortado and iced
    matcha, notebook, plants) in the palette. It must **blend into the home page**, not sit in a
    box: soft edges fading into cream, no frame, and the composition leaves room for the
    headline.
  - **One aesthetic across the site:** add the same-pen supporting assets that make the page feel
    designed rather than templated:
    - small drink and category doodles (coffee, matcha, tea, pastry; a cocktail glass later);
    - hand-drawn dividers;
    - a few section ornaments;
    - an About illustration and the empty-state and 404 spots.
  - Each asset gets 2–3 candidates; the owner picks.
  - This supersedes the 4-asset list above.
- **Photo guidance for L.** (goes into her skills): window light, no flash or filters. The hero
  is landscape and cropped 3:2. Drinks are portrait 4:5 at about 45°. Aim for three or more
  photos per review.
- **Claude's role:**
  - Stories: drafts MDX from her notes and opens a PR.
  - Reviews: helps her write the verdict and prose, and turns her notes into form fields. She
    enters or confirms them in the admin.
  - No direct database writes.

## Constraints

- Hard rules from `AGENTS.md`: RLS, `requireAuth`, private photos with signed URLs (`lib/storage.ts`),
  the nonce CSP, noreply commits, and CI (typecheck, lint, build, smoke tests).
- The migration is applied by the coordinator after a read-only pre-check, before the code that
  needs it merges.
- Smoke tests must be updated for the new empty states and hidden routes.
- The repo is public: no personal data in content, copy or commits.

## Order of work

1. **For tomorrow (P0), in this order:**
   1. Migration 008 plus types and server actions, as one PR.
   2. Public gating: reviewed-only listing, empty states, removing the "3 sips" fallback, the
      `createCafe` fix, and smoke tests updated.
   3. Data cleanup, only after gating is live, then re-run the smoke tests.
   4. Merged capture form with resized single-photo uploads, and the login-code fallback.
   5. L. logs in on her phone and captures her first draft.
   - The edit form, draft preview and skill updates follow within a day or two. Drafts stay
     private meanwhile.
2. **Before public launch (P1, in parallel):** review page (layout A), home and cafes empty and
   thin states, route hiding, removed motion, contrast fixes, illustration set, Stories rename
   and nav.
3. **Launch gate (impeccable):**
   - Run an impeccable `audit` (accessibility, performance, theming, responsive,
     anti-patterns) and a `critique` across the public pages on desktop and 375px.
   - Fix P0 and P1 findings.
   - Then run a final `polish` pass on the review page against L.'s first real reviews.
   - Retake the README screenshots with real reviews (the current cafe shot shows seed data).
   - Share the site publicly only after this gate.
4. **After 10+ reviews:** "where we've been" map, want-to-go, bars.

Design work in steps 1–2 uses the impeccable skills (`shape`, `typeset`, `arrange`, `polish`)
and stays within `.impeccable.md`.

## Left to the builder

Component structure; how to share the capture and edit form pieces; preview route shape; exact
spacing and type sizes within the stated system; the vectorization tooling; test details.
